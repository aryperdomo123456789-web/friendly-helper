import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COOKIE_NAME = "stream_session";
const COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function readCookie(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === COOKIE_NAME) {
      const value = valueParts.join("=").trim();
      return value.length <= 256 ? value : null;
    }
  }
  return null;
}

export async function claimStreamReplay(options: {
  replayKey?: string;
  sessionKey?: string;
  subject?: string;
  isRoot?: boolean;
  expiresAt?: number;
  request: Request;
}): Promise<{ allowed: boolean; setCookie: boolean }> {
  if (!options.replayKey || !options.sessionKey || !options.expiresAt) {
    return { allowed: true, setCookie: false };
  }
  if (
    !/^[A-Za-z0-9_-]{20,128}$/.test(options.replayKey) ||
    !/^[A-Za-z0-9_-]{20,128}$/.test(options.sessionKey)
  ) {
    return { allowed: false, setCookie: false };
  }

  const cookie = readCookie(options.request);
  type RpcResult = { data: unknown; error: { message: string } | null };
  const rpc = supabaseAdmin.rpc as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<RpcResult>;
  const { data, error } = await rpc("claim_stream_token_session", {
    p_session_key: options.sessionKey,
    p_replay_key: options.replayKey,
    p_subject: options.subject ?? null,
    p_cookie: cookie,
    p_is_root: options.isRoot === true,
    p_expires_at: Math.floor(options.expiresAt),
  });
  if (error) {
    console.error("Falha ao validar sessão de stream");
    return { allowed: false, setCookie: false };
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    { allowed?: boolean; set_cookie?: boolean } | null | undefined;
  return {
    allowed: result?.allowed === true,
    setCookie: result?.set_cookie === true,
  };
}

export function attachStreamSessionCookie(
  response: Response,
  sessionKey: string | undefined,
  shouldSet: boolean,
): Response {
  if (!sessionKey || !shouldSet) return response;
  const next = new Response(response.body, response);
  next.headers.append(
    "set-cookie",
    `${COOKIE_NAME}=${sessionKey}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/api/public/stream; HttpOnly; Secure; SameSite=Lax`,
  );
  return next;
}

export function parseStreamSessionCookie(header: string | null): string | null {
  if (!header) return null;
  const request = new Request("https://stream.local/api/public/stream", {
    headers: { cookie: header },
  });
  return readCookie(request);
}
