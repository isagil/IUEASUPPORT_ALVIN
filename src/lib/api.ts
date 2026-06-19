import { supabase } from "@/integrations/supabase/client";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || ANON;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: ANON } as Record<string, string>;
}

export async function postFn<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FN_URL}/${name}`, { method: "POST", headers: await authHeaders(), body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function getFn<T>(name: string): Promise<T> {
  const res = await fetch(`${FN_URL}/${name}`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return !!data;
}

export const FACULTIES = [
  "Computing & IT",
  "Business & Management",
  "Law",
  "Social Sciences",
  "Education",
  "Engineering",
  "Health Sciences",
];

export const TICKET_CATEGORIES = [
  "Academic Support",
  "Technical Issues",
  "Financial Services",
  "Registration & Enrollment",
  "Accommodation",
  "Library Services",
  "Health & Wellness",
  "Career Services",
  "General Inquiry",
  "Other",
];
