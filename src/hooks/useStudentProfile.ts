import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StudentProfile = {
  id: string;
  name: string;
  email: string;
  registration_number: string;
  faculty: string | null;
};

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) { setProfile(null); setLoading(false); } return; }
      const { data } = await supabase
        .from("profiles")
        .select("id,name,email,registration_number,faculty")
        .eq("id", user.id)
        .maybeSingle();
      if (active) { setProfile((data as StudentProfile) ?? null); setLoading(false); }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { profile, loading };
}
