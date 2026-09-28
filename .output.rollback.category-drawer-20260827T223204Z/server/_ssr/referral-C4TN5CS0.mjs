//#region node_modules/.nitro/vite/services/ssr/assets/referral-C4TN5CS0.js
function resolveTestLinkSlug(options) {
	if (options.testLinkSlug && options.testLinkSlug.trim()) return options.testLinkSlug.trim();
	return (options.displayName ?? "").match(/\(([^)]+)\)/)?.[1]?.trim() || null;
}
function resolveReferralSourceSlug(options) {
	if (options.referralSourceSlug && options.referralSourceSlug.trim()) return options.referralSourceSlug.trim();
	return resolveTestLinkSlug({
		testLinkSlug: options.testLinkSlug ?? null,
		displayName: options.displayName ?? null
	});
}
//#endregion
export { resolveReferralSourceSlug as t };
