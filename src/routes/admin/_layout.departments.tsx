import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { postFn } from "@/lib/api";
import { toast } from "sonner";
import { KeyRound, Save } from "lucide-react";

export const Route = createFileRoute("/admin/_layout/departments")({ component: AdminDepartments });

type Dept = { id: string; category: string; name: string; email: string };

function AdminDepartments() {
  const [rows, setRows] = useState<Dept[]>([]);
  const [edits, setEdits] = useState<Record<string, { name: string; email: string }>>({});
  const [loginOpen, setLoginOpen] = useState<Dept | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const load = async () => {
    const { data, error } = await supabase.from("departments").select("*").order("category");
    if (error) return toast.error(error.message);
    setRows(data || []);
    const e: Record<string, { name: string; email: string }> = {};
    (data || []).forEach((d) => (e[d.id] = { name: d.name, email: d.email }));
    setEdits(e);
  };
  useEffect(() => { load(); }, []);

  const save = async (d: Dept) => {
    const u = edits[d.id];
    const { error } = await supabase
      .from("departments")
      .update({ name: u.name.trim(), email: u.email.trim().toLowerCase(), updated_at: new Date().toISOString() })
      .eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const openLogin = (d: Dept) => {
    setLoginOpen(d);
    setLoginForm({ email: d.email, password: "" });
  };

  const saveLogin = async () => {
    if (!loginOpen) return;
    try {
      await postFn("manage-department-user", {
        action: "upsert",
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password || undefined,
        category: loginOpen.category,
      });
      toast.success(`Login configured for ${loginOpen.name}`);
      setLoginOpen(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-bold text-primary">Departments</h1>
      <p className="mt-1 text-sm text-muted-foreground">Edit each department's notification email and manage its staff login account.</p>

      <Card className="mt-6 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Category</TableHead>
              <TableHead>Department name</TableHead>
              <TableHead>Notification email</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => {
              const u = edits[d.id] || { name: d.name, email: d.email };
              const dirty = u.name !== d.name || u.email !== d.email;
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.category}</TableCell>
                  <TableCell>
                    <Input value={u.name} onChange={(e) => setEdits({ ...edits, [d.id]: { ...u, name: e.target.value } })} />
                  </TableCell>
                  <TableCell>
                    <Input type="email" value={u.email} onChange={(e) => setEdits({ ...edits, [d.id]: { ...u, email: e.target.value } })} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={!dirty} onClick={() => save(d)}>
                        <Save className="mr-1 h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openLogin(d)}>
                        <KeyRound className="mr-1 h-3 w-3" /> Login
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!loginOpen} onOpenChange={(o) => !o && setLoginOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Department login — {loginOpen?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Create or update the staff login for this department. The user will sign in at <code className="rounded bg-muted px-1">/department/login</code> and see only tickets in <b>{loginOpen?.category}</b>.</p>
            <div>
              <Label>Login email</Label>
              <Input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Password {loginOpen ? "(leave blank to keep current)" : ""}</Label>
              <Input type="text" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="At least 6 characters" />
            </div>
            <Button onClick={saveLogin} className="w-full">Save Login</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
