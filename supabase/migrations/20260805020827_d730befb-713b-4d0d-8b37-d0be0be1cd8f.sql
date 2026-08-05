UPDATE public.app_config 
SET config = config || '{"tmdb_api_key": "56bb2e86749197e89c3dbb878314ea03", "epg_xmltv_url": "http://epgpainel.ddns.net/epg.xml"}'::jsonb
WHERE id = (SELECT id FROM public.app_config LIMIT 1);