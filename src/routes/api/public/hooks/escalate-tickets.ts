import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "studentaffairs@iuea.ac.ug";

async function sendEscalationEmail(t: {
  ticket_id: string;
  department: string;
  title: string;
  to: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping escalation email");
    return;
  }
  const html = `
    <h2>⚠ Escalated Ticket: ${t.ticket_id}</h2>
    <p>This ticket has remained <strong>unresolved for more than 24 hours</strong> and has been automatically escalated to <strong>high priority</strong>.</p>
    <ul>
      <li><strong>Title:</strong> ${t.title}</li>
      <li><strong>Assigned Department:</strong> ${t.department}</li>
      <li><strong>Ticket ID:</strong> ${t.ticket_id}</li>
    </ul>
    <p>Please review and respond as soon as possible. Admin has been notified.</p>
  `;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "SupBot <onboarding@resend.dev>",
        to: [t.to],
        cc: t.to === ADMIN_EMAIL ? undefined : [ADMIN_EMAIL],
        subject: `[ESCALATED] ${t.ticket_id} - ${t.title}`,
        html,
      }),
    });
    if (!res.ok) console.error("Resend escalation send failed", res.status, await res.text());
  } catch (e) {
    console.error("Resend escalation send error", e);
  }
}

export const Route = createFileRoute("/api/public/hooks/escalate-tickets")({
  server: {
    handlers: {
      POST: async () => {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from("support_tickets")
          .update({ escalated: true, escalated_at: new Date().toISOString(), priority: "high" })
          .lt("created_at", cutoff)
          .in("status", ["open", "in_progress"])
          .eq("escalated", false)
          .select("ticket_id, department, title");
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const tickets = data ?? [];
        const cats = Array.from(new Set(tickets.map((t) => t.department).filter(Boolean)));
        const { data: depts } = await supabase.from("departments").select("name, email").in("name", cats.length ? cats : ["__none__"]);
        const emailByName = new Map<string, string>((depts ?? []).map((d: any) => [d.name, d.email]));
        await Promise.all(
          tickets.map((t) => {
            const dept = t.department || "Student Affairs Office";
            const to = emailByName.get(dept) || ADMIN_EMAIL;
            return sendEscalationEmail({ ticket_id: t.ticket_id, department: dept, title: t.title, to });
          })
        );

        return new Response(
          JSON.stringify({ escalated_count: tickets.length, tickets }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
