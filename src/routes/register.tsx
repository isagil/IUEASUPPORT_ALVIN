import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FACULTIES } from "@/lib/api";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", regNo: "", email: "", faculty: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) return toast.error("Passwords don't match");
    if (f.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { emailRedirectTo: `${window.location.origin}/chat`, data: { name: f.name, registration_number: f.regNo, faculty: f.faculty } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, name: f.name, registration_number: f.regNo, email: f.email, faculty: f.faculty });
    }
    setLoading(false);
    toast.success("Account created! You're signed in.");
    router.navigate({ to: "/chat" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-6 py-12">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-bold text-primary">Create Student Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register to track your tickets and chat history.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div><Label>Full Name</Label><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Registration Number</Label><Input required value={f.regNo} onChange={(e) => set("regNo", e.target.value)} placeholder="2024/BIT/001" /></div>
              <div>
                <Label>Faculty</Label>
                <Select value={f.faculty} onValueChange={(v) => set("faculty", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FACULTIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Password</Label><Input type="password" required value={f.password} onChange={(e) => set("password", e.target.value)} /></div>
              <div><Label>Confirm</Label><Input type="password" required value={f.confirm} onChange={(e) => set("confirm", e.target.value)} /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary">{loading ? "Creating..." : "Create Account"}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
