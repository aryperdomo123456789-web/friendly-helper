CREATE TABLE IF NOT EXISTS public.app_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read app_config" ON public.app_config
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow owner update app_config" ON public.app_config
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
