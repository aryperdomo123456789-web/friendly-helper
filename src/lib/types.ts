import { z } from "zod";

export const AppConfigSchema = z.object({
  domain: z.string().default("mago-pd.com"),
  base_url: z.string().url().default("http://mago-pd.com"),
  name: z.string().default("WEBPLAYER"),
  short_name: z.string().default("WebPlayer"),
  description: z.string().default("Webplayer multi-servidor com navegação centralizada."),
  tmdb_api_key: z.string().default("56bb2e86749197e89c3dbb878314ea03"),
  epg_xmltv_url: z.string().url().default("http://epgpainel.ddns.net/epg.xml"),
  epg_xmltv_ttl_hours: z.number().default(3),
  logo_url: z.string().url().optional().or(z.literal("")),
  logo_small_url: z.string().url().optional().or(z.literal("")),
  favicon_url: z.string().url().optional().or(z.literal("")),
  theme_mode: z.enum(["azul", "dark", "light"]).default("azul"),
  support_auto_reply: z.string().default("Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar."),
  support_attendant_name: z.string().default("Suporte WebPlayer"),
  mp_enabled: z.boolean().default(false),
  mp_access_token: z.string().optional(),
  mp_public_key: z.string().optional(),
  theme: z.object({
    bg: z.string().default("#05070b"),
    surface: z.string().default("#0f171e"),
    surface_alt: z.string().default("#141b29"),
    primary: z.string().default("#3ba0ff"),
    text: z.string().default("#ffffff"),
    radius: z.string().default("18px"),
  }).default({}),
  copy: z.object({
    home_title: z.string().default("Início"),
    home_subtitle: z.string().default("Biblioteca principal sincronizada."),
    movies_title: z.string().default("Filmes"),
    series_title: z.string().default("Séries"),
    live_title: z.string().default("TV ao Vivo"),
  }).default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export interface IPTVServer {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  credentials: ServerCredential[];
}

export interface ServerCredential {
  dns: string;
  username: string;
  password: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_value: number;
  duration_unit: "days" | "hours" | "minutes";
  max_connections: number;
}

export interface AccessUser {
  id: string;
  username: string;
  display_name?: string;
  max_connections: number;
  expires_at?: string;
  is_active: boolean;
  server_ids: string[];
  online: number;
  plan_id?: string;
  plan?: SubscriptionPlan;
  referred_by_id?: string;
}

export interface SupportThread {
  id: string;
  user_id: string;
  protocol?: string;
  last_message?: string;
  last_message_at: string;
  unread_count_owner: number;
  unread_count_user: number;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    display_name?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'expiration' | 'mass';
  is_read: boolean;
  created_at: string;
}
