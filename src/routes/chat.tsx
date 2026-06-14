import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { StudentShell } from "@/components/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postFn } from "@/lib/api";
import { Bot, Send, ThumbsUp, ThumbsDown, Ticket, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useStudentIdentity } from "@/lib/studentIdentity";

export const Route = createFileRoute("/chat")({ component: Chat });

type Msg = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  needsTicket?: boolean;
  needsIdentity?: boolean;
  autoTicket?: { ticket_id: string; department: string } | null;
  feedbackSent?: boolean;
};

function Chat() {
  const identity = useStudentIdentity();
  const firstName = identity?.name?.split(" ")[0];
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi${firstName ? " " + firstName : ""}! I'm Alvin — your IUEA student support assistant. Ask me anything about fees, registration, accommodation, exams, or campus life. If I can't help, I'll open a ticket and route it to the right department.`, suggestions: ["How do I register for courses?", "How do I pay tuition fees?", "Where is the library?"] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("supbot_session");
    if (saved) setSessionId(saved);
  }, []);

  useEffect(() => {
    if (!firstName) return;
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant") return prev;
      return [{ ...prev[0], content: `Hi ${firstName}! I'm Alvin — your IUEA student support assistant. Ask me anything about fees, registration, accommodation, exams, or campus life. If I can't help, I'll open a ticket and route it to the right department.` }];
    });
  }, [firstName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const data = await postFn<{ response: string; session_id: string; suggested_actions: string[]; needs_ticket: boolean; needs_identity: boolean; auto_ticket: { ticket_id: string; department: string } | null }>("chat", { message: content, session_id: sessionId, student: identity ?? undefined });
      setSessionId(data.session_id);
      localStorage.setItem("supbot_session", data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: data.response, suggestions: data.suggested_actions, needsTicket: data.needs_ticket, needsIdentity: data.needs_identity, autoTicket: data.auto_ticket }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (idx: number, helpful: boolean) => {
    if (!sessionId) return;
    try {
      await postFn("feedback", { session_id: sessionId, helpful, rating: helpful ? 5 : 2 });
      setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, feedbackSent: true } : msg)));
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Couldn't send feedback");
    }
  };

  return (
    <StudentShell>
      <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h1 className="font-display text-2xl font-bold">Chat with Alvin</h1>
          <p className="text-xs text-muted-foreground">Your AI student support assistant — unanswered questions become tickets automatically.</p>
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div className={`max-w-[80%] space-y-2 ${m.role === "user" ? "items-end" : ""}`}>
                {m.role === "assistant" && <div className="text-xs font-semibold text-primary">Alvin</div>}
                <div className={`whitespace-pre-wrap px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white shadow-sm"}`}>
                  {m.content}
                </div>
                {m.role === "assistant" && m.autoTicket && (
                  <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                    <Ticket className="h-3.5 w-3.5" />
                    <span>Ticket <span className="font-mono font-bold">{m.autoTicket.ticket_id}</span> routed to <strong>{m.autoTicket.department}</strong>.</span>
                  </div>
                )}
                {m.role === "assistant" && m.needsIdentity && (
                  <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="flex-1">
                      <p>I couldn't auto-create a ticket because your profile isn't set yet. Add your name + registration number once and future questions will route automatically.</p>
                      <Button asChild size="sm" className="mt-2 bg-primary">
                        <Link to="/profile">Set Up Profile</Link>
                      </Button>
                    </div>
                  </div>
                )}
                {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} className="border border-primary/20 bg-white px-3 py-1 text-xs text-primary hover:bg-primary hover:text-primary-foreground">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {m.role === "assistant" && m.needsTicket && !m.autoTicket && (
                  <div className="flex items-center justify-between gap-3 border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-sm text-blue-900">Want to file this manually?</p>
                    <Button asChild size="sm" className="bg-primary">
                      <Link to="/tickets/new"><Ticket className="mr-1 h-3 w-3" /> Create Ticket</Link>
                    </Button>
                  </div>
                )}
                {m.role === "assistant" && i > 0 && !m.feedbackSent && (
                  <div className="flex gap-1 text-muted-foreground">
                    <button onClick={() => sendFeedback(i, true)} className="p-1 hover:bg-muted"><ThumbsUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => sendFeedback(i, false)} className="p-1 hover:bg-muted"><ThumbsDown className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                {m.feedbackSent && <p className="text-xs text-muted-foreground">Thanks for your feedback.</p>}
              </div>
              {m.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent text-accent-foreground">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
              <div className="flex items-center gap-1 bg-white px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce bg-muted-foreground" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t bg-white p-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Alvin anything..." disabled={loading} className="flex-1" />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-primary"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
      </div>
    </StudentShell>
  );
}
