# SupBot — Deployment & Migration Requirements

This document lists everything required to migrate **SupBot (IUEA Student Support Chatbot)** from Lovable Cloud to any other hosting provider (Vercel, Netlify, Render, Railway, AWS, self-hosted Node, etc.) with its own Postgres/Supabase backend.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TanStack Start (Vite 7) + Tailwind CSS v4 + shadcn/ui |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Backend (current) | Supabase Edge Functions (Deno) |
| Backend (portable alternative) | Node.js 20+ / Express (re-implement the 5 functions below) |
| Database | PostgreSQL 15+ (Supabase-compatible) |
| Auth | Supabase Auth (email + password) |
| AI | Lovable AI Gateway (OpenAI-compatible). Swappable with OpenAI API directly. |

---

## 2. Required Environment Variables

### 2.1 Frontend (build-time, public — prefix `VITE_`)
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...   # anon / publishable key
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-REF
```

### 2.2 Backend / Edge Functions (server-only, SECRET)
```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...        # bypasses RLS — never expose
SUPABASE_JWKS=...                              # JWT verification
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres
LOVABLE_API_KEY=lv_...                         # or replace with OPENAI_API_KEY
```

### 2.3 Optional (if migrating AI off Lovable Gateway)
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini                       # replaces google/gemini-3-flash-preview
```

---

## 3. External APIs / URLs

| Service | URL | Purpose | Auth |
|---|---|---|---|
| Supabase REST/Auth | `https://YOUR-PROJECT.supabase.co` | DB, auth, storage | `apikey` + `Authorization: Bearer <jwt>` |
| Supabase Edge Functions | `https://YOUR-PROJECT.supabase.co/functions/v1/{name}` | Backend logic | `Authorization: Bearer <jwt or anon>` |
| Lovable AI Gateway | `https://ai.gateway.lovable.dev/v1/chat/completions` | LLM completions (OpenAI-compatible) | `Authorization: Bearer $LOVABLE_API_KEY` |
| OpenAI (alt) | `https://api.openai.com/v1/chat/completions` | Drop-in replacement | `Authorization: Bearer $OPENAI_API_KEY` |

---

## 4. Backend Endpoints (Edge Functions)

All located in `supabase/functions/<name>/index.ts`. Re-implement as Express routes if migrating off Supabase.

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/functions/v1/chat` | POST | anon or user | Sends message → KB similarity search → Lovable AI → returns reply + suggestions. Body: `{ message, session_id? }` |
| `/functions/v1/create-ticket` | POST | anon or user | Creates support ticket with ID format `DDMM/cat/###`. Body: `{ title, description, category, studentName, studentEmail, studentId, studentRegistrationNo, studentFaculty?, priority? }` |
| `/functions/v1/admin-stats` | GET | admin JWT | Dashboard metrics (chats, tickets by status, KB count, recent tickets) |
| `/functions/v1/feedback` | POST | anon | Stores feedback. Body: `{ session_id, rating?, helpful?, feedback? }` |
| `/functions/v1/seed-admin` | POST | none | One-time: creates `admin@iuea.ac.ug` / `admin123` with `admin` role |

CORS headers used on all functions:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

---

## 5. Database Schema (PostgreSQL)

Tables (all in `public` schema):

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | Student profile linked to `auth.users` | `id (uuid)`, `name`, `email`, `registration_number`, `faculty` |
| `user_roles` | RBAC (separate table — prevents privilege escalation) | `user_id`, `role` (enum `app_role`: `admin`,`moderator`,`user`) |
| `knowledge_base` | Q&A entries for chatbot KB | `question`, `answer`, `category`, `confidence_score`, `urgency_level` |
| `conversation_sessions` | Chat sessions | `session_id (text)`, `user_id`, `last_activity` |
| `chat_messages` | Individual messages | `session_id`, `content`, `role` (`user`/`assistant`) |
| `support_tickets` | Tickets (`DDMM/cat/###`) | `ticket_id`, `title`, `description`, `category`, `priority`, `status`, `student_*` |
| `user_feedback` | Post-chat feedback | `session_id`, `rating`, `helpful`, `feedback` |

### Required SQL objects
- Enum: `app_role` (`admin`, `moderator`, `user`)
- Function: `public.has_role(_user_id uuid, _role app_role) RETURNS boolean` — `SECURITY DEFINER`, used in RLS policies
- RLS enabled on all tables (see policies in current `<supabase-tables>` for reference)
- GRANTs to `anon`, `authenticated`, `service_role` per table

Export current schema:
```bash
pg_dump --schema-only "$SUPABASE_DB_URL" > schema.sql
pg_dump --data-only --table=public.knowledge_base "$SUPABASE_DB_URL" > kb_seed.sql
```

Restore on new host:
```bash
psql "$NEW_DB_URL" < schema.sql
psql "$NEW_DB_URL" < kb_seed.sql
```

---

## 6. Seed Data

- **Knowledge Base**: 12 IUEA-specific Q&A entries (export from `knowledge_base` table).
- **Admin user**: `admin@iuea.ac.ug` / `admin123` — call `POST /functions/v1/seed-admin` once after deploy.
- **Ticket categories** (`src/lib/api.ts → TICKET_CATEGORIES`):
  Academic Support, Technical Issues, Financial Services, Registration & Enrollment, Accommodation, Library Services, Health & Wellness, Career Services, General Inquiry, Other.

---

## 7. Frontend Build & Run

```bash
# Install
bun install        # or npm install

# Dev
bun dev            # Vite dev server on http://localhost:8080

# Production build
bun run build      # outputs to .output/ (TanStack Start SSR bundle)
bun run start      # runs the SSR server
```

Node.js: **>= 20.x** required (TanStack Start v1 + Vite 7).

---

## 8. Deployment Checklist

1. [ ] Create new Postgres database (Supabase project or self-hosted PG 15+).
2. [ ] Run `schema.sql` + `kb_seed.sql`.
3. [ ] Create Supabase Auth project (or wire your own JWT auth).
4. [ ] Configure all env vars from §2 on the host.
5. [ ] Deploy edge functions:
   ```bash
   supabase functions deploy chat create-ticket admin-stats feedback seed-admin
   ```
   *(or re-implement as Express routes)*
6. [ ] Set function secrets: `supabase secrets set LOVABLE_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=...`
7. [ ] Build & deploy frontend (Vercel/Netlify/Cloudflare/Node).
8. [ ] Call `POST /functions/v1/seed-admin` once to create the admin account.
9. [ ] Log in at `/admin/login` with `admin@iuea.ac.ug` / `admin123` and **change the password**.
10. [ ] Verify: chat works, ticket creation produces `DDMM/cat/###`, admin dashboard loads stats.

---

## 9. NPM Dependencies (key)

See `package.json` for the full list. Critical runtime deps:

```
react, react-dom              ^19
@tanstack/react-router        ^1
@tanstack/react-start         ^1
@tanstack/react-query         ^5
@supabase/supabase-js         ^2.45
tailwindcss                   ^4
vite                          ^7
zod                           ^3
lucide-react, sonner, class-variance-authority, clsx, tailwind-merge
# + shadcn/ui Radix primitives (see package.json)
```

---

## 10. Security Notes

- **Never** ship `SUPABASE_SERVICE_ROLE_KEY` or `LOVABLE_API_KEY` to the browser.
- Roles live in `user_roles` table — do not store role on `profiles`.
- All sensitive tables use RLS + `has_role()` function.
- Change the seeded admin password immediately after first login.
- Rotate `LOVABLE_API_KEY` / `OPENAI_API_KEY` periodically.

---

**Contact for issues**: IUEA IT Department.
