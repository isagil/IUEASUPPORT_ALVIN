import { createFileRoute, Link } from "@tanstack/react-router";
import { StudentShell } from "@/components/StudentShell";
import { Megaphone, Flame } from "lucide-react";
import { useStudentIdentity } from "@/lib/studentIdentity";

export const Route = createFileRoute("/")({ component: Overview });

const ANNOUNCEMENTS = [
  { tag: "Academics", title: "Graduation 2024 Final Clearance", body: "All graduating students must complete their financial clearance by the end of this month." },
  { tag: "Campus Life", title: "Cultural Week Kicks Off Monday", body: "Join us for a week of music, food and student showcases across the main campus." },
];

function Overview() {
  const identity = useStudentIdentity();
  const firstName = identity?.name?.split(" ")[0] ?? "Student";
  return (
    <StudentShell>
      <header className="mb-8">
        <h1 className="font-display text-5xl font-bold text-foreground">Welcome{identity ? ` back, ${firstName}` : " to IUEA Hub"}!</h1>
        <p className="mt-2 text-muted-foreground">{identity?.faculty ? `${identity.faculty} · ` : ""}{identity?.registrationNumber ?? "Set up your profile to personalise your experience"}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl"
          style={{ background: "radial-gradient(circle at 80% 20%, #8B0000 0%, #4A0000 60%, #2A0000 100%)" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Flame className="h-3 w-3" /> Payment Deadline
          </div>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight">Tuition Installment #2</h2>
          <p className="mt-2 text-sm opacity-85">Keep track of your fees.</p>
          <Link
            to="/tickets/new"
            className="mt-7 inline-flex items-center rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary shadow hover:bg-white/90"
          >
            Pay Fees Now
          </Link>
        </div>

      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-bold">Campus Announcements</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Updated Today</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {ANNOUNCEMENTS.map((a, i) => (
            <article key={a.title} className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">{a.tag}</span>
                <span className="text-[10px] font-medium text-muted-foreground">#{i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="italic text-muted-foreground">Ends soon</span>
                <button className="font-bold uppercase tracking-wider text-primary">Read Details →</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </StudentShell>
  );
}
