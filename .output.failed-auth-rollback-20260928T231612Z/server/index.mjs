globalThis.__nitro_main__ = import.meta.url;
import { i as serve, r as NodeResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
import { i as toEventHandler, n as defineHandler, o as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-09-28T23:10:15.560Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"19c-mi4+sQFXbahz3USYBnng8xWwfD8\"",
		"mtime": "2026-09-28T23:10:15.560Z",
		"size": 412,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-28T23:10:15.560Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/LoginScreen-BLCymqG3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18b6-a+H7P2c8/oqEKLmzcp1HZBSZaIw\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 6326,
		"path": "../public/assets/LoginScreen-BLCymqG3.js"
	},
	"/assets/Catalog-DosITaxR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d460-dIL7ulVkfseCLIb43tUKX1HGyUk\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 54368,
		"path": "../public/assets/Catalog-DosITaxR.js"
	},
	"/assets/badge-Ck_m7UEf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ff-SC2mc3GrdKly4zStAQEDNmRu49M\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 767,
		"path": "../public/assets/badge-Ck_m7UEf.js"
	},
	"/assets/calendar-DhJCX2v4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-N3quYSxPNMAQn1y0U1jhTQlboZQ\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 246,
		"path": "../public/assets/calendar-DhJCX2v4.js"
	},
	"/assets/button-D9TWSQfG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"538f-gLlTM8PFOk0b1zLg6EL4YlNT3AM\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 21391,
		"path": "../public/assets/button-D9TWSQfG.js"
	},
	"/assets/canais-9d3QnEY-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1df-TUsHjOVAKluuwtKX8loDEuHWOJk\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 479,
		"path": "../public/assets/canais-9d3QnEY-.js"
	},
	"/assets/card-353-ZvaK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"403-q7j0e5jpRunpY7GwqJ2I6sjNCaA\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 1027,
		"path": "../public/assets/card-353-ZvaK.js"
	},
	"/assets/chat-policy-476tSjJe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-mnz3R7UBMnV4hjuxEQTluBZggBI\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 493,
		"path": "../public/assets/chat-policy-476tSjJe.js"
	},
	"/assets/chat.functions-CXhdR9ln.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"825-wBQakTeeu18MbRMw7fjY/tDKLOo\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 2085,
		"path": "../public/assets/chat.functions-CXhdR9ln.js"
	},
	"/assets/check-SmgL5JBz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"71-jYowRi89legImY6lGXiLBFumbiE\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 113,
		"path": "../public/assets/check-SmgL5JBz.js"
	},
	"/assets/chevron-left-CDuAZvXf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-US+oBjy7SF0N/4CPVx4yR09Lk38\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 119,
		"path": "../public/assets/chevron-left-CDuAZvXf.js"
	},
	"/assets/chevron-right-DRTEJbAQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-GFwVMe/nHJcAGQIU9Xzxds+ja9c\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 119,
		"path": "../public/assets/chevron-right-DRTEJbAQ.js"
	},
	"/assets/clipboard-CgeSPNYH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20b-Gw1MyVjKEn5Wsz3IwBSI7bp5kwg\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 523,
		"path": "../public/assets/clipboard-CgeSPNYH.js"
	},
	"/assets/content-empty-state-y-exij4k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"435-/vvhm0Lepok78+4ukZPRqGW+C9w\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 1077,
		"path": "../public/assets/content-empty-state-y-exij4k.js"
	},
	"/assets/copy-C_R5oH0L.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-YpoHE/JP2CE0QLgus1a1/4+O/0M\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 225,
		"path": "../public/assets/copy-C_R5oH0L.js"
	},
	"/assets/dialog-D6XuuqTU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"270b-ymTMfqO8CQBxrK+xRNLTcvLLU4o\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 9995,
		"path": "../public/assets/dialog-D6XuuqTU.js"
	},
	"/assets/conta-VT_H9Go5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3f5c-NzptJRvZ2pXfWyU1DRjmB3sf4k4\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 16220,
		"path": "../public/assets/conta-VT_H9Go5.js"
	},
	"/assets/dist-DH4thNkb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1033-w+pcQfFSRUZbfuW4FOU0ujK+waI\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 4147,
		"path": "../public/assets/dist-DH4thNkb.js"
	},
	"/assets/dono-uSJtL0zB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bc-0RuQCBMAlXIWxMiTcCLf8gWjq6U\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 188,
		"path": "../public/assets/dono-uSJtL0zB.js"
	},
	"/assets/filmes-BfZ7HZOk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"248-q+ECavAzYz37HnqtUOvWl1CLC9o\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 584,
		"path": "../public/assets/filmes-BfZ7HZOk.js"
	},
	"/assets/hls-yYrq3lUc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c8d6-kPyBTn1BhjgAQAN4DxgRKt+2JjE\"",
		"mtime": "2026-09-28T23:10:12.746Z",
		"size": 575702,
		"path": "../public/assets/hls-yYrq3lUc.js"
	},
	"/brand/webplayer-brand.png": {
		"type": "image/png",
		"etag": "\"114626-tstqgulyu8vrthaG7AHO7LPr0ZA\"",
		"mtime": "2026-09-28T23:10:15.568Z",
		"size": 1132070,
		"path": "../public/brand/webplayer-brand.png"
	},
	"/assets/info-DUV0E6SK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c1-PR5d0O4dhr8rZe9DeCK0zFiFAhw\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 193,
		"path": "../public/assets/info-DUV0E6SK.js"
	},
	"/assets/input-DXzdzMEG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"246-X5QHUBVAj+KBr9uF9PKVI/CP4DM\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 582,
		"path": "../public/assets/input-DXzdzMEG.js"
	},
	"/assets/inicio-TKCM95is.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4309-f23lFCPLflKWncrbROqgcLSfb9U\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 17161,
		"path": "../public/assets/inicio-TKCM95is.js"
	},
	"/assets/label-BVw0rFTQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-m0AWQqIqkh/pPtV4e+T+FMVSTIw\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 681,
		"path": "../public/assets/label-BVw0rFTQ.js"
	},
	"/assets/lazyRouteComponent-D-4krRRL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e3c-q3rKchNJ7RDgdjaXEudSBZWWqpU\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 3644,
		"path": "../public/assets/lazyRouteComponent-D-4krRRL.js"
	},
	"/assets/link-B_-PHstE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b8a-Ifwbuu+D/H0vXmxw7YlJZfRtVFE\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 11146,
		"path": "../public/assets/link-B_-PHstE.js"
	},
	"/assets/loader-circle-lSqX01YY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-/gywejUDgf2JLeZgnLuaTqm/n7Y\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 133,
		"path": "../public/assets/loader-circle-lSqX01YY.js"
	},
	"/assets/log-out-DBq1unDy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"db-HeItWYXI2O5qa1/hZ8SRZCg7t+Y\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 219,
		"path": "../public/assets/log-out-DBq1unDy.js"
	},
	"/assets/media-url-v-mhH1UL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-s0aCGn2iBxjD3GdpCl7m1ndnQL8\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 256,
		"path": "../public/assets/media-url-v-mhH1UL.js"
	},
	"/assets/monitor-play-CAEKpJTY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2bc-5K+vKRqJEOjbUhyvBBwl6R6r3hU\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 700,
		"path": "../public/assets/monitor-play-CAEKpJTY.js"
	},
	"/assets/notifications.functions-W7Un13fN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"29c-rlhGYugHB8n+fno36X0sTNyh0wY\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 668,
		"path": "../public/assets/notifications.functions-W7Un13fN.js"
	},
	"/assets/owner-page-shell-XMBX0Esg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b56-aulQ0B77wSYJdis+3ebFMjg+Yzw\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 6998,
		"path": "../public/assets/owner-page-shell-XMBX0Esg.js"
	},
	"/assets/pagination-Dl2xAmj7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f0f-xa3b+zb8Gl4GPeqrhik59o/Kqc4\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 3855,
		"path": "../public/assets/pagination-Dl2xAmj7.js"
	},
	"/assets/payments.functions-rFVgk02E.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"240-BtLt9shkpkclNb8oibckBNPBLK4\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 576,
		"path": "../public/assets/payments.functions-rFVgk02E.js"
	},
	"/assets/painel-B-W2hBGn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15889-QCXAvhQnE41ksfQyEVzmHGCb4L4\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 88201,
		"path": "../public/assets/painel-B-W2hBGn.js"
	},
	"/assets/plans.functions-CRiT8vew.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22d-2zAytxRcNspbJ1YAApi84CcfSR0\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 557,
		"path": "../public/assets/plans.functions-CRiT8vew.js"
	},
	"/assets/player-store-DfHrYnXX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1093-2As5M7TmMK51/a6FMjthORebBU0\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 4243,
		"path": "../public/assets/player-store-DfHrYnXX.js"
	},
	"/assets/player.functions-CSCy6dwN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"580-0jrU/2GKnrsnGTk7UtW/geNK1K4\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 1408,
		"path": "../public/assets/player.functions-CSCy6dwN.js"
	},
	"/assets/pt-BR-BUu0uC5U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"61d7-Oh/t+XLOohP+G/pmSgBohRgAiPc\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 25047,
		"path": "../public/assets/pt-BR-BUu0uC5U.js"
	},
	"/assets/route-CP4SDXxH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94b7-GtcItggIy8/wN0+osa+fxVwZWXc\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 38071,
		"path": "../public/assets/route-CP4SDXxH.js"
	},
	"/assets/routes-BpNUw9g1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-PhN77g8SR/H+2a2mpwIxndzCBs0\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 383,
		"path": "../public/assets/routes-BpNUw9g1.js"
	},
	"/assets/search-DxzqMld-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-Z6zikZ4+rQh5XksAWxXxsVoQWSE\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 163,
		"path": "../public/assets/search-DxzqMld-.js"
	},
	"/assets/index-kwaLdTUq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8ce10-ET/0b15X9CsrU+XqYWQbvCqCRFk\"",
		"mtime": "2026-09-28T23:10:12.740Z",
		"size": 577040,
		"path": "../public/assets/index-kwaLdTUq.js"
	},
	"/assets/section-error-boundary-CQIEqpyE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b9-bOQR8SCOxc/hzRwum/SpWqUKHo8\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 2233,
		"path": "../public/assets/section-error-boundary-CQIEqpyE.js"
	},
	"/assets/select-D-3EpxQO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13308-0gNalhwpqkoZ8FrJ2ukHCsPfi1M\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 78600,
		"path": "../public/assets/select-D-3EpxQO.js"
	},
	"/assets/series-L8PMKSHm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f-1Dt3d6mk8P5tr627glz2JzY8frw\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 591,
		"path": "../public/assets/series-L8PMKSHm.js"
	},
	"/assets/server-CtkhmKay.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"147-SRbZ8BC8AFq/oLPWgv50joBvSR0\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 327,
		"path": "../public/assets/server-CtkhmKay.js"
	},
	"/assets/servidores-Bee2EMEk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fe-0mvzlOZTq672w1fOrnJ5Gq8y2os\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 1534,
		"path": "../public/assets/servidores-Bee2EMEk.js"
	},
	"/assets/shield-check-CTr6XHGo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-exrEO7L6+xpSOSQb7Y4mXJneILg\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 493,
		"path": "../public/assets/shield-check-CTr6XHGo.js"
	},
	"/assets/star-CfKwcIP2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cd-uqzpDlhoEALP2cnnurRsaiiB1Ec\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 461,
		"path": "../public/assets/star-CfKwcIP2.js"
	},
	"/assets/styles-B5mOYhAH.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"23880-vbeXSZMUF0QuFMbdZL6nU4z82cA\"",
		"mtime": "2026-09-28T23:10:12.748Z",
		"size": 145536,
		"path": "../public/assets/styles-B5mOYhAH.css"
	},
	"/assets/suporte-rytAPzJU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7019-pfC+CvgK6P2ZLbBm/W5LU3JysbA\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 28697,
		"path": "../public/assets/suporte-rytAPzJU.js"
	},
	"/assets/test-links.functions-CJWWlCwN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3d3-8ha/7QnbeSPv8ec/OzJo61NxN44\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 979,
		"path": "../public/assets/test-links.functions-CJWWlCwN.js"
	},
	"/assets/teste._slug-CAdFAC-G.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2dc3-T36vPwsY5GNhvO93NR7tQe+rhUM\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 11715,
		"path": "../public/assets/teste._slug-CAdFAC-G.js"
	},
	"/assets/tv-BRpO4R-v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ae-fAaX7WlcdYrfMJ9MIROQSn3BUx0\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 174,
		"path": "../public/assets/tv-BRpO4R-v.js"
	},
	"/assets/useMatch-j-mO45D5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22c-w9JGfWxWwzFaSHWiBVQs/as0SLU\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 556,
		"path": "../public/assets/useMatch-j-mO45D5.js"
	},
	"/assets/useNavigate-CRaFCJ7e.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b9-ePNEjNy2CnIEZr+7QLCXr2QYNzk\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 185,
		"path": "../public/assets/useNavigate-CRaFCJ7e.js"
	},
	"/assets/user-NWrqbpoy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b9-7h7Rxhz0yVA7y3ZsoJb53du2wgI\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 185,
		"path": "../public/assets/user-NWrqbpoy.js"
	},
	"/assets/user-cog-CgsTIEE-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27a-SM4alpG1O538UlsT+ZZbNq2F1eg\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 634,
		"path": "../public/assets/user-cog-CgsTIEE-.js"
	},
	"/assets/user-page-shell-krZGmmhM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"59f-9JU7E37zer4ItTXiDSCyv00YAfQ\"",
		"mtime": "2026-09-28T23:10:12.747Z",
		"size": 1439,
		"path": "../public/assets/user-page-shell-krZGmmhM.js"
	},
	"/assets/users-CmkZEyDQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"127-75e7Hqrx/YF5h3O6u0ul3jse2rI\"",
		"mtime": "2026-09-28T23:10:12.748Z",
		"size": 295,
		"path": "../public/assets/users-CmkZEyDQ.js"
	},
	"/assets/usuarios-B88kLmOj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1534b-69Ah0jXnpgkTuvBqH1UqaT/gzLE\"",
		"mtime": "2026-09-28T23:10:12.748Z",
		"size": 86859,
		"path": "../public/assets/usuarios-B88kLmOj.js"
	},
	"/assets/zap-eYph6V0f.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fb-YCJbFIzZbrslmFr+h75TnvDXZ5k\"",
		"mtime": "2026-09-28T23:10:12.748Z",
		"size": 251,
		"path": "../public/assets/zap-eYph6V0f.js"
	},
	"/assets/utils-CYKyIO3g.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140de-8Gdbg+BrG+EJplZVsvlXHnpj/Nk\"",
		"mtime": "2026-09-28T23:10:12.748Z",
		"size": 82142,
		"path": "../public/assets/utils-CYKyIO3g.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_EYhn_X = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_EYhn_X
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
