// Returns tickets for a given student registration number.
// Uses service role to bypass RLS after validating input.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { registration_number } = await req.json();
    const reg = String(registration_number || "").trim();
    if (!reg || reg.length > 100) {
      return new Response(JSON.stringify({ error: "registration_number required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await sb
      .from("support_tickets")
      .select("id, ticket_id, title, category, status, department, escalated, created_at")
      .eq("student_registration_no", reg)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return new Response(JSON.stringify({ tickets: data || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
