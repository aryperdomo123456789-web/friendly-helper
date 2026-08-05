-- Adiciona colunas para suporte a horas nos planos
ALTER TABLE public.subscription_plans ADD COLUMN duration_value INTEGER;
ALTER TABLE public.subscription_plans ADD COLUMN duration_unit TEXT DEFAULT 'days' CHECK (duration_unit IN ('days', 'hours'));

-- Migra dados existentes de duration_days para duration_value
UPDATE public.subscription_plans SET duration_value = duration_days;

-- Se decidir manter a coluna duration_days para retrocompatibilidade, podemos criar um trigger 
-- ou apenas deixar nula para novos registros. Aqui vou assumir que duration_value é o novo padrão.
ALTER TABLE public.subscription_plans ALTER COLUMN duration_value SET NOT NULL;
