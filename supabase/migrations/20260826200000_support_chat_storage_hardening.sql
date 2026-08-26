-- Hardening do bucket de anexos do suporte.
-- Aplicar somente após backup e autorização operacional.

-- As políticas anteriores permitiam que qualquer autenticado lesse ou gravasse
-- em qualquer caminho do bucket. O path canônico é chat/<thread_id>/<arquivo>.
drop policy if exists "Authenticated can upload chat files" on storage.objects;
drop policy if exists "Authenticated can read chat files" on storage.objects;

do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'chat-files-v2'
  ) then
    insert into storage.buckets (id, name, public)
    values ('chat-files-v2', 'chat-files-v2', false);
  end if;
end $$;

create policy "Chat participants can upload their thread files"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'chat-files-v2'
  and (storage.foldername(name))[1] = 'chat'
  and (storage.foldername(name))[2] is not null
  and exists (
    select 1
    from public.support_threads thread
    where thread.id::text = (storage.foldername(name))[2]
      and (
        thread.user_id = auth.uid()
        or public.has_role(auth.uid(), 'owner')
        or public.has_role(auth.uid(), 'admin')
      )
  )
);

create policy "Chat participants can read their thread files"
on storage.objects
for select to authenticated
using (
  bucket_id = 'chat-files-v2'
  and (storage.foldername(name))[1] = 'chat'
  and (storage.foldername(name))[2] is not null
  and exists (
    select 1
    from public.support_threads thread
    where thread.id::text = (storage.foldername(name))[2]
      and (
        thread.user_id = auth.uid()
        or public.has_role(auth.uid(), 'owner')
        or public.has_role(auth.uid(), 'admin')
      )
  )
);
