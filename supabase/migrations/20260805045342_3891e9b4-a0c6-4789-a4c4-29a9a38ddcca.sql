-- Adicionar coluna referral_code na tabela profiles (tabela de usuários)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES auth.users(id);

-- Gerar referral_code para usuários existentes
UPDATE public.profiles SET referral_code = substring(gen_random_uuid()::text from 1 for 8) WHERE referral_code IS NULL;

-- Adicionar coluna referred_by_id na tabela test_links
ALTER TABLE public.test_links ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);

-- Garantir privilégios
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.test_links TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.test_links TO service_role;
