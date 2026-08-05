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

export function resolveReferralSourceSlug(options: {
  referralSourceSlug?: string | null;
  testLinkSlug?: string | null;
  displayName?: string | null;
}): string | null {
  if (options.referralSourceSlug && options.referralSourceSlug.trim()) {
    return options.referralSourceSlug.trim();
  }

  return resolveTestLinkSlug({
    testLinkSlug: options.testLinkSlug ?? null,
    displayName: options.displayName ?? null,
  });
}
