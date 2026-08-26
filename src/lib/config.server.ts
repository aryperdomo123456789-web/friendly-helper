import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { AppConfigSchema } from "./types";
const DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";

export function mergeRuntimeConfig(config: unknown) {
  const parsed = AppConfigSchema.parse(config);
  const request = getRequest();
  const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host");
  const proto = request?.headers.get("x-forwarded-proto") || "https";
  const runtimeBaseUrl = host ? `${proto}://${host}` : null;
  const runtimeDomain = host ? host.replace(/:\d+$/, "") : null;

  return {
    ...parsed,
    logo_url: parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
    logo_small_url: parsed.logo_small_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
    favicon_url: parsed.favicon_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
    ...(runtimeDomain ? { domain: runtimeDomain } : null),
    ...(runtimeBaseUrl ? { base_url: runtimeBaseUrl } : null),
  };
}

export type RuntimeAppConfig = ReturnType<typeof mergeRuntimeConfig>;

export async function loadAppConfig(): Promise<RuntimeAppConfig> {
  const { data, error } = await supabaseAdmin.from("app_config").select("*").limit(1).maybeSingle();

  if (error) {
    throw new Error("Erro ao carregar as configurações: " + error.message);
  }

  if (!data) {
    const defaultConfig = AppConfigSchema.parse({});
    const { data: newData, error: insertError } = await supabaseAdmin
      .from("app_config")
      .insert([{ config: defaultConfig }])
      .select()
      .single();

    if (insertError)
      throw new Error("Erro ao criar as configurações padrão: " + insertError.message);
    return mergeRuntimeConfig(newData.config);
  }

  return mergeRuntimeConfig(data.config);
}

export async function assertConfigAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .limit(1);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Acesso restrito à configuração administrativa.");
  }
}
