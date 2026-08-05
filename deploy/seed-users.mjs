#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();
const seedFile = process.env.SEED_USERS_FILE
  ? path.resolve(process.env.SEED_USERS_FILE)
  : path.join(rootDir, "deploy/seed/users.json");
const envFile = path.join(rootDir, ".env");

function parseEnvFile(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function loadEnvFallback() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const raw = await fs.readFile(envFile, "utf8");
    const parsed = parseEnvFile(raw);
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env opcional.
  }
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

function toEmail(username, domain) {
  return `${username.trim().toLowerCase()}@${domain}`;
}

async function main() {
  await loadEnvFallback();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar o seed.");
  }

  const raw = await fs.readFile(seedFile, "utf8");
  const payload = JSON.parse(raw);
  const domain = payload.domain ?? "iptv.local";
  const users = payload.users ?? [];
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error("users.json não tem usuários para seed.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [existingUsers, plansRes, serversRes] = await Promise.all([
    listAllUsers(admin),
    admin.from("subscription_plans").select("id, name"),
    admin.from("iptv_servers").select("id, name"),
  ]);

  if (plansRes.error) throw plansRes.error;
  if (serversRes.error) throw serversRes.error;

  const authByEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase() ?? "", user]));
  const authByUsername = new Map();
  const planByName = new Map((plansRes.data ?? []).map((plan) => [plan.name, plan.id]));
  const serverByName = new Map((serversRes.data ?? []).map((server) => [server.name, server.id]));

  for (const user of users) {
    const email = toEmail(user.username, domain);
    const existing = authByEmail.get(email.toLowerCase());
    let userId = existing?.id ?? null;

    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password: user.password,
        user_metadata: { username: user.username },
      });
      if (error) throw error;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true,
        user_metadata: { username: user.username },
      });
      if (error) throw error;
      userId = data.user?.id ?? null;
    }

    if (!userId) throw new Error(`Não foi possível resolver o id do usuário ${user.username}.`);
    authByUsername.set(user.username, { id: userId });

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        username: user.username,
        display_name: user.display_name ?? user.username,
        max_connections: user.max_connections ?? 1,
        expires_at: user.expires_at ?? null,
        is_active: user.is_active ?? true,
        plan_id: user.plan_name ? planByName.get(user.plan_name) ?? null : null,
        created_by: null,
        referral_code: user.referral_code ?? null,
        referred_by_id: null,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    const { error: clearRoleError } = await admin.from("user_roles").delete().eq("user_id", userId);
    if (clearRoleError) throw clearRoleError;

    if (user.role) {
      const { error: roleError } = await admin.from("user_roles").insert({
        user_id: userId,
        role: user.role,
      });
      if (roleError) throw roleError;
    }

    const { error: clearAccessError } = await admin.from("user_server_access").delete().eq("user_id", userId);
    if (clearAccessError) throw clearAccessError;

    const serverIds = (user.server_names ?? [])
      .map((serverName) => serverByName.get(serverName))
      .filter(Boolean);

    if (serverIds.length) {
      const { error: accessError } = await admin.from("user_server_access").insert(
        serverIds.map((serverId) => ({
          user_id: userId,
          server_id: serverId,
        })),
      );
      if (accessError) throw accessError;
    }
  }

  for (const user of users) {
    const userId = authByUsername.get(user.username)?.id ?? null;
    if (!userId) continue;

    const updates = {};
    if (user.created_by_username) {
      const createdById = authByUsername.get(user.created_by_username)?.id ?? null;
      if (createdById) updates.created_by = createdById;
    }
    if (user.referred_by_username) {
      const referrerId = authByUsername.get(user.referred_by_username)?.id ?? null;
      if (referrerId) updates.referred_by_id = referrerId;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await admin.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
    }
  }

  console.log(`Seed concluído: ${users.length} usuário(s) processado(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
