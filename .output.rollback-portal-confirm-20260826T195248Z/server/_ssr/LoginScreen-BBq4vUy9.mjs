import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as createServerFn } from "./server-RH7bo_Nk.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C3-bG1mR.mjs";
import { i as getAppConfig, t as APP_CONFIG_QUERY_KEY } from "./config.functions-DIZlpFO_.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as Lock, O as LoaderCircle, o as User } from "../_libs/lucide-react.mjs";
import { l as useServerFn } from "./router-TbbkYafm.mjs";
import { i as getMySession } from "./player.functions-By3APCJ0.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-947ctaEy.mjs";
import { t as Button } from "./button-CGP0JvU9.mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-05BV0jkA.mjs";
import { t as Label } from "./label-Cc8wWCLv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LoginScreen-BBq4vUy9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
createServerFn({ method: "GET" }).handler(createSsrRpc("5b1df27da40ab0320ac71b12322f2317371daf8c5ac97de62423d7253ce31e3b"));
var createFirstOwner = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	username: stringType().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9._-]+$/),
	password: stringType().min(8).max(72)
}).parse(input)).handler(createSsrRpc("f7829d2b45ebb3e5212598d779e423bab989291c30b7ffef28c65f5915e14fb9"));
function LoginScreen({ mode, initialUsername = "", initialPassword = "", autoLogin = false }) {
	const navigate = useNavigate();
	const fetchConfig = useServerFn(getAppConfig);
	const fetchSession = useServerFn(getMySession);
	const [hasSession, setHasSession] = (0, import_react.useState)(false);
	const [username, setUsername] = (0, import_react.useState)(initialUsername);
	const [password, setPassword] = (0, import_react.useState)(initialPassword);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const autoLoginAttemptedRef = (0, import_react.useRef)(false);
	const runBootstrap = useServerFn(createFirstOwner);
	const { data: appConfig } = useQuery({
		queryKey: APP_CONFIG_QUERY_KEY,
		queryFn: () => fetchConfig()
	});
	(0, import_react.useEffect)(() => {
		let active = true;
		supabase.auth.getSession().then(({ data }) => {
			if (!active) return;
			if (data.session) {
				setHasSession(true);
				(async () => {
					try {
						const session = await fetchSession();
						window.location.replace(session.isOwner ? "/painel" : "/inicio");
					} catch {
						window.location.replace("/inicio");
					}
				})();
			}
		});
		return () => {
			active = false;
		};
	}, [fetchSession]);
	(0, import_react.useEffect)(() => {
		if (initialUsername) setUsername(initialUsername);
	}, [initialUsername]);
	(0, import_react.useEffect)(() => {
		if (initialPassword) setPassword(initialPassword);
	}, [initialPassword]);
	(0, import_react.useEffect)(() => {
		if (mode !== "public") return;
		if (!autoLogin) return;
		if (hasSession || loading) return;
		if (autoLoginAttemptedRef.current) return;
		if (!username.trim() || !password) return;
		autoLoginAttemptedRef.current = true;
		const timer = window.setTimeout(() => {
			submitLogin(username, password);
		}, 200);
		return () => window.clearTimeout(timer);
	}, [
		mode,
		autoLogin,
		hasSession,
		loading,
		username,
		password
	]);
	if (hasSession) return null;
	const isOwnerMode = mode === "owner";
	const title = isOwnerMode ? "Acesso administrativo" : appConfig?.name || "Sistema IPTV";
	const shortName = appConfig?.short_name || appConfig?.name || "Sistema IPTV";
	const description = isOwnerMode ? "Entrada administrativa exclusiva do dono do sistema" : appConfig?.description || "Entre com suas credenciais de acesso";
	const telegramHandle = (appConfig?.telegram_handle || "@contato").trim().replace(/^@/, "");
	const brandImage = appConfig?.logo_url || "/brand/webplayer-brand.png";
	const submitLogin = async (loginUsername, loginPassword) => {
		if (!loginUsername || !loginPassword) {
			toast.error("Preencha todos os campos");
			return;
		}
		const normalizedUsername = loginUsername.trim().toLowerCase();
		const isOwnerAlias = normalizedUsername === "dono" || normalizedUsername === "magodono";
		if (!isOwnerMode && isOwnerAlias) {
			toast.info("O acesso administrativo fica em /dono");
			navigate({
				to: "/dono",
				replace: true
			});
			return;
		}
		setLoading(true);
		try {
			if (isOwnerMode && isOwnerAlias) try {
				await runBootstrap({ data: {
					username: normalizedUsername,
					password: loginPassword
				} });
			} catch {}
			const email = loginUsername.includes("@") ? loginUsername : `${normalizedUsername}@iptv.local`;
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password: loginPassword
			});
			if (error) throw error;
			if (isOwnerMode) {
				if (!(await fetchSession()).isOwner) {
					await supabase.auth.signOut();
					throw new Error("Esse acesso não possui permissão de dono.");
				}
			}
			toast.success(isOwnerMode ? "Acesso administrativo autorizado!" : "Acesso autorizado!");
			window.location.replace(isOwnerMode ? "/painel" : "/inicio");
		} catch (error) {
			console.error(error);
			toast.error(error.message || "Erro ao acessar o sistema");
		} finally {
			setLoading(false);
		}
	};
	const handleLogin = async (e) => {
		e.preventDefault();
		await submitLogin(username, password);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "z-10 w-full max-w-[400px] border-border/40 bg-card/60 backdrop-blur-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "space-y-1 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 text-primary shadow-xl shadow-primary/20 overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: brandImage,
								alt: "Logo",
								className: "h-full w-full object-contain p-2"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-3xl font-black tracking-tight",
							children: title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
							className: "font-medium text-muted-foreground/80",
							children: description
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleLogin,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "username",
								className: "ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60",
								children: "Usuário"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "absolute left-3 top-3 h-4 w-4 text-primary/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "username",
									placeholder: "Nome de usuário",
									className: "h-12 border-border/40 bg-background/40 pl-10 transition-all focus:border-primary/50",
									value: username,
									onChange: (e) => setUsername(e.target.value),
									disabled: loading,
									autoComplete: "username"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								className: "ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60",
								children: "Senha"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-primary/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "password",
									type: "password",
									placeholder: "••••••••",
									className: "h-12 border-border/40 bg-background/40 pl-10 transition-all focus:border-primary/50",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									disabled: loading,
									autoComplete: "current-password"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "h-12 w-full text-base font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30",
							disabled: loading,
							children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }), autoLogin ? "Entrando automaticamente..." : "Verificando..."] }) : "Entrar agora"
						}),
						isOwnerMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-0 flex items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-full border-t border-border" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative flex justify-center text-xs uppercase",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "bg-card px-2 text-muted-foreground",
									children: "Ou"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							type: "button",
							variant: "ghost",
							className: "w-full text-xs hover:bg-primary/5 hover:text-primary",
							disabled: loading,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "mr-2 h-3.5 w-3.5" }), "Voltar para Login de Cliente"]
							})
						})] })
					]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-8 flex flex-col items-center gap-2 px-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: `https://t.me/${telegramHandle}`,
					target: "_blank",
					rel: "noreferrer",
					"aria-label": "Abrir Telegram do sistema",
					className: "text-xs font-medium text-primary/80 transition-colors hover:text-primary",
					children: [
						"© 2026 ",
						shortName,
						" · Todos os direitos reservados"
					]
				})
			})
		]
	});
}
//#endregion
export { LoginScreen as t };
