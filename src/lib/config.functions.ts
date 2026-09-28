
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AppConfigSchema } from "./types";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";
export const REMOTE_BRAND_IMAGE_URL = "https://i.imgur.com/RrqwMFH.png";
export const APP_CONFIG_QUERY_KEY = ["app-config"] as const;

function getRuntimeBaseUrl(): string | null {
  const request = getRequest();
  if (!request) return null;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return null;

  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function getRuntimeDomain(): string | null {
  const request = getRequest();
  const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host");
  return host ? host.replace(/:\d+$/, "") : null;
}

function mergeRuntimeConfig(config: unknown) {
  const parsed = AppConfigSchema.parse(config);
  const runtimeBaseUrl = getRuntimeBaseUrl();
  const runtimeDomain = getRuntimeDomain();
  return {
    ...parsed,
    logo_url: parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
    logo_small_url: parsed.logo_small_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
    favicon_url: parsed.favicon_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
    domain: parsed.domain || runtimeDomain || "stream.mago-bot.com",
    base_url: parsed.base_url || runtimeBaseUrl || "https://stream.mago-bot.com",
  };
}

/**
 * Gets the central application configuration from the database.
 * If not exists, creates one with defaults.
 */
export const getAppConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    // We use a query that bypasses the generated types since they might not be in sync yet
    const { data, error } = await (supabaseAdmin
      .from('app_config' as any)
      .select('*')
      .limit(1)
      .maybeSingle() as any);

    if (error) {
      throw new Error("Erro ao carregar as configurações: " + error.message);
    }

    if (!data) {
      const defaultConfig = AppConfigSchema.parse({});
      const { data: newData, error: insertError } = await (supabaseAdmin
        .from('app_config' as any)
        .insert([{ config: defaultConfig }])
        .select()
        .single() as any);
      
      if (insertError) throw new Error("Erro ao criar as configurações padrão: " + insertError.message);
      return mergeRuntimeConfig(newData.config);
    }

    return mergeRuntimeConfig(data.config);
  });

/**
 * Updates the central application configuration.
 */
export const updateAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => AppConfigSchema.parse(data))
  .handler(async ({ data: newConfig, context }) => {
    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["owner", "admin"]);
    if (roleError) throw new Error("Não foi possível validar a permissão de configuração: " + roleError.message);
    if (!roleRows?.length) throw new Error("Acesso restrito à área administrativa.");

    const { data: existing, error: readError } = await (supabaseAdmin
      .from('app_config' as any)
      .select('id, config')
      .limit(1)
      .maybeSingle() as any);
    if (readError) throw new Error("Erro ao ler as configurações atuais: " + readError.message);

    const mergedConfig = AppConfigSchema.parse({
      ...(existing?.config ?? {}),
      ...newConfig,
      theme: { ...(existing?.config?.theme ?? {}), ...(newConfig.theme ?? {}) },
      copy: { ...(existing?.config?.copy ?? {}), ...(newConfig.copy ?? {}) },
    });
    
    if (existing) {
      const { error: updateError } = await (supabaseAdmin
        .from('app_config' as any)
        .update({ config: mergedConfig, updated_at: new Date().toISOString() })
        .eq('id', existing.id) as any);
      if (updateError) throw new Error("Erro ao atualizar as configurações: " + updateError.message);
    } else {
      const { error: insertError } = await (supabaseAdmin
        .from('app_config' as any)
        .insert([{ config: mergedConfig }]) as any);
      if (insertError) throw new Error("Erro ao inserir as configurações: " + insertError.message);
    }

    return { success: true, config: mergeRuntimeConfig(mergedConfig) };
  });
