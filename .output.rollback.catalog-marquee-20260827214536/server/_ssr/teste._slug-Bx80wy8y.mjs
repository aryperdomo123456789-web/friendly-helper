import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $ as Check, G as Copy, N as Key, V as ExternalLink, c as Tv, et as Calendar, o as User, t as Zap } from "../_libs/lucide-react.mjs";
import { d as createTestUser, l as useServerFn, n as Route$4, u as checkDeviceBlocked } from "./router-Et7bA8TZ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-CaKMHyO9.mjs";
import { t as Button } from "./button-Cs_VpIIH.mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-CUJGcv94.mjs";
import { t as Label } from "./label-dwRI05YA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/teste._slug-Bx80wy8y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TestePublico() {
	const { slug } = Route$4.useParams();
	const search = Route$4.useSearch();
	const referralCode = search.ref || null;
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [credentials, setCredentials] = (0, import_react.useState)(search.username && search.password && search.expiresAt ? {
		username: String(search.username),
		password: String(search.password),
		expiresAt: String(search.expiresAt)
	} : null);
	const [copied, setCopied] = (0, import_react.useState)(null);
	const [blocked, setBlocked] = (0, import_react.useState)(false);
	const [fingerprint, setFingerprint] = (0, import_react.useState)("");
	const mutationCreateTest = useServerFn(createTestUser);
	const mutationCheckDevice = useServerFn(checkDeviceBlocked);
	(0, import_react.useEffect)(() => {
		const currentFingerprint = getFingerprint();
		setFingerprint(currentFingerprint);
		setBlocked(false);
		const checkStatus = async () => {
			if (!currentFingerprint) return;
			try {
				if ((await mutationCheckDevice({ data: {
					fingerprint: currentFingerprint,
					slug
				} })).blocked) setBlocked(true);
			} catch (e) {
				console.error("Erro ao validar dispositivo:", e);
			}
		};
		checkStatus();
	}, [mutationCheckDevice, slug]);
	const getFingerprint = () => {
		if (typeof window === "undefined") return "";
		const data = [
			"v2",
			navigator.language || "",
			navigator.languages?.join(",") || "",
			Intl.DateTimeFormat().resolvedOptions().timeZone || "",
			screen.width || 0,
			screen.height || 0,
			screen.availWidth || 0,
			screen.availHeight || 0,
			screen.colorDepth || 0,
			screen.pixelDepth || 0,
			window.devicePixelRatio || 1,
			navigator.hardwareConcurrency || 0,
			navigator.deviceMemory || 0,
			navigator.maxTouchPoints || 0,
			navigator.platform || "",
			navigator.vendor || "",
			window.matchMedia?.("(pointer: coarse)")?.matches ? "coarse" : "fine",
			window.matchMedia?.("(hover: none)")?.matches ? "no-hover" : "hover",
			getCanvasFingerprint(),
			getWebglFingerprint()
		].join("|");
		return hashString(data);
	};
	const hashString = (value) => {
		let hash = 0;
		for (let i = 0; i < value.length; i++) {
			const char = value.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(16).padStart(8, "0");
	};
	const getCanvasFingerprint = () => {
		try {
			const canvas = document.createElement("canvas");
			canvas.width = 240;
			canvas.height = 80;
			const context = canvas.getContext("2d");
			if (!context) return "no-canvas";
			context.textBaseline = "top";
			context.font = "16px Arial";
			context.fillStyle = "#0f172a";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.fillStyle = "#f8fafc";
			context.fillText("mago-device-id", 12, 12);
			context.fillStyle = "#38bdf8";
			context.fillText("fingerprint", 12, 34);
			context.strokeStyle = "#e2e8f0";
			context.beginPath();
			context.arc(180, 40, 18, 0, Math.PI * 2);
			context.stroke();
			return hashString(canvas.toDataURL());
		} catch {
			return "canvas-error";
		}
	};
	const getWebglFingerprint = () => {
		try {
			const canvas = document.createElement("canvas");
			const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			if (!gl) return "no-webgl";
			const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
			const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
			const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
			const version = gl.getParameter(gl.VERSION);
			return hashString([
				vendor,
				renderer,
				version
			].join("|"));
		} catch {
			return "webgl-error";
		}
	};
	const handleCreateTest = async (event) => {
		event?.preventDefault();
		setLoading(true);
		try {
			const currentFingerprint = fingerprint || getFingerprint();
			setFingerprint(currentFingerprint);
			const res = await mutationCreateTest({ data: {
				slug,
				fingerprint: currentFingerprint,
				referral_code: referralCode
			} });
			setCredentials(res);
			toast.success("Teste gerado com sucesso!");
		} catch (err) {
			console.error("Erro ao gerar teste:", err);
			const message = err.message || "Erro ao gerar teste";
			toast.error(message);
			if (message.toLowerCase().includes("dispositivo") || message.toLowerCase().includes("já gerou")) setBlocked(true);
		} finally {
			setLoading(false);
		}
	};
	const copyToClipboard = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopied(id);
		toast.success("Copiado!");
		setTimeout(() => setCopied(null), 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c] overflow-hidden relative font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md z-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center mb-10 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative group",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative w-20 h-20 bg-black rounded-2xl flex items-center justify-center border border-white/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tv, { className: "w-10 h-10 text-primary drop-shadow-[0_0_8px_var(--primary)]" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]",
								children: ["MAGO PLAYER ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-primary italic",
									children: "PRO"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-primary uppercase tracking-[0.3em] font-bold",
										children: "Acesso Exclusivo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50" })
								]
							})]
						})]
					}),
					!credentials ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: `border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ${blocked ? "opacity-75" : "hover:border-primary/30"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "text-center pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-3xl font-black text-white tracking-tight",
								children: blocked ? "ACESSO NEGADO" : "EXPERIÊNCIA 4K"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
								className: "text-white/60 text-sm font-medium",
								children: blocked ? "Limite de teste por dispositivo atingido." : "Libere agora seu acesso ultra-rápido de forma gratuita."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "space-y-6 pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `p-4 rounded-2xl border transition-all duration-300 ${blocked ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/10 group hover:bg-primary/10"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `p-2 rounded-lg ${blocked ? "bg-destructive/20" : "bg-primary/20 animate-pulse"}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: `w-5 h-5 shrink-0 ${blocked ? "text-destructive" : "text-primary"}` })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "text-xs font-bold text-white uppercase tracking-wider mb-1",
											children: "Status do Sistema"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-white/50 leading-relaxed font-medium",
											children: blocked ? "Detectamos que este aparelho já usufruiu do teste grátis. Para novas assinaturas, contate o suporte oficial." : "Servidores ONLINE. Liberação instantânea de 10.000+ canais, filmes e séries em alta definição."
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "relative group",
									method: "post",
									action: `/teste/${slug}`,
									onSubmit: handleCreateTest,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "hidden",
											name: "slug",
											value: slug
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "hidden",
											name: "fingerprint",
											value: fingerprint
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "hidden",
											name: "referral_code",
											value: referralCode ?? ""
										}),
										!blocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-0.5 pointer-events-none bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											"data-tv-focus": true,
											type: "submit",
											disabled: loading || blocked,
											variant: blocked ? "destructive" : "default",
											className: `relative z-10 w-full h-16 text-xl font-black rounded-2xl transition-all duration-300 transform active:scale-95 ${!blocked ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_var(--primary)]" : ""}`,
											children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "PROCESSANDO..."]
											}) : blocked ? "BLOQUEADO" : "GERAR ACESSO AGORA"
										})
									]
								}),
								!blocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[9px] text-center text-white/30 uppercase tracking-[0.2em] font-bold",
									children: "⚡ LIBERAÇÃO AUTOMÁTICA EM 2 SEGUNDOS"
								})
							]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "border-green-500/20 bg-green-500/[0.02] backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(34,197,94,0.2)] overflow-hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
									className: "pb-2 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
										className: "text-3xl font-black text-green-500 flex items-center justify-center gap-3 tracking-tighter",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-1.5 bg-green-500/20 rounded-full animate-bounce",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-6 w-6" })
										}), "ACESSO ATIVO"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
										className: "text-white/60 font-medium",
										children: "Copie seus dados e comece a assistir agora."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "space-y-5 pt-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[10px] uppercase tracking-[0.2em] text-primary font-black ml-1",
												children: "USUÁRIO"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative group",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "absolute inset-y-0 left-4 flex items-center text-white/30",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														readOnly: true,
														value: credentials.username,
														className: "pl-12 pr-12 h-14 bg-white/[0.03] border-white/10 font-mono text-xl text-white selection:bg-primary/30"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														"data-tv-focus": true,
														type: "button",
														size: "icon",
														variant: "ghost",
														className: "absolute right-2 top-2 h-10 w-10 text-white/50 hover:text-white hover:bg-white/10",
														onClick: () => copyToClipboard(credentials.username, "user"),
														children: copied === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5 text-green-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-5 w-5" })
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[10px] uppercase tracking-[0.2em] text-primary font-black ml-1",
												children: "SENHA"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative group",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "absolute inset-y-0 left-4 flex items-center text-white/30",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "h-5 w-5" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														readOnly: true,
														value: credentials.password,
														className: "pl-12 pr-12 h-14 bg-white/[0.03] border-white/10 font-mono text-xl text-white selection:bg-primary/30"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														"data-tv-focus": true,
														type: "button",
														size: "icon",
														variant: "ghost",
														className: "absolute right-2 top-2 h-10 w-10 text-white/50 hover:text-white hover:bg-white/10",
														onClick: () => copyToClipboard(credentials.password, "pass"),
														children: copied === "pass" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5 text-green-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-5 w-5" })
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white/50 mt-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-2 bg-white/5 rounded-lg",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Expira em: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
												className: "text-white",
												children: new Date(credentials.expiresAt).toLocaleString("pt-BR")
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "pt-6 space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												"data-tv-focus": true,
												className: "w-full h-16 font-black text-lg gap-3 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] transition-transform shadow-[0_0_30px_-5px_var(--primary)]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/",
													search: {
														username: credentials.username,
														password: credentials.password,
														auto: "1"
													},
													children: ["ACESSAR MAGO PLAYER PRO ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-5 w-5" })]
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[9px] text-center text-white/30 uppercase tracking-[0.2em] font-black animate-pulse",
												children: "🚀 REDIRECIONAMENTO COM UM CLIQUE"
											})]
										})
									]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-12 text-center pb-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold",
							children: "© 2026 MAGO PLAYER PRO · TECNOLOGIA DE PONTA"
						})
					})
				]
			})
		]
	});
}
//#endregion
export { TestePublico as component };
