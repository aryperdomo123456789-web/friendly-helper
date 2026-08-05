CREATE POLICY "Authenticated can upload chat files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files-v2');

CREATE POLICY "Authenticated can read chat files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-files-v2');