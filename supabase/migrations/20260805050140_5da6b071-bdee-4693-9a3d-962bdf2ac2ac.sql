-- Garantir link padrão
INSERT INTO public.test_links (slug, duration_minutes, max_connections, is_active)
VALUES ('gratis', 360, 1, true)
ON CONFLICT (slug) DO NOTHING;

-- Garantir permissões básicas
GRANT SELECT ON public.test_links TO anon;
GRANT SELECT ON public.test_links TO authenticated;
GRANT ALL ON public.test_links TO service_role;

GRANT SELECT, INSERT ON public.test_device_tracking TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_device_tracking TO authenticated;
GRANT ALL ON public.test_device_tracking TO service_role;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
