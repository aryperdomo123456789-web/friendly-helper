ALTER TABLE public.test_links ADD COLUMN IF NOT EXISTS bonus_days_monthly INTEGER DEFAULT 15;
ALTER TABLE public.test_links ADD COLUMN IF NOT EXISTS bonus_days_quarterly INTEGER DEFAULT 30;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_links TO authenticated;
GRANT ALL ON public.test_links TO service_role;
GRANT SELECT ON public.test_links TO anon;