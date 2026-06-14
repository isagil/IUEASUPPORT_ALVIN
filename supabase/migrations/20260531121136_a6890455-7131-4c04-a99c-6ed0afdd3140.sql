
CREATE OR REPLACE FUNCTION public.get_email_by_registration(_reg_no text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE registration_number = _reg_no LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_registration(text) TO anon, authenticated;
