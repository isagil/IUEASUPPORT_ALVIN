import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CAT_CODES: Record<string, string> = {
  "Academic Support": "aca",
  "Technical Issues": "tec",
  "Financial Services": "fin",
  "Registration & Enrollment": "reg",
  "Accommodation": "acc",
  "Library Services": "lib",
  "Health & Wellness": "hea",
  "Career Services": "car",
  "General Inquiry": "gen",
  "Other": "oth",
};

const FALLBACK_DEPT_NAME = "Student Affairs Office";

async function notifyDepartment(t: {
  to: string; department: string; ticket_id: string; title: string;
  description: string; category: string; priority: string;
  studentName: string; studentEmail: string; studentId: string;
  studentRegistrationNo: string; studentFaculty?: string | null;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) { console.warn("RESEND_API_KEY not set; skipping email"); return; }
  const html = `
    <h2>New Support Ticket: ${t.ticket_id}</h2>
    <p>A new ticket has been routed to <strong>${t.department}</strong>.</p>
    <h3>Ticket Details</h3>
    <ul>
      <li><strong>Title:</strong> ${t.title}</li>
      <li><strong>Category:</strong> ${t.category}</li>
      <li><strong>Priority:</strong> ${t.priority}</li>
    </ul>
    <p><strong>Description:</strong><br/>${t.description.replace(/\n/g, "<br/>")}</p>
    <h3>Student Information</h3>
    <ul>
      <li><strong>Name:</strong> ${t.studentName}</li>
      <li><strong>Registration No:</strong> ${t.studentRegistrationNo}</li>
      <li><strong>Student ID:</strong> ${t.studentId}</li>
      <li><strong>Email:</strong> ${t.studentEmail}</li>
      ${t.studentFaculty ? `<li><strong>Faculty:</strong> ${t.studentFaculty}</li>` : ""}
    </ul>
    <p>Please respond within 24 hours to avoid escalation.</p>
  `;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "SupBot <onboarding@resend.dev>",
        to: [t.to],
        subject: `[${t.ticket_id}] New ${t.category} Ticket - ${t.title}`,
        html,
      }),
    });
    if (!res.ok) console.error("Resend send failed", res.status, await res.text());
  } catch (e) { console.error("Resend send error", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const b = await req.json();
    const required = ["title", "description", "category", "studentName", "studentEmail", "studentId", "studentRegistrationNo"];
    for (const k of required) if (!b[k]) return new Response(JSON.stringify({ error: `${k} required` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const code = CAT_CODES[b.category] || "gen";
    const { count } = await supabase.from("support_tickets").select("*", { count: "exact", head: true });
    const seq = String((count || 0) + 1).padStart(3, "0");
    const ticket_id = `${dd}${mm}/${code}/${seq}`;
    const { data: dept } = await supabase.from("departments").select("name, email").eq("category", b.category).maybeSingle();
    const department = dept?.name || FALLBACK_DEPT_NAME;
    const deptEmail = dept?.email || null;

    const { error } = await supabase.from("support_tickets").insert({
      ticket_id,
      title: b.title,
      description: b.description,
      user_question: b.userQuestion || null,
      category: b.category,
      priority: b.priority || "medium",
      student_name: b.studentName,
      student_email: b.studentEmail,
      student_id: b.studentId,
      student_registration_no: b.studentRegistrationNo,
      student_faculty: b.studentFaculty || null,
      department,
      assigned_to: department,
      auto_created: !!b.autoCreated,
    });
    if (error) throw error;

    if (deptEmail) {
      await notifyDepartment({
        to: deptEmail,
        department,
        ticket_id,
        title: b.title,
        description: b.description,
        category: b.category,
        priority: b.priority || "medium",
        studentName: b.studentName,
        studentEmail: b.studentEmail,
        studentId: b.studentId,
        studentRegistrationNo: b.studentRegistrationNo,
        studentFaculty: b.studentFaculty || null,
      });
    }


    return new Response(JSON.stringify({ ticket_id, department, message: "Ticket created successfully" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

