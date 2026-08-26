function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function proxyMediaUrl(url?: string | null, serverId?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!isAbsoluteHttpUrl(trimmed)) return trimmed;
  const params = new URLSearchParams({ src: trimmed });
  if (serverId?.trim()) params.set("server_id", serverId.trim());
  return `/api/public/image?${params.toString()}`;
}
