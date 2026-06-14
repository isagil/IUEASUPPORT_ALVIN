import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/department/_layout/tickets")({ component: DepartmentTickets });

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

function DepartmentTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("open");
  const [resolution, setResolution] = useState("");
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const load = async (cat: string | null) => {
    if (!cat) { setTickets([]); return; }
    let q = supabase.from("support_tickets").select("*").eq("category", cat).order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) return toast.error(error.message);
    setTickets(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe({ id: user.id, email: user.email || "" });
      const { data: role } = await supabase.from("user_roles").select("department_category").eq("user_id", user.id).eq("role", "department").maybeSingle();
      setCategory(role?.department_category || null);
    })();
  }, []);
  useEffect(() => { load(category); }, [statusFilter, category]);

  const open = async (t: any) => {
    setSelected(t);
    setNewStatus(t.status);
    setResolution(t.resolution || "");
    setReply("");
    const { data } = await supabase.from("ticket_responses").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true });
    setResponses(data || []);
  };

  const sendReply = async () => {
    if (!selected || !reply.trim() || !me) return;
    const { error } = await supabase.from("ticket_responses").insert({
      ticket_id: selected.id,
      author_user_id: me.id,
      author_name: me.email,
      author_role: "department",
      message: reply.trim(),
    });
    if (error) return toast.error(error.message);
    setReply("");
    const { data } = await supabase.from("ticket_responses").select("*").eq("ticket_id", selected.id).order("created_at", { ascending: true });
    setResponses(data || []);
    toast.success("Response posted");
  };

  const saveStatus = async () => {
    if (!selected) return;
    const update: any = { status: newStatus, resolution: resolution || null, last_updated: new Date().toISOString() };
    if (newStatus === "resolved" && !selected.resolved_at) update.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("support_tickets").update(update).eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Ticket updated");
    setSelected({ ...selected, ...update });
    load(category);
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-bold text-primary">My Tickets</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tickets routed to your department. Update status, post responses, and resolve issues.</p>

      <div className="mt-4 flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-6 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No tickets yet.</TableCell></TableRow>}
            {tickets.map((t) => (
              <TableRow key={t.id} className={`cursor-pointer ${t.escalated ? "bg-amber-50" : ""}`} onClick={() => open(t)}>
                <TableCell className="font-mono text-xs">
                  {t.ticket_id}
                  {t.escalated && <Badge className="ml-2 bg-amber-100 text-amber-800">⚠ &gt;24h</Badge>}
                </TableCell>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.student_name}</TableCell>
                <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                <TableCell><Badge className={statusColors[t.status]}>{t.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{selected.title}</SheetTitle>
                <div className="font-mono text-xs text-muted-foreground">{selected.ticket_id}</div>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Description</div>
                  <p className="mt-1 whitespace-pre-wrap">{selected.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Student" value={selected.student_name} />
                  <Field label="Reg No." value={selected.student_registration_no} />
                  <Field label="Email" value={selected.student_email} />
                  <Field label="Faculty" value={selected.student_faculty || "—"} />
                  <Field label="Category" value={selected.category} />
                  <Field label="Priority" value={selected.priority} />
                </div>

                <div className="rounded-md border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Conversation</div>
                  <div className="space-y-3">
                    {responses.length === 0 && <p className="text-xs text-muted-foreground">No responses yet. Start the conversation below.</p>}
                    {responses.map((r) => (
                      <div key={r.id} className="rounded-md bg-muted/40 p-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-medium">{r.author_name} · {r.author_role}</span>
                          <span>{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{r.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a response to the student / admin..." />
                    <Button onClick={sendReply} disabled={!reply.trim()} size="sm"><Send className="mr-1 h-3 w-3" /> Post Response</Button>
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Resolution notes</Label>
                  <Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="How was this resolved?" />
                </div>
                <Button onClick={saveStatus} className="w-full">Update Ticket</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
