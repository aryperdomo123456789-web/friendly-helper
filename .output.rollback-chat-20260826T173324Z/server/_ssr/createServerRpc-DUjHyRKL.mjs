import { i as TSS_SERVER_FUNCTION } from "./createServerFn-Lx6tl9Ev.mjs";
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/createServerRpc-DUjHyRKL.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { createServerRpc as t };
