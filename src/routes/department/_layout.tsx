import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DepartmentSidebar } from "@/components/DepartmentSidebar";

export const Route = createFileRoute("/department/_layout")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw redirect({ to: "/department/login", search: { from: location.href } as any });
      const { data: role } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "department").maybeSingle();
      if (!role) throw redirect({ to: "/department/login" });
    } catch (e) {
      if (isRedirect(e)) throw e;
      throw redirect({ to: "/department/login", search: { from: location.href } as any });
    }
  },
  component: DepartmentLayout,
});

function DepartmentLayout() {
  const [category, setCategory] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_roles").select("department_category").eq("user_id", user.id).eq("role", "department").maybeSingle();
      setCategory(data?.department_category || null);
    })();
  }, []);
  return (
    <div className="flex h-screen bg-background">
      <DepartmentSidebar category={category} />
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}
