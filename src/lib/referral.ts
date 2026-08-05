export function resolveTestLinkSlug(options: {
  testLinkSlug?: string | null;
  displayName?: string | null;
}): string | null {
  if (options.testLinkSlug && options.testLinkSlug.trim()) {
    return options.testLinkSlug.trim();
  }

  const displayName = options.displayName ?? "";
  const match = displayName.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() || null;
}
