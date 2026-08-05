-- =====================================================================
-- WEBPLAYER — SCHEMA COMPLETO (backend proprio / Supabase novo)
-- Rode este arquivo PRIMEIRO, no SQL Editor do seu projeto Supabase.
-- Idempotente: pode rodar novamente sem quebrar.
-- =====================================================================

-- ---------- Tipos ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Funcoes utilitarias ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =====================================================================
-- TABELAS
-- =====================================================================

-- Configuracao global do app (tema, TMDB, EPG, Mercado Pago, textos)
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Papeis de acesso (NUNCA guardar role em profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0.00,
  duration_days integer NOT NULL,
  duration_value integer NOT NULL,
  duration_unit text DEFAULT 'days',
  max_connections integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Servidores IPTV
CREATE TABLE IF NOT EXISTS public.iptv_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS iptv_servers_created_by_idx ON public.iptv_servers (created_by);

-- Credenciais / pool de DNS por servidor
CREATE TABLE IF NOT EXISTS public.server_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.iptv_servers(id) ON DELETE CASCADE,
  username text NOT NULL,
  password text NOT NULL,
  dns text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS server_credentials_server_id_idx ON public.server_credentials (server_id);

-- Perfis (dono + usuarios)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text,
  max_connections integer NOT NULL DEFAULT 1,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  referral_code text UNIQUE,
  referred_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_plan_id_idx ON public.profiles (plan_id);
CREATE INDEX IF NOT EXISTS profiles_referred_by_id_idx ON public.profiles (referred_by_id);
CREATE INDEX IF NOT EXISTS profiles_created_by_idx ON public.profiles (created_by);

-- Acesso de cada usuario a cada servidor
CREATE TABLE IF NOT EXISTS public.user_server_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id uuid NOT NULL REFERENCES public.iptv_servers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, server_id)
);
CREATE INDEX IF NOT EXISTS user_server_access_user_id_idx ON public.user_server_access (user_id);
CREATE INDEX IF NOT EXISTS user_server_access_server_id_idx ON public.user_server_access (server_id);

-- Controle de conexoes simultaneas (heartbeat do player)
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  user_agent text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);
CREATE INDEX IF NOT EXISTS device_sessions_user_id_idx ON public.device_sessions (user_id);

-- Links de teste / indicacao
CREATE TABLE IF NOT EXISTS public.test_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  duration_minutes integer NOT NULL DEFAULT 240,
  max_connections integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  bonus_days_monthly integer DEFAULT 15,
  bonus_days_quarterly integer DEFAULT 30,
  description text,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Antiabuso do teste gratis (1 por dispositivo)
CREATE TABLE IF NOT EXISTS public.test_device_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL UNIQUE,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Suporte / chat
CREATE TABLE IF NOT EXISTS public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol text UNIQUE,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count_owner integer NOT NULL DEFAULT 0,
  unread_count_user integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id) -- Mantendo a unicidade se desejar apenas uma thread por user, ou remova para multi-thread
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'expiration', 'mass'
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text,
  file_url text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_thread_idx ON public.support_messages (thread_id, created_at);

-- =====================================================================
-- FUNCAO DE PAPEL (security definer, evita recursao de RLS)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================================
-- TRIGGERS
-- =====================================================================
DROP TRIGGER IF EXISTS update_test_links_updated_at ON public.test_links;
CREATE TRIGGER update_test_links_updated_at
  BEFORE UPDATE ON public.test_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_threads_updated_at ON public.support_threads;
CREATE TRIGGER update_support_threads_updated_at
  BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- GRANTS (obrigatorio no Supabase — sem isso a Data API nega tudo)
-- =====================================================================
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

GRANT SELECT ON public.iptv_servers TO authenticated;
GRANT ALL ON public.iptv_servers TO service_role;

GRANT SELECT ON public.server_credentials TO authenticated;
GRANT ALL ON public.server_credentials TO service_role;

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_server_access TO authenticated;
GRANT ALL ON public.user_server_access TO service_role;

GRANT SELECT ON public.device_sessions TO authenticated;
GRANT ALL ON public.device_sessions TO service_role;

GRANT SELECT ON public.test_links TO authenticated;
GRANT ALL ON public.test_links TO service_role;

GRANT SELECT, INSERT ON public.test_device_tracking TO anon, authenticated;
GRANT ALL ON public.test_device_tracking TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.app_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iptv_servers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_credentials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_server_access     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_links             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_device_tracking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_threads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

-- app_config
DROP POLICY IF EXISTS "Allow anyone to read app_config" ON public.app_config;
CREATE POLICY "Allow anyone to read app_config" ON public.app_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow owner update app_config" ON public.app_config;
CREATE POLICY "Allow owner update app_config" ON public.app_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "authenticated_can_read_own_role" ON public.user_roles;
CREATE POLICY "authenticated_can_read_own_role" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- subscription_plans
DROP POLICY IF EXISTS "Authenticated users can select plans" ON public.subscription_plans;
CREATE POLICY "Authenticated users can select plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Owners can manage plans" ON public.subscription_plans;
CREATE POLICY "Owners can manage plans" ON public.subscription_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- iptv_servers
DROP POLICY IF EXISTS "Owners can manage servers" ON public.iptv_servers;
CREATE POLICY "Owners can manage servers" ON public.iptv_servers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- server_credentials
DROP POLICY IF EXISTS "Owners can manage credentials" ON public.server_credentials;
CREATE POLICY "Owners can manage credentials" ON public.server_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- profiles
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- user_server_access
DROP POLICY IF EXISTS "Read own access" ON public.user_server_access;
CREATE POLICY "Read own access" ON public.user_server_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- device_sessions
DROP POLICY IF EXISTS "Read own devices" ON public.device_sessions;
CREATE POLICY "Read own devices" ON public.device_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- test_links
DROP POLICY IF EXISTS "Owners can manage test links" ON public.test_links;
CREATE POLICY "Owners can manage test links" ON public.test_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- test_device_tracking
DROP POLICY IF EXISTS "Anyone can read tracking info" ON public.test_device_tracking;
CREATE POLICY "Anyone can read tracking info" ON public.test_device_tracking FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert tracking info" ON public.test_device_tracking;
CREATE POLICY "Anyone can insert tracking info" ON public.test_device_tracking FOR INSERT WITH CHECK (true);

-- support_threads
DROP POLICY IF EXISTS "Users can see their own thread" ON public.support_threads;
CREATE POLICY "Users can see their own thread" ON public.support_threads FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can create their own thread" ON public.support_threads;
CREATE POLICY "Users can create their own thread" ON public.support_threads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users and owners can update threads" ON public.support_threads;
CREATE POLICY "Users and owners can update threads" ON public.support_threads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- support_messages
DROP POLICY IF EXISTS "Participants can read messages" ON public.support_messages;
CREATE POLICY "Participants can read messages" ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_threads t
    WHERE t.id = support_messages.thread_id
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  ));
DROP POLICY IF EXISTS "Participants can send messages" ON public.support_messages;
CREATE POLICY "Participants can send messages" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.support_threads t
    WHERE t.id = support_messages.thread_id
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  ));

-- notifications
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- =====================================================================
-- STORAGE (anexos do chat de suporte)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files-v2', 'chat-files-v2', false)
ON CONFLICT (id) DO NOTHING;
