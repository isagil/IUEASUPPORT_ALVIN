
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS department_category text;

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments readable" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments admin write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.departments (category, name, email) VALUES
  ('Academic Support', 'Academic Affairs Office', 'academic@iuea.ac.ug'),
  ('Technical Issues', 'ICT Services Department', 'ict@iuea.ac.ug'),
  ('Financial Services', 'Finance Office', 'finance@iuea.ac.ug'),
  ('Registration & Enrollment', 'Registrar''s Office', 'registrar@iuea.ac.ug'),
  ('Accommodation', 'Student Housing Office', 'housing@iuea.ac.ug'),
  ('Library Services', 'University Library', 'library@iuea.ac.ug'),
  ('Health & Wellness', 'Student Health Services', 'health@iuea.ac.ug'),
  ('Career Services', 'Career Development Center', 'careers@iuea.ac.ug'),
  ('General Inquiry', 'Student Affairs Office', 'studentaffairs@iuea.ac.ug'),
  ('Other', 'Student Affairs Office', 'studentaffairs@iuea.ac.ug')
ON CONFLICT (category) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_department_for_category(_user_id uuid, _category text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'department'::app_role AND department_category = _category
  )
$$;

CREATE OR REPLACE FUNCTION public.current_department_category(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department_category FROM public.user_roles
   WHERE user_id = _user_id AND role = 'department'::app_role LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.is_department_for_category(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_department_category(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_department_for_category(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_department_category(uuid) TO authenticated, service_role;

CREATE POLICY "department read own category" ON public.support_tickets FOR SELECT TO authenticated
  USING (public.is_department_for_category(auth.uid(), category));
CREATE POLICY "department update own category" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.is_department_for_category(auth.uid(), category))
  WITH CHECK (public.is_department_for_category(auth.uid(), category));

CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id bigint NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_role text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket ON public.ticket_responses(ticket_id);
GRANT SELECT ON public.ticket_responses TO anon, authenticated;
GRANT INSERT ON public.ticket_responses TO authenticated;
GRANT ALL ON public.ticket_responses TO service_role;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses public read" ON public.ticket_responses FOR SELECT USING (true);
CREATE POLICY "admins insert responses" ON public.ticket_responses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "departments insert responses" ON public.ticket_responses FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
       WHERE t.id = ticket_responses.ticket_id
         AND public.is_department_for_category(auth.uid(), t.category)
    )
  );
