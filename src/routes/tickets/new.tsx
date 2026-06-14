import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/StudentShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postFn, FACULTIES, TICKET_CATEGORIES } from "@/lib/api";
import { useStudentIdentity, setStudentIdentity } from "@/lib/studentIdentity";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/tickets/new")({ component: NewTicket });

function NewTicket() {
  const identity = useStudentIdentity();
  const [f, setF] = useState({ studentName: "", studentId: "", studentRegistrationNo: "", studentEmail: "", studentFaculty: "", category: "", title: "", description: "" });
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: string; department: string } | null>(null);

  useEffect(() => {
    if (!identity) return;
    setF((x) => ({
      ...x,
      studentName: x.studentName || identity.name,
      studentRegistrationNo: x.studentRegistrationNo || identity.registrationNumber,
      studentEmail: x.studentEmail || identity.email,
      studentFaculty: x.studentFaculty || identity.faculty || "",
      studentId: x.studentId || identity.registrationNumber,
    }));
  }, [identity]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postFn<{ ticket_id: string; department: string }>("create-ticket", f);
      // Persist identity for next time
      setStudentIdentity({ name: f.studentName, email: f.studentEmail, registrationNumber: f.studentRegistrationNo, faculty: f.studentFaculty });
      setCreated({ id: data.ticket_id, department: data.department });
      toast.success("Ticket created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <StudentShell>
        <div className="mx-auto max-w-md">
          <Card className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 font-display text-2xl font-bold text-primary">Ticket Submitted</h1>
            <p className="mt-2 text-sm text-muted-foreground">Routed to <strong>{created.department}</strong>. Reference your ticket ID below.</p>
            <div className="mt-4 bg-muted px-4 py-3 font-mono text-lg text-primary">{created.id}</div>
            <Button onClick={() => { setCreated(null); setF({ studentName: identity?.name || "", studentId: identity?.registrationNumber || "", studentRegistrationNo: identity?.registrationNumber || "", studentEmail: identity?.email || "", studentFaculty: identity?.faculty || "", category: "", title: "", description: "" }); }} className="mt-6 bg-primary">Create Another</Button>
          </Card>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <div className="mx-auto max-w-2xl">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-bold text-primary">Create Support Ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your ticket will be routed automatically to the responsible department.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Name</Label><Input required value={f.studentName} onChange={(e) => set("studentName", e.target.value)} /></div>
              <div><Label>Student ID</Label><Input required value={f.studentId} onChange={(e) => set("studentId", e.target.value)} /></div>
              <div><Label>Registration No.</Label><Input required value={f.studentRegistrationNo} onChange={(e) => set("studentRegistrationNo", e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={f.studentEmail} onChange={(e) => set("studentEmail", e.target.value)} /></div>
              <div>
                <Label>Faculty</Label>
                <Select value={f.studentFaculty} onValueChange={(v) => set("studentFaculty", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FACULTIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={f.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TICKET_CATEGORIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Title</Label><Input required value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Short summary" /></div>
            <div><Label>Description</Label><Textarea required value={f.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Describe your issue in detail..." /></div>
            <Button type="submit" disabled={loading || !f.category} className="w-full bg-primary">{loading ? "Submitting..." : "Submit Ticket"}</Button>
          </form>
        </Card>
      </div>
    </StudentShell>
  );
}
