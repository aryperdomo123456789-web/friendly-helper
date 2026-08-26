import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

export type FetchServiceHandler = (request: Request) => Promise<Response> | Response;

export type FetchServiceOptions = {
  serviceName: string;
  host?: string;
  port?: number;
};

export function isMainModule(importMetaUrl: string): boolean {
  const entryPath = process.argv[1];
  if (!entryPath) return false;
  return fileURLToPath(importMetaUrl) === entryPath;
}

export async function startFetchService(
  handler: FetchServiceHandler,
  options: FetchServiceOptions,
): Promise<void> {
  const host = process.env["HOST"] ?? options.host ?? "127.0.0.1";
  const port = Number(process.env["PORT"] ?? options.port ?? 3000);
  const serviceName = options.serviceName;

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`[${serviceName}] PORT invalido: ${process.env["PORT"] ?? "undefined"}`);
  }

  const server = createServer(async (req, res) => {
    const requestAbort = new AbortController();
    const abortRequest = () => requestAbort.abort();
    req.once("aborted", abortRequest);
    res.once("close", abortRequest);
    try {
      const request = await toFetchRequest(req, requestAbort.signal);
      const response = await handler(request);
      await sendFetchResponse(res, response);
    } catch (error) {
      console.error(`[${serviceName}] request failed`, error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain; charset=utf-8");
      }
      res.end("Internal Server Error");
    } finally {
      req.off("aborted", abortRequest);
      res.off("close", abortRequest);
    }
  });

  server.on("error", (error) => {
    console.error(`[${serviceName}] server error`, error);
    process.exit(1);
  });

  server.listen(port, host, () => {
    console.log(`[${serviceName}] listening on http://${host}:${port}`);
  });

  await once(server, "listening");
}

async function toFetchRequest(req: IncomingMessage, signal?: AbortSignal): Promise<Request> {
  const hostHeader = req.headers.host ?? "127.0.0.1";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto === "https"
      ? "https"
      : "http";
  const url = new URL(req.url ?? "/", `${protocol}://${hostHeader}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "undefined") continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
      continue;
    }
    headers.set(key, value);
  }

  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("proxy-authenticate");
  headers.delete("proxy-authorization");
  headers.delete("te");
  headers.delete("trailer");
  headers.delete("transfer-encoding");
  headers.delete("upgrade");

  const method = req.method ?? "GET";
  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    ...(signal ? { signal } : {}),
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req) as unknown as ReadableStream<Uint8Array>;
    init.duplex = "half";
  }

  return new Request(url, init);
}

async function sendFetchResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const readable = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
  readable.on("error", (error) => {
    console.error("[fetch-service] response stream error", error);
    res.destroy(error as Error);
  });
  readable.pipe(res);
}
