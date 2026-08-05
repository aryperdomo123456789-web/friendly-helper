
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AppConfigSchema } from "./types";
import { z } from "zod";

/**
 * Gets the central application configuration from the database.
 * If not exists, creates one with defaults.
 */
export const getAppConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error("Erro ao carregar configuracoes: " + error.message);
    }

    if (!data) {
      const defaultConfig = AppConfigSchema.parse({});
      const { data: newData, error: insertError } = await supabaseAdmin
        .from('app_config')
        .insert([{ config: defaultConfig }])
        .select()
        .single();
      
      if (insertError) throw new Error("Erro ao criar configuracoes padrao");
      return newData.config;
    }

    return AppConfigSchema.parse(data.config);
  });

/**
 * Updates the central application configuration.
 */
export const updateAppConfig = createServerFn({ method: "POST" })
  .input(AppConfigSchema)
  .handler(async ({ data: newConfig }) => {
    // Basic owner check would go here in middleware, but for simplicity:
    const { error } = await supabaseAdmin
      .from('app_config')
      .update({ config: newConfig })
      .filter('id', 'neq', '00000000-0000-0000-0000-000000000000'); // Dummy filter or just use upsert logic

    // Simplified for POC: update the first row
    const { data: existing } = await supabaseAdmin.from('app_config').select('id').limit(1).single();
    
    if (existing) {
      await supabaseAdmin.from('app_config').update({ config: newConfig }).eq('id', existing.id);
    }

    return { success: true };
  });
