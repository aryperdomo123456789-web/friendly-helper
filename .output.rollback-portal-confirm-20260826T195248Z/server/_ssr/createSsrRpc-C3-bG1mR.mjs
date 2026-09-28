import { a as getServerFnById, i as TSS_SERVER_FUNCTION } from "./server-RH7bo_Nk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-C3-bG1mR.js
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
