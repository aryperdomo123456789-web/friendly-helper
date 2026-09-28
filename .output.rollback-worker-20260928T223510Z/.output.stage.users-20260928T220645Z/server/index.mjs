globalThis.__nitro_main__ = import.meta.url;
import { i as serve, r as NodeResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
import { a as toEventHandler, i as defineLazyEventHandler, n as HTTPError, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
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
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-09-28T22:06:59.312Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"18e-LUDzEu1sw0PZ2izEQdIrq18/Plk\"",
		"mtime": "2026-09-28T22:06:59.312Z",
		"size": 398,
		"path": "../public/manifest.webmanifest"
	},
	"/manifest.webmanifest.pre-brand-config-20260928": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"19c-mi4+sQFXbahz3USYBnng8xWwfD8\"",
		"mtime": "2026-09-28T22:06:59.312Z",
		"size": 412,
		"path": "../public/manifest.webmanifest.pre-brand-config-20260928"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-28T22:06:59.313Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/Combination-DgcXVy5z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77a9-5GOoHnYggZzTmp7R3GDjRdArS6U\"",
		"mtime": "2026-09-28T22:06:56.369Z",
		"size": 30633,
		"path": "../public/assets/Combination-DgcXVy5z.js"
	},
	"/assets/Catalog-DMr-QUQP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"74b2-S0TIqviCLkmTX67SRHa1d0zguwM\"",
		"mtime": "2026-09-28T22:06:56.369Z",
		"size": 29874,
		"path": "../public/assets/Catalog-DMr-QUQP.js"
	},
	"/assets/badge-DqxFkGqv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ff-3b7OqG3/pj4lkAU3BpO+zl3I6Fc\"",
		"mtime": "2026-09-28T22:06:56.369Z",
		"size": 767,
		"path": "../public/assets/badge-DqxFkGqv.js"
	},
	"/assets/LoginScreen-BGynNY6Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1af6-tFG2265zKX67mRC1rEHFm7XO7qo\"",
		"mtime": "2026-09-28T22:06:56.369Z",
		"size": 6902,
		"path": "../public/assets/LoginScreen-BGynNY6Z.js"
	},
	"/assets/calendar-DSPo0gQS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-mIUCGihp8YKPxji0BpPC4GhWxDs\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 246,
		"path": "../public/assets/calendar-DSPo0gQS.js"
	},
	"/assets/button-Bv170UAq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b47-rYH8LmOS4SZk1svqOxNwC36ltAM\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 23367,
		"path": "../public/assets/button-Bv170UAq.js"
	},
	"/assets/canais-BYKijW8p.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1df-87aQI2KsT5YyEMPA/TI2oJUx5wQ\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 479,
		"path": "../public/assets/canais-BYKijW8p.js"
	},
	"/assets/card-tZupPGLY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"403-LmF3T7DkFooAejJcceP2H6jzzRo\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 1027,
		"path": "../public/assets/card-tZupPGLY.js"
	},
	"/assets/chat.functions-DjhaiU-8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6aa-0aYSJbA+h+rK5Yv/q3mT5tBu2YA\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 1706,
		"path": "../public/assets/chat.functions-DjhaiU-8.js"
	},
	"/assets/check-C1ah4Y2r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"71-65oZuGk8B60VaEMH5xeYyn9OGzg\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 113,
		"path": "../public/assets/check-C1ah4Y2r.js"
	},
	"/assets/chevron-left-BXwbZmC-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-YfE5RInC1G43lHQRlzQncP9l92k\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 119,
		"path": "../public/assets/chevron-left-BXwbZmC-.js"
	},
	"/assets/chevron-right-CUCpSBqt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-vidt56l1CBmmYHLTxomzw7pojAk\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 119,
		"path": "../public/assets/chevron-right-CUCpSBqt.js"
	},
	"/assets/clipboard-CgeSPNYH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20b-Gw1MyVjKEn5Wsz3IwBSI7bp5kwg\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 523,
		"path": "../public/assets/clipboard-CgeSPNYH.js"
	},
	"/assets/conta-g3cvgAxj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3a27-E9rSBr2vUGshMZFG6/OnL3jMBJI\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 14887,
		"path": "../public/assets/conta-g3cvgAxj.js"
	},
	"/assets/copy-Cd1MZAuH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-GkF7u1dPEtyfpYoudND28ASCicM\"",
		"mtime": "2026-09-28T22:06:56.370Z",
		"size": 225,
		"path": "../public/assets/copy-Cd1MZAuH.js"
	},
	"/assets/dialog-B2jQpKHL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2707-Vss6zsAOv6pkXO0pqALG7eJ/JGw\"",
		"mtime": "2026-09-28T22:06:56.371Z",
		"size": 9991,
		"path": "../public/assets/dialog-B2jQpKHL.js"
	},
	"/assets/dist-DavyQH_f.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1040-4tWqfQ0HNcchoT+ycytb8NEDVks\"",
		"mtime": "2026-09-28T22:06:56.371Z",
		"size": 4160,
		"path": "../public/assets/dist-DavyQH_f.js"
	},
	"/assets/dono-DrZ3bAsE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bc-e++N7f+VpShDQMkYtxd9AMkt/6k\"",
		"mtime": "2026-09-28T22:06:56.371Z",
		"size": 188,
		"path": "../public/assets/dono-DrZ3bAsE.js"
	},
	"/assets/film-hMQprgjx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18c-WsdOlUzmUPnmeV9YhFbSwgPj1bc\"",
		"mtime": "2026-09-28T22:06:56.371Z",
		"size": 396,
		"path": "../public/assets/film-hMQprgjx.js"
	},
	"/assets/filmes-Cti1tOVb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"245-IjS7zb4FJQ5JTNFVm6q3SX+rfu4\"",
		"mtime": "2026-09-28T22:06:56.371Z",
		"size": 581,
		"path": "../public/assets/filmes-Cti1tOVb.js"
	},
	"/brand/webplayer-brand.png": {
		"type": "image/png",
		"etag": "\"114626-tstqgulyu8vrthaG7AHO7LPr0ZA\"",
		"mtime": "2026-09-28T22:06:59.314Z",
		"size": 1132070,
		"path": "../public/brand/webplayer-brand.png"
	},
	"/assets/info-ByzgOxm3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c1-+NB56hUfKBkiftDxkCnrVaCF5mU\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 193,
		"path": "../public/assets/info-ByzgOxm3.js"
	},
	"/assets/inicio-Bsikih_J.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"430b-YGAYu2CfHaPwfO+85Z4tM+1kZdw\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 17163,
		"path": "../public/assets/inicio-Bsikih_J.js"
	},
	"/assets/input-Ucqq2IYf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"246-7qhtYd+pEpaqiecqGWR2Bq5n1wM\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 582,
		"path": "../public/assets/input-Ucqq2IYf.js"
	},
	"/assets/link-D8pcdlHS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5aa9-seDAVODn9r3tQs/w1Ax7DeAQgd0\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 23209,
		"path": "../public/assets/link-D8pcdlHS.js"
	},
	"/assets/loader-circle-DmXjR8p2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-DfhIXLQD4Zlyie6/w6q2efmP4wA\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 133,
		"path": "../public/assets/loader-circle-DmXjR8p2.js"
	},
	"/assets/hls-DJ087ZGg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7c727-Fz4CySR0coc3Q3hAxjC7UlZhKWo\"",
		"mtime": "2026-09-28T22:06:56.371Z",
		"size": 509735,
		"path": "../public/assets/hls-DJ087ZGg.js"
	},
	"/assets/label-CsyVmYxE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-EHIQMkh9dDlGEXIL5pm3wJX/3hY\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 681,
		"path": "../public/assets/label-CsyVmYxE.js"
	},
	"/assets/log-out-Do5aHARU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"db-Qu+NHXSxW5VZQpJdoGuwins1yOI\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 219,
		"path": "../public/assets/log-out-Do5aHARU.js"
	},
	"/assets/media-url-v-mhH1UL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-s0aCGn2iBxjD3GdpCl7m1ndnQL8\"",
		"mtime": "2026-09-28T22:06:56.372Z",
		"size": 256,
		"path": "../public/assets/media-url-v-mhH1UL.js"
	},
	"/assets/monitor-play-BEWpWi8r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15a-lE7CYb1jcuBvUG0avZGf+oCwfx4\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 346,
		"path": "../public/assets/monitor-play-BEWpWi8r.js"
	},
	"/assets/notifications.functions-_eeydMb1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"297-9wCv8kdktskAKBwdcuSyn6zfBWM\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 663,
		"path": "../public/assets/notifications.functions-_eeydMb1.js"
	},
	"/assets/owner-page-shell-COV6zDXp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19db-Kk+6T3KKbJqDg1paTE45JpzUKAg\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 6619,
		"path": "../public/assets/owner-page-shell-COV6zDXp.js"
	},
	"/assets/pagination-oUH-2iNX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f0a-IatM3IelkrFL44DkRq97p4yRMiA\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 3850,
		"path": "../public/assets/pagination-oUH-2iNX.js"
	},
	"/assets/painel-BjrsdcIf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1394e-zKOr4Zu4kh6IVp9Mhy77pJwAwso\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 80206,
		"path": "../public/assets/painel-BjrsdcIf.js"
	},
	"/assets/payments.functions-CO9SSOCY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"23b-AO/+jfV184vIJgVlxLi6huvAuf4\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 571,
		"path": "../public/assets/payments.functions-CO9SSOCY.js"
	},
	"/assets/plans.functions-CVLlnV67.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22d-9LP2xlP8VeadpUXeNzFRU/XE1vA\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 557,
		"path": "../public/assets/plans.functions-CVLlnV67.js"
	},
	"/assets/player-store-h7vQTu5g.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"da5-iELZREiIcD6cgNRbugp1CIj45CI\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 3493,
		"path": "../public/assets/player-store-h7vQTu5g.js"
	},
	"/assets/player.functions-CbHAHkuv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"48f-VpF7bIFMGDXeNmoJH5AgoQ8ZNSM\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 1167,
		"path": "../public/assets/player.functions-CbHAHkuv.js"
	},
	"/assets/pt-BR-pepeJYTr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6184-g+ypWnc8p3EWZWIrxGKVi7UkXV4\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 24964,
		"path": "../public/assets/pt-BR-pepeJYTr.js"
	},
	"/assets/route-BEa6Jjej.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ce4-FqJJRRXQ0GUCs3lEkiqW2504LQw\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 40164,
		"path": "../public/assets/route-BEa6Jjej.js"
	},
	"/assets/routes-DdPAEPMc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-3Tj0Rp39h0WUa/S+a3D/droeT8Q\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 383,
		"path": "../public/assets/routes-DdPAEPMc.js"
	},
	"/assets/section-error-boundary-Da2CAcGK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b9-0UlNEjc+oIEeUVUHRd3xINe8R/w\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 2233,
		"path": "../public/assets/section-error-boundary-Da2CAcGK.js"
	},
	"/assets/select-DjGLhRlr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bbcb-b5qfSyUr3X4pp04xQp76Vqoi9Qo\"",
		"mtime": "2026-09-28T22:06:56.373Z",
		"size": 48075,
		"path": "../public/assets/select-DjGLhRlr.js"
	},
	"/assets/index-Dj_1mHUR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84d60-xin34BF8TI4ldNZJdh06eoA4vOE\"",
		"mtime": "2026-09-28T22:06:56.367Z",
		"size": 544096,
		"path": "../public/assets/index-Dj_1mHUR.js"
	},
	"/assets/series-Db8SjPc2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f-Cn17EYY0bvHMTsvYyzK41RPKjkM\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 591,
		"path": "../public/assets/series-Db8SjPc2.js"
	},
	"/assets/server-CFz6DuIP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"147-0mRz2rwmC+YEhAxJTKqLl834s4w\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 327,
		"path": "../public/assets/server-CFz6DuIP.js"
	},
	"/assets/shield-check-SrVuYiv3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-Paqz5IB3a93514g2Ni9HBBby7uo\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 493,
		"path": "../public/assets/shield-check-SrVuYiv3.js"
	},
	"/assets/servidores-BpKbeeBP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"680-Fz1OzachgQhq3ZWi/E7EpJ25JEc\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 1664,
		"path": "../public/assets/servidores-BpKbeeBP.js"
	},
	"/assets/star-DkwR_0Jv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cd-d4kM5jUyL6IcCaJ4cWC6NfQNB+o\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 461,
		"path": "../public/assets/star-DkwR_0Jv.js"
	},
	"/assets/suporte-BqEZ7a10.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"610c-+UEFbfpK0nQDLWRaSJM8PKrs0Hs\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 24844,
		"path": "../public/assets/suporte-BqEZ7a10.js"
	},
	"/assets/styles-D5RE4Nds.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"22dbc-GBEUTjxCt8MbKeXpPeOMn6b2mfM\"",
		"mtime": "2026-09-28T22:06:56.375Z",
		"size": 142780,
		"path": "../public/assets/styles-D5RE4Nds.css"
	},
	"/assets/test-links.functions-aHkrL7yo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3ce-KKkZ1BaDdAKNzJ8J12reQyhqOOY\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 974,
		"path": "../public/assets/test-links.functions-aHkrL7yo.js"
	},
	"/assets/tv-BR-tb5IK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ae-B5MtFZ1vzzBDtREyejHTk8Yc+yE\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 174,
		"path": "../public/assets/tv-BR-tb5IK.js"
	},
	"/assets/useMatch-B8f-HtgW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27c-5+RHLj94k6kiQMYHddXsv6qdg40\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 636,
		"path": "../public/assets/useMatch-B8f-HtgW.js"
	},
	"/assets/teste._slug-DRp4imtR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2dc3-2oSIeXrReKP9ym7MS9s8s3CBT4o\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 11715,
		"path": "../public/assets/teste._slug-DRp4imtR.js"
	},
	"/assets/user-CGae95GQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b9-CPNLXkif8d/OPhyYA9Rr94Y9OFY\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 185,
		"path": "../public/assets/user-CGae95GQ.js"
	},
	"/assets/user-cog-CBht2gny.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27a-f7p0Hcae/+BR3KeMVeVNAE72Drg\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 634,
		"path": "../public/assets/user-cog-CBht2gny.js"
	},
	"/assets/users-DRz1FVDY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"127-uXFkhScyBHy4imBcKHKO71Ss3NE\"",
		"mtime": "2026-09-28T22:06:56.375Z",
		"size": 295,
		"path": "../public/assets/users-DRz1FVDY.js"
	},
	"/assets/user-page-shell-B3B9au3R.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"398-k/NjKBag+FxR8K6gtuvCjWkKzEo\"",
		"mtime": "2026-09-28T22:06:56.374Z",
		"size": 920,
		"path": "../public/assets/user-page-shell-B3B9au3R.js"
	},
	"/assets/usuarios-Ba_X1Zgj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d42-tfyr5b2ndQ9Jjvuh2UCvlMJM+Mw\"",
		"mtime": "2026-09-28T22:06:56.375Z",
		"size": 105794,
		"path": "../public/assets/usuarios-Ba_X1Zgj.js"
	},
	"/assets/utils-BkE8H_By.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13240-Iujk16gqLNy3DW5APccCvG/NoJQ\"",
		"mtime": "2026-09-28T22:06:56.375Z",
		"size": 78400,
		"path": "../public/assets/utils-BkE8H_By.js"
	},
	"/assets/zap-CT7IB9xH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fb-pBDQ3YfpN9aopr5Eg9qldABaRCY\"",
		"mtime": "2026-09-28T22:06:56.375Z",
		"size": 251,
		"path": "../public/assets/zap-CT7IB9xH.js"
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
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/static.mjs
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
var _lazy_UlXovS = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_UlXovS
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
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/error/prod.mjs
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
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/app.mjs
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
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
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
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/presets/node/runtime/node-server.mjs
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
