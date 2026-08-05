-- =====================================================================
-- WEBPLAYER — DADOS BASE (planos, servidores, credenciais, links, config)
-- Rode DEPOIS do 01-schema.sql, no SQL Editor do seu projeto Supabase.
-- Nao depende de usuarios: pode rodar antes de criar o dono.
-- Idempotente.
-- =====================================================================

-- ---------- Configuracao global ----------
INSERT INTO public.app_config (config)
SELECT '{
  "name": "WEBPLAYER",
  "short_name": "WebPlayer",
  "domain": "mago-pd.com",
  "base_url": "http://mago-pd.com",
  "description": "Webplayer multi-servidor com navegacao centralizada.",
  "tmdb_api_key": "56bb2e86749197e89c3dbb878314ea03",
  "epg_xmltv_url": "http://epgpainel.ddns.net/epg.xml",
  "epg_xmltv_ttl_hours": 3,
  "theme_mode": "azul",
  "support_attendant_name": "MagoPD",
  "support_auto_reply": "Ola! Esta e uma resposta automatica. Recebemos sua mensagem e em breve um de nossos atendentes ira te ajudar.",
  "theme": {
    "bg": "#05070b",
    "surface": "#0f171e",
    "surface_alt": "#141b29",
    "primary": "#3ba0ff",
    "text": "#ffffff",
    "radius": "18px"
  },
  "copy": {
    "home_title": "Inicio",
    "home_subtitle": "Biblioteca principal sincronizada.",
    "movies_title": "Filmes",
    "series_title": "Series",
    "live_title": "TV ao Vivo"
  }
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.app_config);

-- ---------- Planos ----------
INSERT INTO public.subscription_plans (name, price, duration_days, duration_value, duration_unit, max_connections)
SELECT * FROM (VALUES
  ('Mensal',      30.00,  30,  30,  'days',    1),
  ('Trimestral',  80.00,  90,  90,  'days',    1),
  ('Semestral',  150.00, 180, 180,  'days',    1),
  ('Anual',      250.00, 365, 365,  'days',    1),
  ('Teste',        0.00,   1,  30,  'minutes', 1)
) AS v(name, price, duration_days, duration_value, duration_unit, max_connections)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans p WHERE p.name = v.name);

-- ---------- Servidores IPTV ----------
INSERT INTO public.iptv_servers (name, url, is_active, sort_order)
SELECT * FROM (VALUES
  ('METAPLAY',   'http://metaplayy.site:80',      true, 1),
  ('WOLF TV',    'http://wolftv.hstt.site:80',    true, 2),
  ('ALPHA PLAY', 'http://alphaaplay.hstt.site:80',true, 3),
  ('ZEUS PLAY',  'http://zeusplayy.hstt.site:80', true, 4)
) AS v(name, url, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.iptv_servers s WHERE s.name = v.name);

-- ---------- Credenciais / pool de DNS ----------
INSERT INTO public.server_credentials (server_id, username, password, dns)
SELECT s.id, v.username, v.password, v.dns
FROM (VALUES
  ('METAPLAY',   '331564', '216567', 'http://metaplayy.site:80'),
  ('WOLF TV',    '149472', '634572', 'http://wolftv.hstt.site:80'),
  ('WOLF TV',    '626179', '458369', 'http://cdnwolftv.hstt.site:80'),
  ('ALPHA PLAY', '827828', '747844', 'http://alphaaplay.hstt.site:80'),
  ('ALPHA PLAY', '827828', '747844', 'http://cdnalphaaplay.hstt.site:80'),
  ('ZEUS PLAY',  '955438', '474941', 'http://zeusplayy.hstt.site:80')
) AS v(server, username, password, dns)
JOIN public.iptv_servers s ON s.name = v.server
WHERE NOT EXISTS (
  SELECT 1 FROM public.server_credentials c
  WHERE c.server_id = s.id AND c.dns = v.dns AND c.username = v.username
);

-- ---------- Links de teste / indicacao ----------
INSERT INTO public.test_links (slug, duration_minutes, max_connections, is_active, bonus_days_monthly, bonus_days_quarterly, description)
SELECT * FROM (VALUES
  ('gratis',               360, 1, true, 15, 30, NULL),
  ('test-precision-blqac', 240, 1, true, 15, 30, 'Link de Teste Precisao')
) AS v(slug, duration_minutes, max_connections, is_active, bonus_days_monthly, bonus_days_quarterly, description)
WHERE NOT EXISTS (SELECT 1 FROM public.test_links t WHERE t.slug = v.slug);
