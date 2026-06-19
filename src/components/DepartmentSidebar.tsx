import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Ticket, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import iueaLogo from "@/assets/iuea-logo.png";

const items = [{ to: "/department/tickets", label: "My Tickets", icon: Ticket }];

export function DepartmentSidebar({ category }: { category: string | null }) {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const logout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/department/login" });
  };
  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center bg-white overflow-hidden">
          <img src={iueaLogo} alt="IUEA" className="h-full w-full object-contain" />
        </div>
        <div>
          <div className="font-display text-lg font-bold">Department</div>
          <div className="text-[10px] uppercase tracking-wider opacity-70">{category || "Staff Portal"}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = path.startsWith(it.to);
          return (
            <Link key={it.to} to={it.to} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}>
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </aside>
  );
}
