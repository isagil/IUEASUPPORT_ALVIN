import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFn } from "@/lib/api";
import { toast } from "sonner";
import { MessageSquare, Ticket as TicketIcon, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/_layout/")({ component: Dashboard });

type Stats = {
  total_chats: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  total_knowledge_entries: number;
  recent_tickets: any[];
};

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { getFn<Stats>("admin-stats").then(setStats).catch((e) => toast.error(e.message)); }, []);
  if (!stats) return <div className="p-10 text-muted-foreground">Loading...</div>;

  const cards = [
    { label: "Total Chats", value: stats.total_chats, icon: MessageSquare, color: "text-blue-600" },
    { label: "Open Tickets", value: stats.open_tickets, icon: TicketIcon, color: "text-red-600" },
    { label: "In Progress", value: stats.in_progress_tickets, icon: Clock, color: "text-yellow-600" },
    { label: "Resolved", value: stats.resolved_tickets, icon: CheckCircle2, color: "text-green-600" },
  ];

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-bold text-primary">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Overview of SupBot activity</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">{c.value}</div>
          </Card>
        ))}
      </div>
      <Card className="mt-8 p-6">
        <h2 className="font-display text-lg font-semibold text-primary">Recent Tickets</h2>
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.recent_tickets.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No tickets yet.</TableCell></TableRow>)}
            {stats.recent_tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.ticket_id}</TableCell>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.student_name}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell><Badge className={statusColors[t.status] || ""}>{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
