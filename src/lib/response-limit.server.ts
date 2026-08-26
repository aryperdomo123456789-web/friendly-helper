export const MAX_PLAYLIST_TEXT_BYTES = 32 * 1024 * 1024;
export const MAX_XTREAM_RESPONSE_BYTES = 32 * 1024 * 1024;
const DEFAULT_MAX_RESPONSE_BYTES = MAX_PLAYLIST_TEXT_BYTES;

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MiB`;
}

function tooLargeError(label: string, maxBytes: number) {
  return new Error(`${label} excede o limite de ${formatMegabytes(maxBytes)}.`);
}

export async function readResponseTextWithLimit(
  response: Response,
  maxBytes = DEFAULT_MAX_RESPONSE_BYTES,
  label = "Resposta",
) {
  const contentLengthHeader = response.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw tooLargeError(label, maxBytes);
  }

  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw tooLargeError(label, maxBytes);
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw tooLargeError(label, maxBytes);
      }

      chunks.push(decoder.decode(value, { stream: true }));
    }

    chunks.push(decoder.decode());
    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}

export { DEFAULT_MAX_RESPONSE_BYTES };
