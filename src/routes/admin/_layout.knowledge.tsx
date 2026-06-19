import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { TICKET_CATEGORIES } from "@/lib/api";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/admin/_layout/knowledge")({ component: AdminKB });

type KBRow = { question: string; answer: string; category: string; urgency_level?: string };

// Minimal RFC4180-ish CSV parser (handles quoted fields with commas/newlines/escaped quotes)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some((v) => v.length > 0)) rows.push(cur);
        cur = [];
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); if (cur.some((v) => v.length > 0)) rows.push(cur); }
  return rows;
}

function toCSV(rows: KBRow[]): string {
  const esc = (s: string) => {
    const v = s ?? "";
    return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const header = "question,answer,category,urgency_level\n";
  return header + rows.map((r) => [r.question, r.answer, r.category, r.urgency_level || "low"].map(esc).join(",")).join("\n");
}

function AdminKB() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", category: "", urgency_level: "low" });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabase.from("knowledge_base").select("*").order("last_updated", { ascending: false });
    if (error) return toast.error(error.message);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ question: "", answer: "", category: "", urgency_level: "low" }); setOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setForm({ question: it.question, answer: it.answer, category: it.category, urgency_level: it.urgency_level }); setOpen(true); };

  const save = async () => {
    if (!form.question || !form.answer || !form.category) return toast.error("Fill all required fields");
    if (editing) {
      const { error } = await supabase.from("knowledge_base").update({ ...form, last_updated: new Date().toISOString() }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("knowledge_base").insert(form);
      if (error) return toast.error(error.message);
      toast.success("Added");
    }
    setOpen(false);
    load();
  };

  const del = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("knowledge_base").delete().eq("id", confirmDel.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setConfirmDel(null);
    load();
  };

  const exportCSV = () => {
    const rows: KBRow[] = items.map((i) => ({ question: i.question, answer: i.answer, category: i.category, urgency_level: i.urgency_level }));
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knowledge-base-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const sample: KBRow[] = [
      { question: "What are the library hours?", answer: "The library is open 8am–10pm Mon–Fri.", category: "Library Services", urgency_level: "low" },
    ];
    const blob = new Blob([toCSV(sample)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kb-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV has no data rows");
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const qi = header.indexOf("question");
      const ai = header.indexOf("answer");
      const ci = header.indexOf("category");
      const ui = header.indexOf("urgency_level");
      if (qi < 0 || ai < 0 || ci < 0) throw new Error("CSV must include columns: question, answer, category (urgency_level optional)");

      const valid: KBRow[] = [];
      const errors: string[] = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const q = (row[qi] || "").trim();
        const a = (row[ai] || "").trim();
        const cat = (row[ci] || "").trim();
        const u = (ui >= 0 ? row[ui] : "low").trim().toLowerCase() || "low";
        if (!q || !a || !cat) { errors.push(`Row ${r + 1}: missing required field`); continue; }
        if (!TICKET_CATEGORIES.includes(cat)) { errors.push(`Row ${r + 1}: unknown category "${cat}"`); continue; }
        if (!["low", "medium", "high"].includes(u)) { errors.push(`Row ${r + 1}: invalid urgency "${u}"`); continue; }
        valid.push({ question: q, answer: a, category: cat, urgency_level: u });
      }

      if (!valid.length) throw new Error(errors[0] || "No valid rows found");
      const { error } = await supabase.from("knowledge_base").insert(valid);
      if (error) throw error;
      toast.success(`Imported ${valid.length} entries${errors.length ? ` (${errors.length} skipped)` : ""}`);
      if (errors.length) console.warn("CSV import skipped:", errors);
      load();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">{items.length} entries</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          <Button variant="outline" onClick={downloadTemplate}><Download className="mr-1 h-4 w-4" /> Template</Button>
          <Button variant="outline" onClick={exportCSV} disabled={!items.length}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="mr-1 h-4 w-4" /> {importing ? "Importing..." : "Import CSV"}
          </Button>
          <Button onClick={openNew} className="bg-primary"><Plus className="mr-1 h-4 w-4" /> Add Entry</Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        CSV columns: <code>question, answer, category, urgency_level</code> (urgency_level optional: low/medium/high). Category must match supported list.
      </p>
      <Card className="mt-6 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="max-w-xs truncate font-medium">{it.question}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">{it.answer.slice(0, 100)}{it.answer.length > 100 && "..."}</TableCell>
                <TableCell>{it.category}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(it.last_updated).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setConfirmDel(it)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Entry" : "New Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div><Label>Answer</Label><Textarea rows={6} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TICKET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Urgency</Label>
                <Select value={form.urgency_level} onValueChange={(v) => setForm({ ...form, urgency_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this Q&A from the knowledge base.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
