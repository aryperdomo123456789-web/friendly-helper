import { i as TSS_SERVER_FUNCTION } from "./server-MF5sstFM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createServerRpc-BJaqr5ex.js
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
