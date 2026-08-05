-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- IPTV Servers table
CREATE TABLE public.iptv_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iptv_servers TO authenticated;
GRANT ALL ON public.iptv_servers TO service_role;

ALTER TABLE public.iptv_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage servers"
ON public.iptv_servers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Server Credentials
CREATE TABLE public.server_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.iptv_servers(id) ON DELETE CASCADE NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    dns TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_credentials TO authenticated;
GRANT ALL ON public.server_credentials TO service_role;

ALTER TABLE public.server_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage credentials"
ON public.server_credentials
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- User IPTV Subscriptions
CREATE TABLE public.iptv_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    server_id UUID REFERENCES public.iptv_servers(id) ON DELETE CASCADE NOT NULL,
    max_connections INTEGER DEFAULT 1 NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iptv_subscriptions TO authenticated;
GRANT ALL ON public.iptv_subscriptions TO service_role;

ALTER TABLE public.iptv_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.iptv_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage subscriptions"
ON public.iptv_subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
