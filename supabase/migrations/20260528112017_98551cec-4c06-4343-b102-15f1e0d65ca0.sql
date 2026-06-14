-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  registration_number text UNIQUE NOT NULL,
  faculty text,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Knowledge base
CREATE TABLE public.knowledge_base (
  id bigserial PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL,
  confidence_score real NOT NULL DEFAULT 1.0,
  source_document text,
  urgency_level text NOT NULL DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_base TO anon, authenticated;
GRANT ALL ON public.knowledge_base TO service_role;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb public read" ON public.knowledge_base FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage kb" ON public.knowledge_base FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Conversation sessions
CREATE TABLE public.conversation_sessions (
  id bigserial PRIMARY KEY,
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_context text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversation_sessions TO anon, authenticated;
GRANT ALL ON public.conversation_sessions TO service_role;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions public" ON public.conversation_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Chat messages
CREATE TABLE public.chat_messages (
  id bigserial PRIMARY KEY,
  session_id text NOT NULL REFERENCES public.conversation_sessions(session_id) ON DELETE CASCADE,
  content text NOT NULL,
  role text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msgs public" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Support tickets
CREATE TABLE public.support_tickets (
  id bigserial PRIMARY KEY,
  ticket_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  user_question text,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  student_name text NOT NULL,
  student_email text NOT NULL,
  student_id text NOT NULL,
  student_registration_no text NOT NULL,
  student_faculty text,
  assigned_to text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT ON public.support_tickets TO anon, authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets create" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Feedback
CREATE TABLE public.user_feedback (
  id bigserial PRIMARY KEY,
  session_id text NOT NULL,
  rating int,
  helpful boolean,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.user_feedback TO anon, authenticated;
GRANT SELECT ON public.user_feedback TO authenticated;
GRANT ALL ON public.user_feedback TO service_role;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback insert" ON public.user_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read feedback" ON public.user_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed knowledge base
INSERT INTO public.knowledge_base (question, answer, category) VALUES
('How do I register for courses?','Log in to the IUEA student portal at portal.iuea.ac.ug, navigate to Course Registration, select your faculty and semester, choose your courses, and submit. Registration opens 2 weeks before semester starts.','Registration & Enrollment'),
('How do I pay tuition fees?','Fees can be paid via bank transfer to IUEA''s bank accounts (details on the finance office notice board), mobile money (MTN/Airtel), or in person at the Finance Office. Always get a receipt and keep your payment reference number.','Financial Services'),
('What is the fee structure?','Fee structures vary by faculty and year of study. Visit the Finance Office or check the IUEA website for the current fee schedule. Fees are typically paid per semester.','Financial Services'),
('How do I access the student portal?','Visit portal.iuea.ac.ug and log in with your student registration number and password. If you''ve forgotten your password, click ''Forgot Password'' or visit the ICT department.','Technical Issues'),
('Where is the library and what are the opening hours?','The IUEA Library is located in the main campus building. Opening hours: Monday-Friday 8am-8pm, Saturday 9am-5pm, Sunday 10am-4pm. You need your student ID card to access library resources.','Library Services'),
('How do I apply for accommodation?','Apply for accommodation through the Student Affairs office or the student portal. Accommodation is allocated on a first-come-first-served basis. You''ll need to pay a deposit to secure your room.','Accommodation'),
('How do I get my student ID card?','Visit the Registrar''s office with your admission letter and passport photo. First-year students get IDs during orientation week. Replacement IDs cost a small fee.','Registration & Enrollment'),
('How do I view my exam results?','Log in to the student portal at portal.iuea.ac.ug and navigate to ''Exam Results''. Results are posted within 4-6 weeks after examinations. Contact the Registrar''s office if results are missing.','Academic Support'),
('What health services are available?','IUEA has a Health Centre on campus providing basic medical services. Opening hours: Monday-Friday 8am-5pm. For emergencies outside these hours, students are referred to nearby hospitals. Health services are subsidized for students.','Health & Wellness'),
('How do I get a recommendation letter?','Request recommendation letters from your course lecturers or Head of Department. Give at least 2 weeks notice, provide your CV and the purpose of the letter. Official letters can also be obtained from the Registrar''s office.','Academic Support'),
('What do I do if I miss an exam?','If you miss an exam due to illness or emergency, report to the Dean of Students office within 48 hours with supporting documentation (medical certificate, etc.). A special exam may be granted at the Dean''s discretion.','Academic Support'),
('How do I apply for a leave of absence?','Submit a Leave of Absence application form to the Registrar''s office with supporting reasons. Get approval from your Head of Department and Dean of Students. Approved leave preserves your student status.','Registration & Enrollment');
