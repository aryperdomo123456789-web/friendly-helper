import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as LoginScreen } from "./LoginScreen-CPnmWZa-.mjs";
import { t as Route } from "./routes-B2quAg5l.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/routes-DLggV1XZ.js
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
