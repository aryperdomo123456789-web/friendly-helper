import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as LoginScreen } from "./LoginScreen-CP5crRLN.mjs";
import { t as Route } from "./routes-Dgox6nzH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BN6ilPHy.js
var import_jsx_runtime = require_jsx_runtime();
function PublicLoginPage() {
	const search = Route.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginScreen, {
		mode: "public",
		initialUsername: typeof search.username === "string" ? search.username : "",
		initialPassword: typeof search.password === "string" ? search.password : "",
		autoLogin: Boolean(search.auto || search.username && search.password)
	});
}
//#endregion
export { PublicLoginPage as component };
