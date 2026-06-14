DROP POLICY IF EXISTS "msgs public" ON public.chat_messages;
CREATE POLICY "admins read msgs" ON public.chat_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "sessions public" ON public.conversation_sessions;
CREATE POLICY "admins read sessions" ON public.conversation_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "tickets public read" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets create" ON public.support_tickets;

DROP POLICY IF EXISTS "responses public read" ON public.ticket_responses;
CREATE POLICY "admins read responses" ON public.ticket_responses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "departments read responses" ON public.ticket_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_responses.ticket_id
      AND public.is_department_for_category(auth.uid(), t.category)
  ));

DROP POLICY IF EXISTS "feedback insert" ON public.user_feedback;
CREATE POLICY "feedback insert" ON public.user_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversation_sessions s WHERE s.session_id = user_feedback.session_id
  ));