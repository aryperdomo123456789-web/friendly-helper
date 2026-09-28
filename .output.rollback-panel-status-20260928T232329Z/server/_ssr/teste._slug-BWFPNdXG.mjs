import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createTestUser } from "./test-links.functions-Cjw-lfKd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/teste._slug-BWFPNdXG.js
var $$splitComponentImporter = () => import("./teste._slug-Bwd1Bqac.mjs");
var Route = createFileRoute("/teste/$slug")({
	head: () => ({ meta: [{ title: "Teste Grátis | MAGO PLAYER PRO" }, {
		name: "description",
		content: "Solicite seu teste grátis e experimente o melhor do IPTV."
	}] }),
	server: { handlers: { POST: async ({ request }) => {
		const formData = await request.formData();
		const slugFromForm = formData.get("slug")?.toString().trim();
		const fingerprintFromForm = formData.get("fingerprint")?.toString().trim() ?? "";
		const referralCodeRaw = formData.get("referral_code")?.toString().trim() ?? "";
		const referralCode = referralCodeRaw.length > 0 ? referralCodeRaw : null;
		const result = await createTestUser({ data: {
			slug: slugFromForm || new URL(request.url).pathname.split("/").filter(Boolean).at(-1) || "teste",
			fingerprint: fingerprintFromForm || deriveServerFingerprint(request),
			referral_code: referralCode
		} });
		const redirectUrl = new URL(request.url);
		redirectUrl.searchParams.set("username", result.username);
		redirectUrl.searchParams.set("password", result.password);
		redirectUrl.searchParams.set("expiresAt", result.expiresAt);
		redirectUrl.searchParams.set("generated", "1");
		return new Response(null, {
			status: 303,
			headers: {
				location: redirectUrl.toString(),
				"cache-control": "no-store, no-cache, must-revalidate, private"
			}
		});
	} } },
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function deriveServerFingerprint(request) {
	const headers = request.headers;
	const raw = [
		headers.get("user-agent") ?? "",
		headers.get("accept-language") ?? "",
		headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "",
		headers.get("sec-ch-ua") ?? "",
		headers.get("sec-ch-ua-mobile") ?? "",
		headers.get("sec-ch-ua-platform") ?? "",
		headers.get("sec-ch-ua-model") ?? ""
	].join("|");
	let hash = 0;
	for (let index = 0; index < raw.length; index += 1) hash = (hash << 5) - hash + raw.charCodeAt(index) | 0;
	return Math.abs(hash).toString(16).padStart(8, "0");
}
//#endregion
export { Route as t };
