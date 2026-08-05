-- Create support_threads table
CREATE TABLE IF NOT EXISTS public.support_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count_owner INTEGER DEFAULT 0,
    unread_count_user INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.support_threads(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT,
    file_url TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Grants (Using public schema)
GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

-- Policies for threads
DO $$ BEGIN
    CREATE POLICY "Users can see their own thread" ON public.support_threads FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create their own thread" ON public.support_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users/Admins can update threads" ON public.support_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policies for messages
DO $$ BEGIN
    CREATE POLICY "Users can see messages in their thread" ON public.support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.support_threads WHERE id = support_messages.thread_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert messages in their thread" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.support_threads WHERE id = support_messages.thread_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true) ON CONFLICT DO NOTHING;

DO $$ BEGIN
    CREATE POLICY "Chat files are public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat-files');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-files');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
