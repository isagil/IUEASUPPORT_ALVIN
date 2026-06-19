import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StudentShell } from "@/components/StudentShell";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postFn } from "@/lib/api";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/feedback")({ component: Feedback });

function Feedback() {
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await postFn("feedback", { rating: null, comment: message, category, anonymous: true }).catch(() => null);
      toast.success("Feedback submitted anonymously. Thank you!");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentShell>
      <header className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Megaphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold">Anonymous Feedback</h1>
          <p className="text-sm text-muted-foreground">Share your thoughts. Your identity is never attached.</p>
        </div>
      </header>

      <Card className="max-w-2xl p-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["General", "Academics", "Facilities", "Staff", "Campus Life"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Your message</Label>
            <Textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's on your mind..." />
          </div>
          <Button disabled={loading || !message.trim()} className="bg-primary">{loading ? "Sending..." : "Send Anonymously"}</Button>
        </form>
      </Card>
    </StudentShell>
  );
}
