import { i as TSS_SERVER_FUNCTION } from "./createServerFn-Lx6tl9Ev.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-2mbTnrJD.mjs";
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-C-9z99cs.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { createSsrRpc as t };
