// Admin-only: create or update a department staff login.
// POST { email, password?, category, action: "upsert" | "delete" }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return null;
  const { data: role } = await sb.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!role) return null;
  return sb;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const sb = await requireAdmin(req);
  if (!sb) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const b = await req.json();
    const email: string = (b.email || "").trim().toLowerCase();
    const category: string = b.category || "";
    const action: string = b.action || "upsert";
    if (!email) throw new Error("email required");

    const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users?.find((u) => (u.email || "").toLowerCase() === email);

    if (action === "delete") {
      if (user) {
        await sb.from("user_roles").delete().eq("user_id", user.id).eq("role", "department");
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!category) throw new Error("category required");

    if (!user) {
      const password: string = b.password || crypto.randomUUID().slice(0, 12);
      const { data: created, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      user = created.user!;
    } else if (b.password) {
      await sb.auth.admin.updateUserById(user.id, { password: b.password });
    }

    // Remove existing dept role rows, then insert new one
    await sb.from("user_roles").delete().eq("user_id", user.id).eq("role", "department");
    const { error: rerr } = await sb.from("user_roles").insert({ user_id: user.id, role: "department", department_category: category });
    if (rerr) throw rerr;

    return new Response(JSON.stringify({ ok: true, email, category }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
