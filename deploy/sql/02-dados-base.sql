-- Dados base do backend proprio
-- Executar depois do schema.

insert into public.app_config (id, config, updated_at)
values (
  'bcfecc47-997b-467d-94bc-c50c72f0218f',
  '{
    "domain": "stream.mago-bot.com",
    "base_url": "https://stream.mago-bot.com",
    "name": "WEBPLAYER",
    "short_name": "WebPlayer",
    "description": "Webplayer multi-servidor com navegação centralizada.",
    "tmdb_api_key": "56bb2e86749197e89c3dbb878314ea03",
    "epg_xmltv_url": "http://epgpainel.ddns.net/epg.xml",
    "epg_xmltv_ttl_hours": 3,
    "theme_mode": "azul",
    "support_auto_reply": "Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar.",
    "support_attendant_name": "MagoPD",
    "theme": {
      "bg": "#05070b",
      "surface": "#0f171e",
      "surface_alt": "#141b29",
      "primary": "#3ba0ff",
      "text": "#ffffff",
      "radius": "18px"
    },
    "copy": {
      "home_title": "Início",
      "home_subtitle": "Biblioteca principal sincronizada.",
      "movies_title": "Filmes",
      "series_title": "Séries",
      "live_title": "TV ao Vivo"
    }
  }'::jsonb,
  timezone('utc'::text, now())
)
on conflict (id) do update
set config = excluded.config,
    updated_at = excluded.updated_at;

insert into public.subscription_plans (id, name, price, duration_days, duration_value, duration_unit, max_connections, created_at, updated_at)
values
  ('f2ed1680-9f46-4609-a0cc-e2c00bd08c72', 'Teste', 0.00, 1, 30, 'minutes', 1, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('acbf4276-ba54-466c-a31d-3ded741f1fa9', 'Mensal', 30.00, 30, 30, 'days', 1, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('f1c4793a-83f8-4695-b9b8-30346d0e47a6', 'Trimestral', 80.00, 90, 90, 'days', 1, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('bfcd6afa-a770-48c0-a027-c237b98eaa53', 'Semestral', 150.00, 180, 180, 'days', 1, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('6c131207-19e8-4623-939c-5ecd7876ba1e', 'Anual', 250.00, 365, 365, 'days', 1, timezone('utc'::text, now()), timezone('utc'::text, now()))
on conflict (id) do update
set name = excluded.name,
    price = excluded.price,
    duration_days = excluded.duration_days,
    duration_value = excluded.duration_value,
    duration_unit = excluded.duration_unit,
    max_connections = excluded.max_connections,
    updated_at = excluded.updated_at;

insert into public.iptv_servers (id, name, url, is_active, sort_order, created_at)
values
  ('fec52f0b-475b-40e5-9056-721cb0152777', 'METAPLAY', 'http://metaplayy.site:80', true, 1, timezone('utc'::text, now())),
  ('104eb938-0cdd-47f7-887f-5d436d585242', 'WOLF TV', 'http://wolftv.hstt.site:80', true, 2, timezone('utc'::text, now())),
  ('b0d6e5d8-0030-4db2-a76f-9f784ee17ea2', 'ALPHA PLAY', 'http://alphaaplay.hstt.site:80', true, 3, timezone('utc'::text, now())),
  ('9ae2e67b-3321-42af-8605-1206fbd1af07', 'ZEUS PLAY', 'http://zeusplayy.hstt.site:80', true, 4, timezone('utc'::text, now()))
on conflict (id) do update
set name = excluded.name,
    url = excluded.url,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.server_credentials (id, server_id, username, password, dns, created_at)
values
  ('dddbfa5d-9a41-437d-b8a0-6d9864d1d001', 'fec52f0b-475b-40e5-9056-721cb0152777', '331564', '216567', 'http://metaplayy.site:80', timezone('utc'::text, now())),
  ('dddbfa5d-9a41-437d-b8a0-6d9864d1d002', '104eb938-0cdd-47f7-887f-5d436d585242', '149472', '634572', 'http://wolftv.hstt.site:80', timezone('utc'::text, now())),
  ('dddbfa5d-9a41-437d-b8a0-6d9864d1d003', '104eb938-0cdd-47f7-887f-5d436d585242', '626179', '458369', 'http://cdnwolftv.hstt.site:80', timezone('utc'::text, now())),
  ('dddbfa5d-9a41-437d-b8a0-6d9864d1d004', 'b0d6e5d8-0030-4db2-a76f-9f784ee17ea2', '827828', '747844', 'http://alphaaplay.hstt.site:80', timezone('utc'::text, now())),
  ('dddbfa5d-9a41-437d-b8a0-6d9864d1d005', 'b0d6e5d8-0030-4db2-a76f-9f784ee17ea2', '827828', '747844', 'http://cdnalphaaplay.hstt.site:80', timezone('utc'::text, now())),
  ('dddbfa5d-9a41-437d-b8a0-6d9864d1d006', '9ae2e67b-3321-42af-8605-1206fbd1af07', '955438', '474941', 'http://zeusplayy.hstt.site:80', timezone('utc'::text, now()))
on conflict (id) do update
set server_id = excluded.server_id,
    username = excluded.username,
    password = excluded.password,
    dns = excluded.dns;

insert into public.test_links (id, slug, duration_minutes, max_connections, is_active, bonus_days_monthly, bonus_days_quarterly, description, created_at, updated_at)
values
  ('c4164ee4-1060-4486-921e-44fa086da188', 'gratis', 360, 1, true, 15, 30, null, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('3525830a-4a60-4bf3-8f9a-b567afe87c84', 'test-precision-blqac', 240, 1, true, 15, 30, 'Link de Teste Precisão', timezone('utc'::text, now()), timezone('utc'::text, now()))
on conflict (id) do update
set slug = excluded.slug,
    duration_minutes = excluded.duration_minutes,
    max_connections = excluded.max_connections,
    is_active = excluded.is_active,
    bonus_days_monthly = excluded.bonus_days_monthly,
    bonus_days_quarterly = excluded.bonus_days_quarterly,
    description = excluded.description,
    updated_at = excluded.updated_at;
