import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AppConfigSchema, type AppConfig } from "./types";

export const DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";
export const REMOTE_BRAND_IMAGE_URL = "https://i.imgur.com/RrqwMFH.png";
export const APP_CONFIG_QUERY_KEY = ["app-config"] as const;

type PublicAppConfig = Omit<AppConfig, "mp_access_token" | "mp_webhook_secret">;

function toPublicAppConfig(config: AppConfig): PublicAppConfig {
  const {
    mp_access_token: _accessToken,
    mp_webhook_secret: _webhookSecret,
    ...publicConfig
  } = config;
  return publicConfig;
}

/**
 * Gets the public application configuration without payment access tokens or webhook secrets.
 */
export const getAppConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { loadAppConfig } = await import("./config.server");
  return toPublicAppConfig(await loadAppConfig());
});

export const getAdminAppConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertConfigAdmin, loadAppConfig } = await import("./config.server");
    await assertConfigAdmin(context.supabase, context.userId);
    return loadAppConfig();
  });

/**
 * Updates the central application configuration.
 */
export const updateAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => AppConfigSchema.parse(data))
  .handler(async ({ data: newConfig, context }) => {
    const { assertConfigAdmin } = await import("./config.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertConfigAdmin(context.supabase, context.userId);

    const { data: existing } = await supabaseAdmin
      .from("app_config")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("app_config")
        .update({ config: newConfig })
        .eq("id", existing.id);
      if (updateError)
        throw new Error("Erro ao atualizar as configurações: " + updateError.message);
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("app_config")
        .insert([{ config: newConfig }]);
      if (insertError) throw new Error("Erro ao inserir as configurações: " + insertError.message);
    }

    return { success: true };
  });
