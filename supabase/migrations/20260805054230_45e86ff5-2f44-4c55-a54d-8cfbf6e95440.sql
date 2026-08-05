-- 1. ADICIONAR ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS profiles_referred_by_id_idx ON public.profiles(referred_by_id);
CREATE INDEX IF NOT EXISTS profiles_plan_id_idx ON public.profiles(plan_id);
CREATE INDEX IF NOT EXISTS profiles_created_by_idx ON public.profiles(created_by);
CREATE INDEX IF NOT EXISTS iptv_servers_created_by_idx ON public.iptv_servers(created_by);
CREATE INDEX IF NOT EXISTS server_credentials_server_id_idx ON public.server_credentials(server_id);
CREATE INDEX IF NOT EXISTS user_server_access_user_id_idx ON public.user_server_access(user_id);
CREATE INDEX IF NOT EXISTS user_server_access_server_id_idx ON public.user_server_access(server_id);
CREATE INDEX IF NOT EXISTS device_sessions_user_id_idx ON public.device_sessions(user_id);
-- test_links não tem created_by

-- 2. CORREÇÃO DE PERMISSÕES (GRANTS)
DO $$ 
DECLARE 
    tab RECORD;
BEGIN 
    FOR tab IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') 
    LOOP 
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tab.table_name);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', tab.table_name);
    END LOOP;
END $$;

GRANT SELECT ON public.test_links TO anon;
GRANT SELECT, INSERT ON public.test_device_tracking TO anon;
GRANT SELECT ON public.app_config TO anon;

-- 3. REVISÃO DE POLÍTICAS RLS
DROP POLICY IF EXISTS "Allow authenticated read app_config" ON public.app_config;
CREATE POLICY "Allow anyone to read app_config" ON public.app_config FOR SELECT USING (true);
