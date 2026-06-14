import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/StudentShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { postFn } from "@/lib/api";
import { Ticket, Plus, AlertTriangle } from "lucide-react";
import { useStudentIdentity } from "@/lib/studentIdentity";

export const Route = createFileRoute("/tickets/")({ component: MyTickets });

type T = { id: number; ticket_id: string; title: string; category: string; status: string; department: string | null; escalated: boolean; created_at: string };

function MyTickets() {
  const identity = useStudentIdentity();
  const [tickets, setTickets] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!identity?.registrationNumber) { setLoading(false); return; }
      try {
        const { tickets } = await postFn<{ tickets: T[] }>("list-student-tickets", { registration_number: identity.registrationNumber });
        setTickets(tickets || []);
      } catch { setTickets([]); }
      setLoading(false);
    })();
  }, [identity?.registrationNumber]);

  return (
    <StudentShell>
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center bg-secondary text-primary">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold">My Tickets</h1>
            <p className="text-sm text-muted-foreground">Track the status of your support requests.</p>
          </div>
        </div>
        <Button asChild className="bg-primary"><Link to="/tickets/new"><Plus className="mr-1 h-4 w-4" /> New Ticket</Link></Button>
      </header>

      {!identity ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">Set up your profile to view your tickets.</p>
          <Button asChild className="mt-4 bg-primary"><Link to="/profile">Set Up Profile</Link></Button>
        </Card>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : tickets.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No tickets yet. Create your first one when you need help.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="flex items-center justify-between p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{t.ticket_id}</span>
                  <span className="bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{t.category}</span>
                  {t.department && <span className="bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">→ {t.department}</span>}
                  {t.escalated && <span className="inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700"><AlertTriangle className="h-3 w-3" /> Escalated</span>}
                </div>
                <h3 className="mt-2 font-semibold">{t.title}</h3>
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold uppercase ${t.status === "resolved" ? "bg-green-100 text-green-700" : t.status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{t.status}</span>
            </Card>
          ))}
        </div>
      )}
    </StudentShell>
  );
}
