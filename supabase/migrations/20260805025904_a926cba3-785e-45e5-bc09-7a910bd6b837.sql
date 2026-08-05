CREATE TABLE public.test_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  duration_minutes integer NOT NULL DEFAULT 240,
  max_connections integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_links TO authenticated;
GRANT ALL ON public.test_links TO service_role;

ALTER TABLE public.test_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage test links"
ON public.test_links FOR ALL TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_test_links_updated_at
BEFORE UPDATE ON public.test_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();