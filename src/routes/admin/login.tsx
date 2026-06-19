import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin, postFn } from "@/lib/api";
import { toast } from "sonner";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@iuea.ac.ug");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); return toast.error(error.message); }
    const admin = await isAdmin();
    setLoading(false);
    if (!admin) { await supabase.auth.signOut(); return toast.error("Not an admin account"); }
    router.navigate({ to: "/admin" });
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await postFn("seed-admin", {});
      toast.success("Admin account ready: admin@iuea.ac.ug / admin123");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">Admin Sign In</h1>
            <p className="text-xs text-muted-foreground">SupBot Administration</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full bg-primary">{loading ? "Signing in..." : "Sign In"}</Button>
        </form>
        <div className="mt-6 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          First time? Click below to create the default admin account.
          <Button onClick={seed} disabled={seeding} variant="outline" size="sm" className="mt-2 w-full">{seeding ? "Setting up..." : "Initialize Admin Account"}</Button>
        </div>
      </Card>
    </div>
  );
}
