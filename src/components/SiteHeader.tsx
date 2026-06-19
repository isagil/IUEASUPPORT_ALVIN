import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-primary">SupBot</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IUEA Student Support</div>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/chat" className="text-foreground hover:text-primary">Chat</Link>
          <Link to="/tickets/new" className="text-foreground hover:text-primary">Create Ticket</Link>
          <Link to="/login" className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90">Student Login</Link>
        </nav>
      </div>
    </header>
  );
}
