CREATE TABLE public.test_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 240,
    max_connections integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_links TO authenticated;
GRANT ALL ON public.test_links TO service_role;
GRANT SELECT ON public.test_links TO anon;

ALTER TABLE public.test_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view test links" ON public.test_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage test links" ON public.test_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Link auto-generated user to a server? We'll need a default server for tests.
-- Or just allow all servers for tests? The owner will manage this.

ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS test_duration_minutes integer DEFAULT 240;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS test_max_connections integer DEFAULT 1;

