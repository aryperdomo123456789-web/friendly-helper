function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function proxyMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!isAbsoluteHttpUrl(trimmed)) return trimmed;
  return `/api/public/image?src=${encodeURIComponent(trimmed)}`;
}
