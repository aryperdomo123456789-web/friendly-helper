
import { createServerFn } from "@tanstack/react-start";
import { AppConfigSchema } from "./types";
import { z } from "zod";

/**
 * Gets the central application configuration from the database.
 * If not exists, creates one with defaults.
 */
export const getAppConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // We use a query that bypasses the generated types since they might not be in sync yet
    const { data, error } = await (supabaseAdmin
      .from('app_config' as any)
      .select('*')
      .limit(1)
      .maybeSingle() as any);

    if (error) {
      throw new Error("Erro ao carregar configuracoes: " + error.message);
    }

    if (!data) {
      const defaultConfig = AppConfigSchema.parse({});
      const { data: newData, error: insertError } = await (supabaseAdmin
        .from('app_config' as any)
        .insert([{ config: defaultConfig }])
        .select()
        .single() as any);
      
      if (insertError) throw new Error("Erro ao criar configuracoes padrao: " + insertError.message);
      return newData.config;
    }

    return AppConfigSchema.parse(data.config);
  });

/**
 * Updates the central application configuration.
 */
export const updateAppConfig = createServerFn({ method: "POST" })
  .validator((data: any) => AppConfigSchema.parse(data))
  .handler(async ({ data: newConfig }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await (supabaseAdmin.from('app_config' as any).select('id').limit(1).maybeSingle() as any);
    
    if (existing) {
      const { error: updateError } = await (supabaseAdmin
        .from('app_config' as any)
        .update({ config: newConfig })
        .eq('id', existing.id) as any);
      if (updateError) throw new Error("Erro ao atualizar configuracoes: " + updateError.message);
    } else {
      const { error: insertError } = await (supabaseAdmin
        .from('app_config' as any)
        .insert([{ config: newConfig }]) as any);
      if (insertError) throw new Error("Erro ao inserir configuracoes: " + insertError.message);
    }

    return { success: true };
  });
