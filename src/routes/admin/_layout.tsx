import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/AdminSidebar";
import { isAdmin } from "@/lib/api";

export const Route = createFileRoute("/admin/_layout")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const ok = await isAdmin();
    if (!ok) throw redirect({ to: "/admin/login", search: { from: location.href } as any });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
