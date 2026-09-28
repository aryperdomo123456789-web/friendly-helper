import { i as TSS_SERVER_FUNCTION } from "./createServerFn-BsVP-4Ld.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-BfXIYDgs.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-a47hDOu4.js
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
