import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { AppConfigSchema, type AppConfig } from "./types";
const DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";

type RuntimeProcess = {
  env?: Record<string, string | undefined>;
};

function getRuntimeEnv(name: string): string | undefined {
  const runtimeProcess = (globalThis as typeof globalThis & { process?: RuntimeProcess }).process;
  return runtimeProcess?.env?.[name];
}

function applySandboxOverrides(config: AppConfig): AppConfig {
  const sandboxEnabled =
    getRuntimeEnv("NODE_ENV") !== "production" && getRuntimeEnv("MP_SANDBOX_MODE") === "true";
  if (!sandboxEnabled) return config;

  const sandboxToken = getRuntimeEnv("MP_SANDBOX_ACCESS_TOKEN")?.trim();
  const sandboxPublicKey = getRuntimeEnv("MP_SANDBOX_PUBLIC_KEY")?.trim();
  const sandboxWebhookSecret = getRuntimeEnv("MP_SANDBOX_WEBHOOK_SECRET")?.trim();

  return AppConfigSchema.parse({
    ...config,
    ...(sandboxToken ? { mp_access_token: sandboxToken, mp_enabled: true } : null),
    ...(sandboxPublicKey ? { mp_public_key: sandboxPublicKey } : null),
    ...(sandboxWebhookSecret ? { mp_webhook_secret: sandboxWebhookSecret } : null),
  });
}

export function mergeRuntimeConfig(config: unknown) {
  const parsed = applySandboxOverrides(AppConfigSchema.parse(config));
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
