import { Lightbulb, ChevronRight } from "lucide-react";

type Block =
  | { kind: "steps"; items: { title: string; description?: string }[] }
  | { kind: "tip"; text: string }
  | { kind: "text"; text: string };

function stripInlineMarkdown(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();
}

function parseBotContent(raw: string): Block[] {
  const lines = raw.split(/\r?\n/);
  const blocks: Block[] = [];
  let textBuf: string[] = [];
  let steps: { title: string; description?: string }[] = [];

  const flushText = () => {
    const t = textBuf.join("\n").trim();
    if (t) blocks.push({ kind: "text", text: t });
    textBuf = [];
  };
  const flushSteps = () => {
    if (steps.length) blocks.push({ kind: "steps", items: steps });
    steps = [];
  };

  const tipRe = /^\s*(?:\*\*)?\s*(?:💡\s*)?(tip|note|quick note|pro tip)\s*[:：]?\s*(?:\*\*)?\s*(.*)$/i;
  const numberedRe = /^\s*(\d+)[.)]\s+(.*)$/;

  for (const line of lines) {
    const tipMatch = line.match(tipRe);
    if (tipMatch && (tipMatch[2] || "").trim()) {
      flushText();
      flushSteps();
      blocks.push({ kind: "tip", text: stripInlineMarkdown(tipMatch[2]) });
      continue;
    }
    const numMatch = line.match(numberedRe);
    if (numMatch) {
      flushText();
      const body = stripInlineMarkdown(numMatch[2]);
      // Split title/description by " - ", " — ", or ": "
      const splitMatch = body.match(/^(.+?)\s*(?:[-—:])\s+(.+)$/);
      if (splitMatch) {
        steps.push({ title: splitMatch[1], description: splitMatch[2] });
      } else {
        steps.push({ title: body });
      }
      continue;
    }
    if (line.trim() === "") {
      flushSteps();
      if (textBuf.length) textBuf.push("");
      continue;
    }
    flushSteps();
    textBuf.push(line);
  }
  flushSteps();
  flushText();
  return blocks;
}

export function BotMessage({ content }: { content: string }) {
  const blocks = parseBotContent(content);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a56a0] text-[10px] font-bold text-white">
          AI
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          Alvin · Student Support
        </span>
      </div>
      <div className="rounded-2xl rounded-tl-none bg-white px-4 py-3 text-sm shadow-sm">
        {blocks.length === 0 && (
          <p className="whitespace-pre-wrap">{stripInlineMarkdown(content)}</p>
        )}
        {blocks.map((b, i) => {
          if (b.kind === "text")
            return (
              <p key={i} className="whitespace-pre-wrap [&:not(:first-child)]:mt-2">
                {b.text}
              </p>
            );
          if (b.kind === "tip")
            return (
              <div
                key={i}
                className="mt-2 flex gap-2 border-l-[3px] border-[#1a56a0] bg-[#eef4ff] px-3 py-2 text-[#0b3b7a]"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#1a56a0]" />
                <p className="text-sm">{b.text}</p>
              </div>
            );
          // steps
          return (
            <div key={i} className="mt-2 flex flex-col gap-2">
              {b.items.map((s, j) => (
                <div
                  key={j}
                  className="flex items-start gap-3 rounded-lg border border-border bg-white p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a56a0] text-sm font-bold text-white">
                    {j + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <ChevronRight className="h-3.5 w-3.5 text-[#1a56a0]" />
                      <span>{s.title}</span>
                    </div>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
