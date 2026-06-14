import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data: role } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!role) return null;
  return supabase;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = await requireAdmin(req);
  if (!supabase) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const [chats, open, prog, resolved, kb, recent] = await Promise.all([
    supabase.from("conversation_sessions").select("*", { count: "exact", head: true }),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("knowledge_base").select("*", { count: "exact", head: true }),
    supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  return new Response(JSON.stringify({
    total_chats: chats.count || 0,
    open_tickets: open.count || 0,
    in_progress_tickets: prog.count || 0,
    resolved_tickets: resolved.count || 0,
    total_knowledge_entries: kb.count || 0,
    recent_tickets: recent.data || [],
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
