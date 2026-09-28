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
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-08-26T12:21:28.987Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"19c-mi4+sQFXbahz3USYBnng8xWwfD8\"",
		"mtime": "2026-08-26T12:21:28.987Z",
		"size": 412,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-08-26T12:21:28.987Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/badge-Cnx6P33O.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ff-rDCzG/ZwlJtWFduWqdT0IXZI7Yo\"",
		"mtime": "2026-08-26T12:21:26.098Z",
		"size": 767,
		"path": "../public/assets/badge-Cnx6P33O.js"
	},
	"/assets/Catalog-CCEpBfXh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6c5a-Bl7JrvtLNi3WmSd6/0MlqsZxXLc\"",
		"mtime": "2026-08-26T12:21:26.098Z",
		"size": 27738,
		"path": "../public/assets/Catalog-CCEpBfXh.js"
	},
	"/assets/LoginScreen-AnJy2OdY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"188f-y/3d37wamo63OMTL1jjzbiNp5OA\"",
		"mtime": "2026-08-26T12:21:26.098Z",
		"size": 6287,
		"path": "../public/assets/LoginScreen-AnJy2OdY.js"
	},
	"/assets/Combination-DyF18fVx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77a9-SGxcPAoLdzcRWESyTsi+BluGpNE\"",
		"mtime": "2026-08-26T12:21:26.098Z",
		"size": 30633,
		"path": "../public/assets/Combination-DyF18fVx.js"
	},
	"/assets/calendar-BmHKfL9t.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-Td4XhadvyU8IhHE3x6uywPE5nLM\"",
		"mtime": "2026-08-26T12:21:26.098Z",
		"size": 246,
		"path": "../public/assets/calendar-BmHKfL9t.js"
	},
	"/assets/card-CLSEr4la.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"403-LP6jnEYKRBEvie5S8nhKgzDV6Y4\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 1027,
		"path": "../public/assets/card-CLSEr4la.js"
	},
	"/assets/button-PBzGgQze.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"50f6-441TaGd96rB4zzgFNgBkpFeyijo\"",
		"mtime": "2026-08-26T12:21:26.098Z",
		"size": 20726,
		"path": "../public/assets/button-PBzGgQze.js"
	},
	"/assets/canais-lKzTwPOu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1df-Ztz8Ur4L2c4YZ4ItxuJHtIssS6U\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 479,
		"path": "../public/assets/canais-lKzTwPOu.js"
	},
	"/assets/chat.functions-CCXNoTXV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6d1-QCsXhCYxq5Cm7Q5E0hMqCDKujig\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 1745,
		"path": "../public/assets/chat.functions-CCXNoTXV.js"
	},
	"/assets/chevron-left-B1Bd-A_E.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-8lDGVHx2QGcPnPNyTAMld4kSrgg\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 119,
		"path": "../public/assets/chevron-left-B1Bd-A_E.js"
	},
	"/assets/clipboard-CgeSPNYH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20b-Gw1MyVjKEn5Wsz3IwBSI7bp5kwg\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 523,
		"path": "../public/assets/clipboard-CgeSPNYH.js"
	},
	"/assets/chevron-right-Cm2oI6e4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-ZYLLXKu7QGgp57H/G7aWDb59Tao\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 119,
		"path": "../public/assets/chevron-right-Cm2oI6e4.js"
	},
	"/assets/check-BS4Qy5Zl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"71-yif5dLzSGkcY4SWOowp/bhmdI8E\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 113,
		"path": "../public/assets/check-BS4Qy5Zl.js"
	},
	"/assets/conta-DJP1XZSU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3a2c-TNwEKkLrG4QTj/ZAI3EcfXZXIVQ\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 14892,
		"path": "../public/assets/conta-DJP1XZSU.js"
	},
	"/assets/copy-r71BcTvL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-V0DUmZOQgjVZU2W4qxt01DLfxNk\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 225,
		"path": "../public/assets/copy-r71BcTvL.js"
	},
	"/assets/dialog-7L9d6EX9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2707-4ArrEpkWPL/JofjmUF6nzzp8g4k\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 9991,
		"path": "../public/assets/dialog-7L9d6EX9.js"
	},
	"/assets/dist-5pz8ak3F.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1040-fohVXVeGkZoGLaQQ+N8b/RER4ac\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 4160,
		"path": "../public/assets/dist-5pz8ak3F.js"
	},
	"/assets/film-CZmCclkE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18c-4WRbBXUfgT1e8SGD3NNa35BNLrY\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 396,
		"path": "../public/assets/film-CZmCclkE.js"
	},
	"/assets/dono-CH_BdTy3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bc-ggq/7CCX/+neAhM+Ncer6MXMSbg\"",
		"mtime": "2026-08-26T12:21:26.099Z",
		"size": 188,
		"path": "../public/assets/dono-CH_BdTy3.js"
	},
	"/assets/filmes-Bf9aklNC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"245-f7mADmNwWcgA2gIw/AMkoFTNG4g\"",
		"mtime": "2026-08-26T12:21:26.100Z",
		"size": 581,
		"path": "../public/assets/filmes-Bf9aklNC.js"
	},
	"/assets/hls-DJ087ZGg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7c727-Fz4CySR0coc3Q3hAxjC7UlZhKWo\"",
		"mtime": "2026-08-26T12:21:26.100Z",
		"size": 509735,
		"path": "../public/assets/hls-DJ087ZGg.js"
	},
	"/brand/webplayer-brand.png": {
		"type": "image/png",
		"etag": "\"114626-tstqgulyu8vrthaG7AHO7LPr0ZA\"",
		"mtime": "2026-08-26T12:21:28.989Z",
		"size": 1132070,
		"path": "../public/brand/webplayer-brand.png"
	},
	"/assets/info-MZRpgOaL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c1-YZVnp38modq2NHBTNWL52toABFs\"",
		"mtime": "2026-08-26T12:21:26.100Z",
		"size": 193,
		"path": "../public/assets/info-MZRpgOaL.js"
	},
	"/assets/inicio-B2cyeOAe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"430b-mLLKRwtMY1/sAE4jrQFnYhJKaeE\"",
		"mtime": "2026-08-26T12:21:26.100Z",
		"size": 17163,
		"path": "../public/assets/inicio-B2cyeOAe.js"
	},
	"/assets/label-WVUu1R7h.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-Bfu+S/5ZoMtwBN18PS5O01JmSus\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 681,
		"path": "../public/assets/label-WVUu1R7h.js"
	},
	"/assets/link-D56Sw3ss.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5aa9-I2Y4Axz0UN8lQ10LX9FkiFH248s\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 23209,
		"path": "../public/assets/link-D56Sw3ss.js"
	},
	"/assets/log-out-BGaEJS6e.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"db-a/kX8nHu3yUrqRbVpFEZycWEQI8\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 219,
		"path": "../public/assets/log-out-BGaEJS6e.js"
	},
	"/assets/loader-circle-Dn2O-7I_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-Os8RKguUofZUyw/I5kvBRSU+d+Q\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 133,
		"path": "../public/assets/loader-circle-Dn2O-7I_.js"
	},
	"/assets/input-B4gX1ifO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"246-wlCZ7T+1/iIxQ9DRgW/YZCx/25w\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 582,
		"path": "../public/assets/input-B4gX1ifO.js"
	},
	"/assets/media-url-v-mhH1UL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-s0aCGn2iBxjD3GdpCl7m1ndnQL8\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 256,
		"path": "../public/assets/media-url-v-mhH1UL.js"
	},
	"/assets/monitor-play-CphUbEMz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15a-hWocwtcGghZMWRiF6tQtcNiWHa0\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 346,
		"path": "../public/assets/monitor-play-CphUbEMz.js"
	},
	"/assets/notifications.functions-CF4-TnMi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2be-NFJ+oR5OAXoYuBgVhRtPHQ+GX24\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 702,
		"path": "../public/assets/notifications.functions-CF4-TnMi.js"
	},
	"/assets/pagination-6zNyaIpT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f0f-D4ptZnxcxaOd2qGfBW3aLOCrk8E\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 3855,
		"path": "../public/assets/pagination-6zNyaIpT.js"
	},
	"/assets/painel-DKzmcyJ7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"138fb-EPJBP2GtsKvWVYnrhVgFMFG7htY\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 80123,
		"path": "../public/assets/painel-DKzmcyJ7.js"
	},
	"/assets/plans.functions-DTQusPYn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f-qsbP2ETjnM8bcqAzT9BIPpg8Xak\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 591,
		"path": "../public/assets/plans.functions-DTQusPYn.js"
	},
	"/assets/payments.functions-CPrFlHGZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"262-s3snrGkdt6ivaDXxRvceiD7FoPg\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 610,
		"path": "../public/assets/payments.functions-CPrFlHGZ.js"
	},
	"/assets/player-store-B_GhDNDd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"da0-9IK2eL0Uu+QCtSc/5F0aqsINSGA\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 3488,
		"path": "../public/assets/player-store-B_GhDNDd.js"
	},
	"/assets/owner-page-shell-Bbxu4_5b.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"198c-WYfIa1uy5RZTNkWy+0S+MGwO9BU\"",
		"mtime": "2026-08-26T12:21:26.101Z",
		"size": 6540,
		"path": "../public/assets/owner-page-shell-Bbxu4_5b.js"
	},
	"/assets/player.functions-DkGbHBBy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4b1-gm0MFyylh5XUWmhLNzAkLfoPiS0\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 1201,
		"path": "../public/assets/player.functions-DkGbHBBy.js"
	},
	"/assets/pt-BR-D0WfhtwE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"61df-IvJs+lesQatxAM6dt94WkIyIqaU\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 25055,
		"path": "../public/assets/pt-BR-D0WfhtwE.js"
	},
	"/assets/section-error-boundary-CA0bY3XY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b9-R6vwrAQK6bxcgnSMKrAYQfe2glQ\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 2233,
		"path": "../public/assets/section-error-boundary-CA0bY3XY.js"
	},
	"/assets/select-C8Wen9pB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bbc2-jmeTcB9//w3XHrTXtu1Ez+5tx20\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 48066,
		"path": "../public/assets/select-C8Wen9pB.js"
	},
	"/assets/routes-DPYBGkfm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-psBz6KjIvbrvzUPJ3OrZqaujPWo\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 383,
		"path": "../public/assets/routes-DPYBGkfm.js"
	},
	"/assets/route-BPin_b-L.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"951e-L4mkI1IjLZuyGiHia2rUwV3jmNM\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 38174,
		"path": "../public/assets/route-BPin_b-L.js"
	},
	"/assets/index-DiI_mj0J.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"840af-IyHYICN8EjpLLV61bddCwUlx6TU\"",
		"mtime": "2026-08-26T12:21:26.097Z",
		"size": 540847,
		"path": "../public/assets/index-DiI_mj0J.js"
	},
	"/assets/series-DbBHEuQv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f-oo0vwUdJD6AIWAMIrvDL9cA4z4M\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 591,
		"path": "../public/assets/series-DbBHEuQv.js"
	},
	"/assets/server-CPghRZZe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"147-UUy0TMRXplKveQb4k8nDN+NHUhI\"",
		"mtime": "2026-08-26T12:21:26.102Z",
		"size": 327,
		"path": "../public/assets/server-CPghRZZe.js"
	},
	"/assets/servidores-eYVWqIZh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"676-QT5rjO2+wBF70EiTBBbhpeA0bhA\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 1654,
		"path": "../public/assets/servidores-eYVWqIZh.js"
	},
	"/assets/shield-check-C9JkGddQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-828I9Eynb9oLqUs+y6ZeByn6slk\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 493,
		"path": "../public/assets/shield-check-C9JkGddQ.js"
	},
	"/assets/star-B2d318TI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cd-GRjUDk+F6mP4paiVTwxB6B0JvUM\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 461,
		"path": "../public/assets/star-B2d318TI.js"
	},
	"/assets/styles-y2WOwj-A.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"21d52-vlA+wDHkTcVI3G5d48pqxJDENLo\"",
		"mtime": "2026-08-26T12:21:26.104Z",
		"size": 138578,
		"path": "../public/assets/styles-y2WOwj-A.css"
	},
	"/assets/test-links.functions-DTzq9Exz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3f5-tJpfOzQCd1kj6LUB6FjwYsQvv3s\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 1013,
		"path": "../public/assets/test-links.functions-DTzq9Exz.js"
	},
	"/assets/teste._slug-BIG9x3l_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2dc3-x9c1+U6spKA3TYTqWwmlF82zltw\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 11715,
		"path": "../public/assets/teste._slug-BIG9x3l_.js"
	},
	"/assets/tv-quMlOM05.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ae-IJ9MYqZCT2C7nMpjNgnBtmFmNoo\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 174,
		"path": "../public/assets/tv-quMlOM05.js"
	},
	"/assets/user-cog-QqNBykVK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27a-CGIBeM1GxbzrWF+CVeAXFzCEgso\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 634,
		"path": "../public/assets/user-cog-QqNBykVK.js"
	},
	"/assets/user-3GSlw2Uu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b9-T5VZSIUtXqsFxV8G1m6I5KKyYzY\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 185,
		"path": "../public/assets/user-3GSlw2Uu.js"
	},
	"/assets/useMatch-DV5Wqrmm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27c-yFDW/cGzCLiHoz28h6DC7Mk+UDE\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 636,
		"path": "../public/assets/useMatch-DV5Wqrmm.js"
	},
	"/assets/suporte-BIxjUssR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"610c-Cx8Oqb2qPoOqQN9iX2ejNAHbMO8\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 24844,
		"path": "../public/assets/suporte-BIxjUssR.js"
	},
	"/assets/user-page-shell-DY1_tE5U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"328-2DlW6afelqY2FCfnq17cJDRYnIg\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 808,
		"path": "../public/assets/user-page-shell-DY1_tE5U.js"
	},
	"/assets/users-CxmUsZDW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"127-TbIZyRXD8VRGhhHpNHPlg6cxvDI\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 295,
		"path": "../public/assets/users-CxmUsZDW.js"
	},
	"/assets/usuarios-CvH7ndr0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"137ac-sc0FEKltwpmY1Hk7B+ba7zhPQbA\"",
		"mtime": "2026-08-26T12:21:26.103Z",
		"size": 79788,
		"path": "../public/assets/usuarios-CvH7ndr0.js"
	},
	"/assets/zap-DeZiBmnI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fb-XWsyvKhYhNT3qCAsoldsgEkaK3Q\"",
		"mtime": "2026-08-26T12:21:26.104Z",
		"size": 251,
		"path": "../public/assets/zap-DeZiBmnI.js"
	},
	"/assets/utils-CiNwAlZZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13b79-aCwHD7dNFAUNuAMX5AbivtTr7Z0\"",
		"mtime": "2026-08-26T12:21:26.104Z",
		"size": 80761,
		"path": "../public/assets/utils-CiNwAlZZ.js"
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
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/static.mjs
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
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/error/prod.mjs
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
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/app.mjs
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
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
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
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/nitro/dist/presets/node/runtime/node-server.mjs
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
