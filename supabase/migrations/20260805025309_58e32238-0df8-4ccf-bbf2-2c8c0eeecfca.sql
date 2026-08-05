-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_days INTEGER NOT NULL, -- duration in days
    max_connections INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add plan_id to profiles
ALTER TABLE public.profiles ADD COLUMN plan_id UUID REFERENCES public.subscription_plans(id);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

-- Policies for subscription_plans
CREATE POLICY "Owners can manage plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Authenticated users can select plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- Seed default plans
INSERT INTO public.subscription_plans (name, price, duration_days, max_connections)
VALUES 
('Teste', 0.00, 1, 1),
('Mensal', 30.00, 30, 1),
('Trimestral', 80.00, 90, 1),
('Semestral', 150.00, 180, 1),
('Anual', 250.00, 365, 1);
