// One-time admin seeder. POST with no body. Creates admin@iuea.ac.ug / admin123 and assigns admin role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const email = "admin@iuea.ac.ug";
    const password = "admin123";

    // Check if user already exists
    const { data: list } = await supabase.auth.admin.listUsers();
    let user = list?.users?.find((u) => u.email === email);
    if (!user) {
      const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      user = created.user!;
    }
    // Assign admin role if missing
    const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    }
    return new Response(JSON.stringify({ ok: true, email, password, message: "Admin ready. Log in with these credentials." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
