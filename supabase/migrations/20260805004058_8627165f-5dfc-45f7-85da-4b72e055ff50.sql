-- Perfis dos acessos criados pelo dono
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text,
  max_connections integer NOT NULL DEFAULT 1,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Quais servidores cada acesso pode usar
CREATE TABLE public.user_server_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id uuid NOT NULL REFERENCES public.iptv_servers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, server_id)
);
GRANT SELECT ON public.user_server_access TO authenticated;
GRANT ALL ON public.user_server_access TO service_role;
ALTER TABLE public.user_server_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own access" ON public.user_server_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Controle de conexões simultâneas por dispositivo
CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  user_agent text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);
GRANT SELECT ON public.device_sessions TO authenticated;
GRANT ALL ON public.device_sessions TO service_role;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own devices" ON public.device_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Substituída por profiles + user_server_access
DROP TABLE IF EXISTS public.iptv_subscriptions;

-- Metadados extras dos servidores
ALTER TABLE public.iptv_servers ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.iptv_servers ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;