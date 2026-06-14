import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Megaphone, Ticket, Settings } from "lucide-react";
import { useStudentIdentity, clearStudentIdentity } from "@/lib/studentIdentity";
import iueaLogo from "@/assets/iuea-logo.png";

const NAV = [
  { to: "/", label: "Overview", icon: Home, emoji: "🏠" },
  { to: "/chat", label: "Chat with Alvin (AI)", icon: Sparkles, emoji: "✨" },
  { to: "/feedback", label: "Anonymous Feedback", icon: Megaphone, emoji: "📣" },
  { to: "/tickets", label: "My Tickets", icon: Ticket, emoji: "🎟️" },
] as const;

export function StudentShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const identity = useStudentIdentity();

  const regNo = identity?.registrationNumber ?? "Guest mode";
  const name = identity?.name ?? "Guest Student";
  const initials = name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "G";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-6 pb-6 pt-7">
          <div className="flex h-11 w-11 items-center justify-center bg-white/95 shadow-sm overflow-hidden"><img src={iueaLogo} alt="IUEA" className="h-full w-full object-contain" /></div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold">IUEA Hub</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">Student Portal</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4">
          {NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                    : "text-sidebar-foreground/85 hover:bg-white/5 hover:text-sidebar-foreground"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mb-3 flex items-center gap-3 bg-sidebar-accent/60 px-4 py-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-white/10 text-sm font-bold">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-bold">{name}</div>
            <div className="truncate text-[11px] font-medium opacity-70">{regNo}</div>
          </div>
        </div>
        <Link to="/profile" className="mx-4 mb-2 flex items-center gap-3 px-4 py-3 text-sm font-semibold text-sidebar-foreground/85 hover:bg-white/5">
          <Settings className="h-4 w-4" /> {identity ? "Edit Profile" : "Set Up Profile"}
        </Link>
        {identity && (
          <button onClick={() => { clearStudentIdentity(); window.location.href = "/"; }} className="mx-4 mb-5 flex items-center gap-3 px-4 py-3 text-sm font-semibold text-sidebar-foreground/85 hover:bg-white/5">
            Clear Identity
          </button>
        )}
      </aside>

      <main className="ml-72 flex-1">
        <div className="mx-auto w-full max-w-6xl px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
