import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { StudentShell } from "@/components/StudentShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES } from "@/lib/api";
import { setStudentIdentity, useStudentIdentity } from "@/lib/studentIdentity";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const router = useRouter();
  const current = useStudentIdentity();
  const [f, setF] = useState({
    name: current?.name ?? "",
    email: current?.email ?? "",
    registrationNumber: current?.registrationNumber ?? "",
    faculty: current?.faculty ?? "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.email || !f.registrationNumber) {
      toast.error("Name, email and registration number are required");
      return;
    }
    setStudentIdentity(f);
    toast.success("Profile saved");
    router.navigate({ to: "/" });
  };

  return (
    <StudentShell>
      <div className="mx-auto max-w-xl">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-bold text-primary">Your Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">No password required — just tell us who you are so tickets and chats are personalised.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div><Label>Full Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label>Registration Number</Label><Input required value={f.registrationNumber} onChange={(e) => setF({ ...f, registrationNumber: e.target.value })} placeholder="2024/BIT/001" /></div>
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div>
              <Label>Faculty</Label>
              <Select value={f.faculty} onValueChange={(v) => setF({ ...f, faculty: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{FACULTIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-primary">Save Profile</Button>
          </form>
        </Card>
      </div>
    </StudentShell>
  );
}
