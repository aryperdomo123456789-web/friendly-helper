-- Add ZEUS PLAY server
INSERT INTO public.iptv_servers (name, url, sort_order, is_active)
VALUES ('ZEUS PLAY', 'http://zeusplayy.hstt.site:80', 4, true);

-- Add credentials for ZEUS PLAY
INSERT INTO public.server_credentials (server_id, username, password, dns)
SELECT id, '955438', '474941', 'http://zeusplayy.hstt.site:80'
FROM public.iptv_servers
WHERE name = 'ZEUS PLAY'
LIMIT 1;