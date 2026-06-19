-- Add department + escalation tracking for tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS escalated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_created boolean NOT NULL DEFAULT false;

-- Allow anonymous/public read of tickets so "My Tickets" works without login
DROP POLICY IF EXISTS "tickets public read" ON public.support_tickets;
CREATE POLICY "tickets public read"
ON public.support_tickets
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.support_tickets TO anon;