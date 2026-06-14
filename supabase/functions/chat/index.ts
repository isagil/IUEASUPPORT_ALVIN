import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Alvin, a helpful student support assistant for IUEA (International University of East Africa).
Always introduce yourself as Alvin when greeting users.
You help students with questions about: registration, fees, academic matters, accommodation, library,
health services, career services, and general university life.
Be friendly, concise, and helpful. If you don't know something specific to IUEA, say so honestly
and let the student know a support ticket will be created and routed to the right department.`;

const DEPARTMENTS: Record<string, string> = {
  "Academic Support": "Academic Affairs Office",
  "Technical Issues": "ICT Services Department",
  "Financial Services": "Finance Office",
  "Registration & Enrollment": "Registrar's Office",
  "Accommodation": "Student Housing Office",
  "Library Services": "University Library",
  "Health & Wellness": "Student Health Services",
  "Career Services": "Career Development Center",
  "General Inquiry": "Student Affairs Office",
  "Other": "Student Affairs Office",
};

const CAT_CODES: Record<string, string> = {
  "Academic Support": "aca", "Technical Issues": "tec", "Financial Services": "fin",
  "Registration & Enrollment": "reg", "Accommodation": "acc", "Library Services": "lib",
  "Health & Wellness": "hea", "Career Services": "car", "General Inquiry": "gen", "Other": "oth",
};

function calculateSimilarity(query: string, question: string): number {
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const qs = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const matches = q.filter((w) => qs.includes(w));
  return matches.length / Math.max(q.length, 1);
}

function detectNeedsTicket(text: string): boolean {
  const t = text.toLowerCase();
  return /contact|visit (the )?office|unable to help|create a (support )?ticket|don't know|i'm not sure|i do not have|cannot provide/.test(t);
}

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/fee|tuition|payment|pay|invoice|finance|bursar/.test(t)) return "Financial Services";
  if (/register|registration|enroll|enrol|course selection/.test(t)) return "Registration & Enrollment";
  if (/hostel|accommodation|dorm|room|residence/.test(t)) return "Accommodation";
  if (/library|book|borrow/.test(t)) return "Library Services";
  if (/health|clinic|sick|medical/.test(t)) return "Health & Wellness";
  if (/career|job|internship/.test(t)) return "Career Services";
  if (/wifi|portal|password|login|system|technical|computer|laptop|moodle/.test(t)) return "Technical Issues";
  if (/exam|grade|gpa|lecturer|class|study|transcript|results/.test(t)) return "Academic Support";
  return "General Inquiry";
}

function suggestedActions(category: string | null): string[] {
  const base = ["How do I register for courses?", "How do I pay tuition fees?", "Where is the library?"];
  if (!category) return base;
  if (category.includes("Financial")) return ["Where is the Finance Office?", "What payment methods are accepted?", "Can I pay in installments?"];
  if (category.includes("Academic")) return ["How do I view my results?", "What if I miss an exam?", "How do I get a recommendation letter?"];
  if (category.includes("Registration")) return ["How do I get a student ID?", "How to apply for leave of absence?", "When does registration open?"];
  return base;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, session_id, student } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let sid = session_id as string | undefined;
    if (!sid) {
      sid = crypto.randomUUID();
      await supabase.from("conversation_sessions").insert({ session_id: sid });
    } else {
      const { data: existing } = await supabase.from("conversation_sessions").select("session_id").eq("session_id", sid).maybeSingle();
      if (!existing) await supabase.from("conversation_sessions").insert({ session_id: sid });
      else await supabase.from("conversation_sessions").update({ last_activity: new Date().toISOString() }).eq("session_id", sid);
    }

    await supabase.from("chat_messages").insert({ session_id: sid, content: message, role: "user" });

    const { data: kb } = await supabase.from("knowledge_base").select("*");
    let bestMatch: any = null;
    let bestScore = 0;
    for (const e of kb || []) {
      const s = calculateSimilarity(message, e.question);
      if (s > bestScore) { bestScore = s; bestMatch = e; }
    }
    const matched = bestScore > 0.3 ? bestMatch : null;

    const aiMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    if (matched && bestScore > 0.5) {
      aiMessages.push({ role: "system", content: `Knowledge base entry that may be relevant:\nQ: ${matched.question}\nA: ${matched.answer}\n\nUse this as your primary source. Rephrase naturally and add helpful context.` });
    }
    aiMessages.push({ role: "user", content: message });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", t);
      throw new Error("AI gateway error");
    }
    const aiData = await aiResp.json();
    let reply: string = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    const needs_ticket = detectNeedsTicket(reply);
    const confidence_score = matched ? Math.min(1, bestScore + 0.3) : 0.5;

    // Auto-create a ticket if Alvin can't confidently help and we have student identity
    let auto_ticket: { ticket_id: string; department: string } | null = null;
    if (needs_ticket && student && student.name && student.email && student.registrationNumber) {
      const category = inferCategory(message);
      const department = DEPARTMENTS[category] || "Student Affairs Office";
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const code = CAT_CODES[category] || "gen";
      const { count } = await supabase.from("support_tickets").select("*", { count: "exact", head: true });
      const seq = String((count || 0) + 1).padStart(3, "0");
      const ticket_id = `${dd}${mm}/${code}/${seq}`;

      const { error: ticketErr } = await supabase.from("support_tickets").insert({
        ticket_id,
        title: message.slice(0, 80),
        description: `Auto-created from Alvin chat.\n\nStudent asked: ${message}\n\nAlvin's response: ${reply}`,
        user_question: message,
        category,
        priority: "medium",
        student_name: student.name,
        student_email: student.email,
        student_id: student.registrationNumber,
        student_registration_no: student.registrationNumber,
        student_faculty: student.faculty || null,
        department,
        assigned_to: department,
        auto_created: true,
      });
      if (!ticketErr) {
        auto_ticket = { ticket_id, department };
        reply += `\n\nI've automatically created a support ticket and routed it to the ${department}. Reference: ${ticket_id}. You'll be contacted shortly.`;
      }
    }

    await supabase.from("chat_messages").insert({ session_id: sid, content: reply, role: "assistant" });

    return new Response(JSON.stringify({
      response: reply,
      session_id: sid,
      confidence_score,
      suggested_actions: suggestedActions(matched?.category ?? null),
      needs_ticket,
      auto_ticket,
      needs_identity: needs_ticket && !auto_ticket,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
