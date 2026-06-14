import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/department/login")({ component: DepartmentLogin });

function DepartmentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); return toast.error(error.message); }
    const { data: role } = await supabase.from("user_roles").select("department_category").eq("user_id", signIn.user!.id).eq("role", "department").maybeSingle();
    setLoading(false);
    if (!role) { await supabase.auth.signOut(); return toast.error("Not a department account"); }
    router.navigate({ to: "/department/tickets" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">Department Sign In</h1>
            <p className="text-xs text-muted-foreground">Staff portal for department responses</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full bg-primary">{loading ? "Signing in..." : "Sign In"}</Button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">Don't have a login? Ask an administrator to create one for your department.</p>
      </Card>
    </div>
  );
}
