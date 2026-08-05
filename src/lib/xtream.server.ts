// Server-only Xtream Codes API client (same protocol the PHP WebPlayer uses).

export type XtreamCreds = {
  dns: string;
  username: string;
  password: string;
};

function normalizeDns(dns: string): string {
  let base = dns.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
  return base;
}

export function buildPlayerApiUrl(
  creds: XtreamCreds,
  params: Record<string, string | undefined>,
): string {
  const url = new URL(`${normalizeDns(creds.dns)}/player_api.php`);
  url.searchParams.set("username", creds.username);
  url.searchParams.set("password", creds.password);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function xtreamCall<T>(
  creds: XtreamCreds,
  params: Record<string, string | undefined>,
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(buildPlayerApiUrl(creds, params), {
      signal: controller.signal,
      headers: { "User-Agent": "Lovable-WebPlayer/1.0" },
    });
    if (!response.ok) {
      throw new Error(`Servidor respondeu ${response.status}`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Resposta invalida do servidor IPTV");
    }
  } finally {
    clearTimeout(timer);
  }
}

export function buildStreamUrl(
  creds: XtreamCreds,
  kind: "live" | "movie" | "series",
  streamId: string | number,
  ext = "m3u8",
): string {
  const base = normalizeDns(creds.dns);
  const safeExt = kind === "live" ? "m3u8" : ext || "mp4";
  return `${base}/${kind}/${encodeURIComponent(creds.username)}/${encodeURIComponent(
    creds.password,
  )}/${streamId}.${safeExt}`;
}

export async function testCredentials(creds: XtreamCreds): Promise<{
  ok: boolean;
  message: string;
  expDate?: string | null;
  maxConnections?: string | null;
}> {
  try {
    const data = await xtreamCall<{
      user_info?: {
        auth?: number;
        status?: string;
        exp_date?: string | null;
        max_connections?: string | null;
      };
    }>(creds, {}, 12000);
    const info = data.user_info;
    if (!info || info.auth !== 1) {
      return { ok: false, message: "Usuario ou senha recusados pelo servidor" };
    }
    return {
      ok: true,
      message: `Conectado (${info.status ?? "Active"})`,
      expDate: info.exp_date ?? null,
      maxConnections: info.max_connections ?? null,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha na conexao" };
  }
}
