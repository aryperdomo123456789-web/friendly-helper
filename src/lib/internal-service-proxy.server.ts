export async function proxyToInternalService(
  request: Request,
  serviceBaseUrl: string,
): Promise<Response> {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(`${sourceUrl.pathname}${sourceUrl.search}`, serviceBaseUrl);
  const headers = new Headers();
  for (const header of [
    // Public media routes
    "accept",
    "accept-language",
    "accept-encoding",
    "range",
    "user-agent",
    "referer",
    "origin",
    "cache-control",
    "pragma",
    // Internal webhooks / signed callbacks
    "content-type",
    "authorization",
    "x-request-id",
    "x-signature",
    "x-webhook-signature",
    "x-hub-signature-256",
    // Helpful proxy context, when present
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-forwarded-host",
    "x-real-ip",
    "cf-connecting-ip",
    "cf-ipcountry",
  ]) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  for (const hopByHopHeader of [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ]) {
    headers.delete(hopByHopHeader);
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
    signal: request.signal,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return fetch(targetUrl, init);
}
