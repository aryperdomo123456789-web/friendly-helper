
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AppConfigSchema } from "./types";
import { z } from "zod";

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
    ...(runtimeDomain ? { domain: runtimeDomain } : null),
    ...(runtimeBaseUrl ? { base_url: runtimeBaseUrl } : null),
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
  .validator((data: any) => AppConfigSchema.parse(data))
  .handler(async ({ data: newConfig }) => {
    const { data: existing } = await (supabaseAdmin.from('app_config' as any).select('id').limit(1).maybeSingle() as any);
    
    if (existing) {
      const { error: updateError } = await (supabaseAdmin
        .from('app_config' as any)
        .update({ config: newConfig })
        .eq('id', existing.id) as any);
      if (updateError) throw new Error("Erro ao atualizar as configurações: " + updateError.message);
    } else {
      const { error: insertError } = await (supabaseAdmin
        .from('app_config' as any)
        .insert([{ config: newConfig }]) as any);
      if (insertError) throw new Error("Erro ao inserir as configurações: " + insertError.message);
    }

    return { success: true };
  });
