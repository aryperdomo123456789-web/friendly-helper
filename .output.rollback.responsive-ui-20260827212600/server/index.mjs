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
		"mtime": "2026-08-27T20:18:25.606Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-08-27T20:18:25.606Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"19c-mi4+sQFXbahz3USYBnng8xWwfD8\"",
		"mtime": "2026-08-27T20:18:25.606Z",
		"size": 412,
		"path": "../public/manifest.webmanifest"
	},
	"/assets/Catalog-BzY9zT2j.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"88e2-7b244DywzjKsrZE+v5rSGaVlBWY\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 35042,
		"path": "../public/assets/Catalog-BzY9zT2j.js"
	},
	"/assets/LoginScreen-D6q019BP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"188f-KSd6vYau9t/S3gX8mrgwn74T/yI\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 6287,
		"path": "../public/assets/LoginScreen-D6q019BP.js"
	},
	"/assets/badge-48v5g-CT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fa-IyqvH+BTFFubEuWgy1tGkT48nyM\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 762,
		"path": "../public/assets/badge-48v5g-CT.js"
	},
	"/assets/button-Cu9KJ0op.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"538a-CdMZssB/d8pzku73KfcI7SSU/qE\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 21386,
		"path": "../public/assets/button-Cu9KJ0op.js"
	},
	"/assets/calendar-Cu-rvYcx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-xnsDWt2ftVncxkfw9LtnZNC3tU8\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 246,
		"path": "../public/assets/calendar-Cu-rvYcx.js"
	},
	"/assets/canais-CLx7g3Sd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1df-VJu7WHcZTvzCgB9MOohxAOqQ/DA\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 479,
		"path": "../public/assets/canais-CLx7g3Sd.js"
	},
	"/assets/card-BaPl9pRE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"403-FwybX5cgy/DgsKJuhUKd77PrD2Y\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 1027,
		"path": "../public/assets/card-BaPl9pRE.js"
	},
	"/assets/chat-policy-476tSjJe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-mnz3R7UBMnV4hjuxEQTluBZggBI\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 493,
		"path": "../public/assets/chat-policy-476tSjJe.js"
	},
	"/assets/chat.functions-DT0tEqCR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"825-yA0B83z4saRhM15wwo8Y04jpxWk\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 2085,
		"path": "../public/assets/chat.functions-DT0tEqCR.js"
	},
	"/assets/check-5yK968GD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"71-csZRqgk1PSB5SGkIcyPtqFNgIE8\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 113,
		"path": "../public/assets/check-5yK968GD.js"
	},
	"/assets/chevron-left-CC6hYH3T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-zx/iFgntuClti2TS//UGJaDAt0U\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 119,
		"path": "../public/assets/chevron-left-CC6hYH3T.js"
	},
	"/assets/chevron-right-Dw481ef9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-TBVNbIY9AHts5N4t1ETxotZwOUE\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 119,
		"path": "../public/assets/chevron-right-Dw481ef9.js"
	},
	"/assets/clipboard-CgeSPNYH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20b-Gw1MyVjKEn5Wsz3IwBSI7bp5kwg\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 523,
		"path": "../public/assets/clipboard-CgeSPNYH.js"
	},
	"/assets/conta-bntTx6N2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3f61-vcziihwJgjomN1kmMKjWoekiEEA\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 16225,
		"path": "../public/assets/conta-bntTx6N2.js"
	},
	"/assets/content-empty-state-8Nk0dibR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"435-l5Fi4uKYq+E2pOIbV1dbWNrjY5Y\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 1077,
		"path": "../public/assets/content-empty-state-8Nk0dibR.js"
	},
	"/assets/copy-Dh7DQwo8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-4DB5bUTGF0tqG91y89WHPIGx2Bc\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 225,
		"path": "../public/assets/copy-Dh7DQwo8.js"
	},
	"/assets/dialog-BQ29dfn6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"270b-DPUD1pg1qwb52vsuDywILCnB4JA\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 9995,
		"path": "../public/assets/dialog-BQ29dfn6.js"
	},
	"/assets/dist-BtwDye1-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103b-nBsEfNoDp0Q4mx451mnSkTlSFo8\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 4155,
		"path": "../public/assets/dist-BtwDye1-.js"
	},
	"/assets/dono-cuAv7L6x.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bc-yXyNNhGvCjCYe2XYwvXrsLexPyg\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 188,
		"path": "../public/assets/dono-cuAv7L6x.js"
	},
	"/assets/filmes-Dvem-qiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"248-At66gIukEjVT4hyjYdAaiPw6720\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 584,
		"path": "../public/assets/filmes-Dvem-qiS.js"
	},
	"/assets/hls-Do04YUrK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c5a9-1yFAW766BUPnLDwobd0qkUH+PJY\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 574889,
		"path": "../public/assets/hls-Do04YUrK.js"
	},
	"/assets/index-CHUVdbjN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"83266-iWxYhQwPHxuxTUVwTs4wK42IOEM\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 537190,
		"path": "../public/assets/index-CHUVdbjN.js"
	},
	"/assets/info-DkGeRLzN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c1-WDgOWNX9gYzkCyH2M8C/klaxorI\"",
		"mtime": "2026-08-27T20:18:22.802Z",
		"size": 193,
		"path": "../public/assets/info-DkGeRLzN.js"
	},
	"/assets/inicio-stnl-vji.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"42e9-krN9UDro82iaPgtG8R6Jf7bjbB8\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 17129,
		"path": "../public/assets/inicio-stnl-vji.js"
	},
	"/assets/input-D8zR-Z66.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"246-FR9INl93uPspjjs4MvnBqQHtTWo\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 582,
		"path": "../public/assets/input-D8zR-Z66.js"
	},
	"/assets/label-BwqH93jv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-x/aJ/M6/v/A1+5EVA45PZedtoxw\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 681,
		"path": "../public/assets/label-BwqH93jv.js"
	},
	"/assets/link-jlBYeiH4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"53ce-fW6IHaD0xg1PATt40LGEv5QSiXk\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 21454,
		"path": "../public/assets/link-jlBYeiH4.js"
	},
	"/assets/loader-circle-5bRYiOi1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-RbQbUWPruG61KhDZW/CHKrJLylE\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 133,
		"path": "../public/assets/loader-circle-5bRYiOi1.js"
	},
	"/assets/log-out-CAzBMASO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"db-nbbsz1wNA1GF+iU7D5/xHrUvlWM\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 219,
		"path": "../public/assets/log-out-CAzBMASO.js"
	},
	"/assets/media-url-v-mhH1UL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-s0aCGn2iBxjD3GdpCl7m1ndnQL8\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 256,
		"path": "../public/assets/media-url-v-mhH1UL.js"
	},
	"/assets/monitor-play-BrqsNPkL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2bc-TIy5M6/Ah0zbosDITsPvkLe/m5M\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 700,
		"path": "../public/assets/monitor-play-BrqsNPkL.js"
	},
	"/assets/notifications.functions-D7PIojLe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"29c-p0HcSC7AQCdpU/aJv+fdP2bEog8\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 668,
		"path": "../public/assets/notifications.functions-D7PIojLe.js"
	},
	"/assets/owner-page-shell-r97Mr_CO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19e0-HQgX5uOL7me408UQuY0PfYQi8b4\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 6624,
		"path": "../public/assets/owner-page-shell-r97Mr_CO.js"
	},
	"/assets/pagination-Cm0Pgwub.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f0f-Qax1ykG8sSEabQ1fZfBX1TekdmA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 3855,
		"path": "../public/assets/pagination-Cm0Pgwub.js"
	},
	"/assets/painel-BkNq7Tty.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15287-99SEpVx4UOIVPlJm7bSbY+VPHbo\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 86663,
		"path": "../public/assets/painel-BkNq7Tty.js"
	},
	"/assets/payments.functions-BamjJZCm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"240-eX6oxS4XHT4YlyKGkhowrF6Y8xw\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 576,
		"path": "../public/assets/payments.functions-BamjJZCm.js"
	},
	"/assets/plans.functions-DtiKXw3T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22d-1rQfhJ3SNyVGlYHTJWD/E9BeUbo\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 557,
		"path": "../public/assets/plans.functions-DtiKXw3T.js"
	},
	"/assets/player-store-5Ku4dfnz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1093-P/UmQI5ZSn20lAsKZITEGdCG/G8\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 4243,
		"path": "../public/assets/player-store-5Ku4dfnz.js"
	},
	"/assets/player.functions-B_hjcEcG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"505-6SthJL6641r1h3Cv35ov0LdBb/M\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 1285,
		"path": "../public/assets/player.functions-B_hjcEcG.js"
	},
	"/assets/pt-BR-TPEcwYkv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"61d7-YKVsYD3bdFmLfrrUukXsLfOE7XY\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 25047,
		"path": "../public/assets/pt-BR-TPEcwYkv.js"
	},
	"/assets/route-CXSPnlJd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94bc-LwLzyL1FDnlIr1bMYvekg1Cfuzo\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 38076,
		"path": "../public/assets/route-CXSPnlJd.js"
	},
	"/assets/routes-CoYy5qLs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-pTa9t7vARXJfwHd1WLDbieXsLWA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 383,
		"path": "../public/assets/routes-CoYy5qLs.js"
	},
	"/assets/search-BB1jfSz4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-nF7mquWegKOwMoO/gQr1Pm8znOA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 163,
		"path": "../public/assets/search-BB1jfSz4.js"
	},
	"/assets/section-error-boundary-BMNDBG_Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b9-J/C0jRkmR7o/gcrmNrQhxqj709o\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 2233,
		"path": "../public/assets/section-error-boundary-BMNDBG_Z.js"
	},
	"/assets/select-3JXJBl6F.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13309-o2aonpIyGsw1kmmpgOwIz8HOCgc\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 78601,
		"path": "../public/assets/select-3JXJBl6F.js"
	},
	"/assets/series-hDUKRPjB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f-NmI0E2oYeWFemCPRq0vhrhq1OG8\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 591,
		"path": "../public/assets/series-hDUKRPjB.js"
	},
	"/assets/server-Cv1SGI5l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"147-wEZFfdwqZTH8ZtGB0wjDeWOPUFI\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 327,
		"path": "../public/assets/server-Cv1SGI5l.js"
	},
	"/assets/servidores-CM2wRllS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fe-0BB6oqTHnTsAtcpS8qWtw2W0A40\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 1534,
		"path": "../public/assets/servidores-CM2wRllS.js"
	},
	"/assets/shield-check-COQyXarP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-LAbrKk1YK+6f9k5vPSMdr6N5nyA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 493,
		"path": "../public/assets/shield-check-COQyXarP.js"
	},
	"/assets/star-CBRZip1C.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cd-lVAKgOrmYx4BF2cburGzz+T/jvA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 461,
		"path": "../public/assets/star-CBRZip1C.js"
	},
	"/assets/suporte-D7vco3xH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7019-9lzSsexndkQKg59M+VGCSKc7m5A\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 28697,
		"path": "../public/assets/suporte-D7vco3xH.js"
	},
	"/assets/test-links.functions-0myCQdE_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3d3-KokHM0xMaDMtmfHTj63O+BrN/ds\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 979,
		"path": "../public/assets/test-links.functions-0myCQdE_.js"
	},
	"/assets/teste._slug-D4s3Pa1u.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2dc3-n/nioERu0IklGpGQK2g+DSGRG4k\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 11715,
		"path": "../public/assets/teste._slug-D4s3Pa1u.js"
	},
	"/assets/styles-CCuOrEpN.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"22326-F9MC8AOumAZfIJnFxGt7jURFbHQ\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 140070,
		"path": "../public/assets/styles-CCuOrEpN.css"
	},
	"/assets/tv-DGc5J_Pv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ae-qKXjipF4Efy6I5e8xZ8IVthHgdA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 174,
		"path": "../public/assets/tv-DGc5J_Pv.js"
	},
	"/assets/useMatch-CEHq1nsr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22c-cGb7b7oEegCA8Q0noCLsI1cKrQk\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 556,
		"path": "../public/assets/useMatch-CEHq1nsr.js"
	},
	"/assets/user-cog-DeQce9-m.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27a-AssD5linGI/wodJckgZQZsSe93g\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 634,
		"path": "../public/assets/user-cog-DeQce9-m.js"
	},
	"/assets/user-page-shell-eY_0Qc8p.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"59f-yqYDDktiRQbOUn8BpJNh2+DW+L4\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 1439,
		"path": "../public/assets/user-page-shell-eY_0Qc8p.js"
	},
	"/assets/user-q0CQe23Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b9-zVEMLxyyPc7InMvaL7SdDpnpBhA\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 185,
		"path": "../public/assets/user-q0CQe23Z.js"
	},
	"/assets/users-DxHUt6bk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"127-+jcf/AL7o1P3oVECziPiNK85idU\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 295,
		"path": "../public/assets/users-DxHUt6bk.js"
	},
	"/assets/usuarios-Dkwll-aC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"137cc-nG5WEuVA/oLAyeHY5lVW5vnvTHM\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 79820,
		"path": "../public/assets/usuarios-Dkwll-aC.js"
	},
	"/assets/zap-B0b_ckjf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fb-vofMoMAY5WQP9WGDgmTaFU9vr6w\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 251,
		"path": "../public/assets/zap-B0b_ckjf.js"
	},
	"/assets/utils-Blbz2_FY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14485-0eS08QKVO4+ebhwZXHnpG04N0EY\"",
		"mtime": "2026-08-27T20:18:22.806Z",
		"size": 83077,
		"path": "../public/assets/utils-Blbz2_FY.js"
	},
	"/brand/webplayer-brand.png": {
		"type": "image/png",
		"etag": "\"114626-tstqgulyu8vrthaG7AHO7LPr0ZA\"",
		"mtime": "2026-08-27T20:18:25.610Z",
		"size": 1132070,
		"path": "../public/brand/webplayer-brand.png"
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
var _lazy_HOO6L7 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_HOO6L7
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
