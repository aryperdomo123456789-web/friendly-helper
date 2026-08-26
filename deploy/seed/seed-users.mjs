#!/usr/bin/env node
/**
 * MAGOPLAYERPRO — seed de usuarios no backend proprio.
 *
 * O que faz:
 *  1. cria os usuarios em auth.users (email sintetico <username>@iptv.local)
 *  2. cria os profiles com plano, validade e limite de conexoes
 *  3. atribui o papel (owner / admin / user) em user_roles
 *  4. vincula os servidores em user_server_access
 *  5. amarra os codigos de indicacao (referred_by)
 *  6. define o dono como created_by dos servidores e dos links de teste
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxxxx \
 *   node deploy/seed/seed-users.mjs
 *
 * Rode DEPOIS de 01-schema.sql e 02-dados-base.sql. Pode rodar de novo: ja existentes sao atualizados.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar.");
  process.exit(1);
}

const DOMAIN = "iptv.local";
const here = dirname(fileURLToPath(import.meta.url));
const { users } = JSON.parse(readFileSync(join(here, "users.json"), "utf8"));

const db = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUser(email) {
  try {
    const escapedEmail = email.replace(/'/g, "''");
    const id = execFileSync(
      "docker",
      [
        "exec",
        "supabase-db",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-At",
        "-c",
        `select id::text from auth.users where email = '${escapedEmail}' limit 1;`,
      ],
      { encoding: "utf8" },
    ).trim();
    if (id) {
      return { id, email };
    }
  } catch {
    // Fallback para ambientes sem docker/psql direto.
  }

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const { data: plans } = await db.from("subscription_plans").select("id, name");
  const { data: servers } = await db.from("iptv_servers").select("id, name");
  const planId = (name) => plans?.find((p) => p.name === name)?.id ?? null;
  const serverId = (name) => servers?.find((s) => s.name === name)?.id ?? null;

  const idByUsername = new Map();

  // 1) auth + profile + role + acessos
  for (const u of users) {
    const email = `${u.username.toLowerCase()}@${DOMAIN}`;
    let authUser = await findAuthUser(email);

    if (!authUser) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        password: u.password,
        email_confirm: true,
        user_metadata: { username: u.username, role: u.role },
      });
      if (error) {
        const alreadyExists = /already been registered|already exists|duplicate/i.test(error.message ?? "");
        if (!alreadyExists) {
          throw new Error(`${u.username}: ${error.message}`);
        }
        authUser = await findAuthUser(email);
        if (!authUser) {
          throw new Error(`${u.username}: usuario existente, mas nao foi possivel reencontrar em auth.users`);
        }
        await db.auth.admin.updateUserById(authUser.id, { password: u.password });
        console.log(`= auth existente (reencontrado apos duplicidade): ${u.username}`);
      } else {
        authUser = data.user;
        console.log(`+ auth criado: ${u.username}`);
      }
    } else {
      await db.auth.admin.updateUserById(authUser.id, { password: u.password });
      console.log(`= auth existente (senha redefinida): ${u.username}`);
    }
    idByUsername.set(u.username, authUser.id);

    const profile = {
      id: authUser.id,
      username: u.username,
      display_name: u.display_name ?? u.username,
      max_connections: u.max_connections ?? 1,
      expires_at: u.expires_at ?? null,
      is_active: u.is_active !== false,
      plan_id: u.plan ? planId(u.plan) : null,
      referral_code: u.referral_code ?? null,
    };
    const { error: pErr } = await db.from("profiles").upsert(profile, { onConflict: "id" });
    if (pErr) throw pErr;

    await db.from("user_roles").upsert(
      { user_id: authUser.id, role: u.role ?? "user" },
      { onConflict: "user_id,role" },
    );

    const wanted = (u.servers ?? []).map(serverId).filter(Boolean);
    if (wanted.length) {
      await db.from("user_server_access").upsert(
        wanted.map((sid) => ({ user_id: authUser.id, server_id: sid })),
        { onConflict: "user_id,server_id" },
      );
    }
    console.log(`  profile/role/acessos ok (${wanted.length} servidores)`);
  }

  // 2) indicacoes (precisa de todos os ids resolvidos)
  for (const u of users) {
    const referredBy = u.referred_by_username ?? u.referred_by;
    if (!referredBy) continue;
    const refId = idByUsername.get(referredBy);
    if (!refId) {
      console.warn(`! indicador nao encontrado para ${u.username}: ${referredBy}`);
      continue;
    }
    await db.from("profiles").update({ referred_by_id: refId }).eq("id", idByUsername.get(u.username));
    console.log(`> ${u.username} indicado por ${referredBy}`);
  }

  // 3) dono como autor dos servidores e links de teste
  const ownerUsername = users.find((u) => u.role === "owner")?.username;
  const ownerId = ownerUsername ? idByUsername.get(ownerUsername) : null;
  if (ownerId) {
    await db.from("iptv_servers").update({ created_by: ownerId }).is("created_by", null);
    await db.from("test_links").update({ created_by_id: ownerId }).is("created_by_id", null);
    await db.from("profiles").update({ created_by: ownerId }).is("created_by", null).neq("id", ownerId);
    console.log("dono vinculado aos servidores e links de teste");
  }

  console.log("\nSeed concluido.");
}

main().catch((err) => {
  console.error("\nFalhou:", err.message ?? err);
  process.exit(1);
});
