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
		"mtime": "2026-09-28T22:39:02.771Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"18e-LUDzEu1sw0PZ2izEQdIrq18/Plk\"",
		"mtime": "2026-09-28T22:39:02.771Z",
		"size": 398,
		"path": "../public/manifest.webmanifest"
	},
	"/manifest.webmanifest.pre-brand-config-20260928": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"19c-mi4+sQFXbahz3USYBnng8xWwfD8\"",
		"mtime": "2026-09-28T22:39:02.772Z",
		"size": 412,
		"path": "../public/manifest.webmanifest.pre-brand-config-20260928"
	},
	"/assets/Catalog-CHoEScFB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"74b3-/70ahZXd3SfWxEeEYw+8Bw3zD2Q\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 29875,
		"path": "../public/assets/Catalog-CHoEScFB.js"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-28T22:39:02.772Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/LoginScreen-Cksnx7sQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1af6-oTAFihYQUkkdZUaR9mHGBKi9E2A\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 6902,
		"path": "../public/assets/LoginScreen-Cksnx7sQ.js"
	},
	"/assets/button-CcoJx-jC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"50cc-lGbhpf6lVzwUr1cAlHIrOtHtvCU\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 20684,
		"path": "../public/assets/button-CcoJx-jC.js"
	},
	"/assets/badge-CwD2k3h6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fa-OKmGp9wymMCZ5fbP7ooFU/LYJMU\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 762,
		"path": "../public/assets/badge-CwD2k3h6.js"
	},
	"/assets/calendar-DC_7hV1I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-tw6C3MJKJ3O0eTT17SIb/GfWNcc\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 246,
		"path": "../public/assets/calendar-DC_7hV1I.js"
	},
	"/assets/canais-Ct6rYnbr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1df-tmsY0/mXojQkLAusiLgvVbZQR/o\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 479,
		"path": "../public/assets/canais-Ct6rYnbr.js"
	},
	"/assets/Combination-CGnLMe4y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77a9-R3j73iR+NnvNKco0b6d5YIPtXt8\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 30633,
		"path": "../public/assets/Combination-CGnLMe4y.js"
	},
	"/assets/card-DogWOEWu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"403-F93Zi0CGLfKgm4zyzgMVD8/hSNk\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 1027,
		"path": "../public/assets/card-DogWOEWu.js"
	},
	"/assets/chat.functions-DGCiJ1CA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6af-OXdtb6KYrq1TI5W9xwCcN70ZBw0\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 1711,
		"path": "../public/assets/chat.functions-DGCiJ1CA.js"
	},
	"/assets/check-Ckl5UUml.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"71-+0eU/p09gvVUMIC6BpZ/fyzWZTY\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 113,
		"path": "../public/assets/check-Ckl5UUml.js"
	},
	"/assets/chevron-left-k3V31TXk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-Hhk8W92Sl3fBZkUPCPQ0xjDK8bY\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 119,
		"path": "../public/assets/chevron-left-k3V31TXk.js"
	},
	"/assets/chevron-right-BDIOHI23.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-sXl0hNpK9eDaKe/2bt0uQqxjiB4\"",
		"mtime": "2026-09-28T22:38:59.547Z",
		"size": 119,
		"path": "../public/assets/chevron-right-BDIOHI23.js"
	},
	"/assets/conta-0nQrHjqz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3a2c-yZqosvsqYLJjyUhoicGrjKQOBzw\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 14892,
		"path": "../public/assets/conta-0nQrHjqz.js"
	},
	"/assets/copy-DD9zOon5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-TnpNpMdWUFQUpSsOX5xsFkLGcmI\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 225,
		"path": "../public/assets/copy-DD9zOon5.js"
	},
	"/assets/clipboard-CgeSPNYH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20b-Gw1MyVjKEn5Wsz3IwBSI7bp5kwg\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 523,
		"path": "../public/assets/clipboard-CgeSPNYH.js"
	},
	"/assets/dono-DWHNJwNi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bc-a5SYdJbn19xLWDxt2H9FurlxSCQ\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 188,
		"path": "../public/assets/dono-DWHNJwNi.js"
	},
	"/assets/dialog-bKvBJj0D.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"270c-5VR2Rkl3Rr8SHEyhAV1AbaAxbI4\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 9996,
		"path": "../public/assets/dialog-bKvBJj0D.js"
	},
	"/assets/film-BoDiwO0z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18c-q/ansUvxUxyv30nnWintkvh6nsc\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 396,
		"path": "../public/assets/film-BoDiwO0z.js"
	},
	"/assets/dist-exOXMj1h.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1040-+UcIUFal8fKflhrdM400K/STpU8\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 4160,
		"path": "../public/assets/dist-exOXMj1h.js"
	},
	"/assets/filmes-CIvLzqQY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"245-uL9094+5vkOJI44xgn8bjfhe66g\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 581,
		"path": "../public/assets/filmes-CIvLzqQY.js"
	},
	"/brand/webplayer-brand.png": {
		"type": "image/png",
		"etag": "\"114626-tstqgulyu8vrthaG7AHO7LPr0ZA\"",
		"mtime": "2026-09-28T22:39:02.774Z",
		"size": 1132070,
		"path": "../public/brand/webplayer-brand.png"
	},
	"/assets/info-B_LXDAds.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c1-QFCs1Map/GF9+OMc5lzCWPjtBts\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 193,
		"path": "../public/assets/info-B_LXDAds.js"
	},
	"/assets/inicio-BSdWYaxc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"430b-lYEM4mF87vCxEKRTsNVgN8qbz+8\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 17163,
		"path": "../public/assets/inicio-BSdWYaxc.js"
	},
	"/assets/input-Dqcjqhpi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"246-piVaU1iuek42GlYm8Z05ZkK4BL4\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 582,
		"path": "../public/assets/input-Dqcjqhpi.js"
	},
	"/assets/label-d9GILpSh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-eZRclonNhoRWC/icVzH1ALmTw/o\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 681,
		"path": "../public/assets/label-d9GILpSh.js"
	},
	"/assets/loader-circle-Bc4yJ8wL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-yd2zVwo/ieubvpSVV6qumwMq9v0\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 133,
		"path": "../public/assets/loader-circle-Bc4yJ8wL.js"
	},
	"/assets/log-out-CyweqXk5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"db-XbFxbvi4/0C4mHSctHieq9J+Egg\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 219,
		"path": "../public/assets/log-out-CyweqXk5.js"
	},
	"/assets/media-url-v-mhH1UL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-s0aCGn2iBxjD3GdpCl7m1ndnQL8\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 256,
		"path": "../public/assets/media-url-v-mhH1UL.js"
	},
	"/assets/link-z51Jc_wK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5aa9-8SlJOOPv2u8bN9GG/+z/XmeXcaY\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 23209,
		"path": "../public/assets/link-z51Jc_wK.js"
	},
	"/assets/notifications.functions-BgYmK3bC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"29c-1YqnablvqJh67ny3NKIb7zBCPzU\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 668,
		"path": "../public/assets/notifications.functions-BgYmK3bC.js"
	},
	"/assets/pagination-BN1WUZci.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f0f-3AiwYxQ3+D9jEiB9fHOgYPhrl1s\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 3855,
		"path": "../public/assets/pagination-BN1WUZci.js"
	},
	"/assets/owner-page-shell-BpAfjwwG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19e0-tFBvBb9zSEl8ps5FeiHLXsrJpDw\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 6624,
		"path": "../public/assets/owner-page-shell-BpAfjwwG.js"
	},
	"/assets/monitor-play-B9YF2UwE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15a-SqjOfUdQi7mHD2xyjiKwg0AYKj8\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 346,
		"path": "../public/assets/monitor-play-B9YF2UwE.js"
	},
	"/assets/payments.functions-VYhqEGE7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"240-rvvYL34XXSfpNKsgLxSs0+ZlDkc\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 576,
		"path": "../public/assets/payments.functions-VYhqEGE7.js"
	},
	"/assets/plans.functions-CWz4GxFn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22d-4y/SEEONFKviKjdvPe2Pk+Zvgl8\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 557,
		"path": "../public/assets/plans.functions-CWz4GxFn.js"
	},
	"/assets/painel-D6BwpTKN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1394e-Q/Z0K9Fl8iREEEMrIYIagvvo194\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 80206,
		"path": "../public/assets/painel-D6BwpTKN.js"
	},
	"/assets/player.functions-BbxHr-PE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"48f-yfN08AeyoqNtIkdr2JZH8WEx9Ig\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 1167,
		"path": "../public/assets/player.functions-BbxHr-PE.js"
	},
	"/assets/hls-DJ087ZGg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7c727-Fz4CySR0coc3Q3hAxjC7UlZhKWo\"",
		"mtime": "2026-09-28T22:38:59.548Z",
		"size": 509735,
		"path": "../public/assets/hls-DJ087ZGg.js"
	},
	"/assets/pt-BR-D0WfhtwE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"61df-IvJs+lesQatxAM6dt94WkIyIqaU\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 25055,
		"path": "../public/assets/pt-BR-D0WfhtwE.js"
	},
	"/assets/player-store-Dg_PTFCg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"da5-r+4SBiacAl8RGrTDRYmZ4Fh6b2k\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 3493,
		"path": "../public/assets/player-store-Dg_PTFCg.js"
	},
	"/assets/routes-BMoH60tZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-wXVZhy5VK0GwixX86dcvlcD6ZQc\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 383,
		"path": "../public/assets/routes-BMoH60tZ.js"
	},
	"/assets/route-KazWE-hz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9cdd-6Xntx7VtOPhzud4AJ0ANN5ZuUAU\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 40157,
		"path": "../public/assets/route-KazWE-hz.js"
	},
	"/assets/section-error-boundary-BUMi2Hrv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b9-MaeYSp2O/QZqrOG8SZOoJ64kqtU\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 2233,
		"path": "../public/assets/section-error-boundary-BUMi2Hrv.js"
	},
	"/assets/select-usJLj7yH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bbc6-TjjDglZhj6MYd+y+5NkdiGgoyhc\"",
		"mtime": "2026-09-28T22:38:59.549Z",
		"size": 48070,
		"path": "../public/assets/select-usJLj7yH.js"
	},
	"/assets/index-DmZ_RWMf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8448b-Hh8TbhKP8mpT3qEfR5GaCpP7zNw\"",
		"mtime": "2026-09-28T22:38:59.546Z",
		"size": 541835,
		"path": "../public/assets/index-DmZ_RWMf.js"
	},
	"/assets/series-BPTImxPv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f-3N9cwKNUmhu3hhvrYFhXpQdJVwM\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 591,
		"path": "../public/assets/series-BPTImxPv.js"
	},
	"/assets/server-tJCZgXlo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"147-R114C/+5+4OCK4T54lOsh2/+RHI\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 327,
		"path": "../public/assets/server-tJCZgXlo.js"
	},
	"/assets/servidores-BuPBfz6M.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"67b-PY9BNbIWM7yI2gzZLQuzlnwlJEQ\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 1659,
		"path": "../public/assets/servidores-BuPBfz6M.js"
	},
	"/assets/shield-check-C_uJdFA4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ed-LdgPr7u/Ibj5jZW6gdVazs7b/hM\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 493,
		"path": "../public/assets/shield-check-C_uJdFA4.js"
	},
	"/assets/test-links.functions-DO6gGTTV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3d3-VpZn4gE+DA5v24Fr62Y/+u6Boo4\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 979,
		"path": "../public/assets/test-links.functions-DO6gGTTV.js"
	},
	"/assets/star-CHE6UJi-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cd-h4LnAxcEov2Px7J+OoEV+H4LSAQ\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 461,
		"path": "../public/assets/star-CHE6UJi-.js"
	},
	"/assets/useMatch-Bh3qj6pi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27c-YAsYIWBnonWONu26Z+H6uK8Dp9c\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 636,
		"path": "../public/assets/useMatch-Bh3qj6pi.js"
	},
	"/assets/suporte-DDRFK69Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"610c-G7CY8RGqGOlWOMSjtLoflkhHx8s\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 24844,
		"path": "../public/assets/suporte-DDRFK69Q.js"
	},
	"/assets/teste._slug-CBskmJEC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2dc3-BHnksB2VQmtvWJaheoz8ZXI36sU\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 11715,
		"path": "../public/assets/teste._slug-CBskmJEC.js"
	},
	"/assets/user-BcmiNVXd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b9-v2lsjqKfMrLt/BenNwMMSYjLzIM\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 185,
		"path": "../public/assets/user-BcmiNVXd.js"
	},
	"/assets/user-cog-CQdlcde3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27a-YTJSIoBX5VrqT6xxFo0nMo9e6hQ\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 634,
		"path": "../public/assets/user-cog-CQdlcde3.js"
	},
	"/assets/user-page-shell-C5jwYWKx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"393-/IVdgfVl3w3+LQrGxLmjUHe+hEc\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 915,
		"path": "../public/assets/user-page-shell-C5jwYWKx.js"
	},
	"/assets/users-CvQX5367.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"127-3+i9FbaLQmQkqxmoS72gYOYKZvA\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 295,
		"path": "../public/assets/users-CvQX5367.js"
	},
	"/assets/tv-D1C2sWBF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ae-c2NWByNOdsM3IoeP45Oa+oPhAgA\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 174,
		"path": "../public/assets/tv-D1C2sWBF.js"
	},
	"/assets/styles-BdqNEk-g.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"22de2-f07Zq/uqT1+DM0kkyGKddZ+PPt8\"",
		"mtime": "2026-09-28T22:38:59.551Z",
		"size": 142818,
		"path": "../public/assets/styles-BdqNEk-g.css"
	},
	"/assets/utils-D0yxl1VS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13b9f-3H7yRyHCwRKtSNw6R03p61OrGoI\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 80799,
		"path": "../public/assets/utils-D0yxl1VS.js"
	},
	"/assets/usuarios-F0pDtahi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"151cc-+do6NAC+AbLWmeBjGdo/hFXiRqw\"",
		"mtime": "2026-09-28T22:38:59.550Z",
		"size": 86476,
		"path": "../public/assets/usuarios-F0pDtahi.js"
	},
	"/assets/zap-C4Msv5ns.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fb-M485uKfQt3T1jLE/YlJWkq4fLGQ\"",
		"mtime": "2026-09-28T22:38:59.551Z",
		"size": 251,
		"path": "../public/assets/zap-C4Msv5ns.js"
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
