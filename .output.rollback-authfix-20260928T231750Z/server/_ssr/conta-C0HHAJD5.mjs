import { i as __toESM } from "../_runtime.mjs";
import { c as createServerFn } from "./createServerFn-BsVP-4Ld.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-B5qtjxOb.mjs";
import { i as literalType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useServerFn } from "./utils-DtOh-j_S.mjs";
import { t as supabase } from "./client-JHW31y48.mjs";
import { t as createSsrRpc } from "./createSsrRpc-QgkA-uyW.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-Ci1re0b-.mjs";
import { t as Button } from "./button-Cc2FfzGQ.mjs";
import { $ as Check, A as LoaderCircle, G as Copy, U as Crown, W as CreditCard, j as Link, s as UserCog } from "../_libs/lucide-react.mjs";
import { t as UserPageShell } from "./user-page-shell-Ebz1S9H2.mjs";
import { t as createPaymentPreference } from "./payments.functions-D77RDJvi.mjs";
import { a as CardHeader, i as CardFooter, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-BPsoe_yP.mjs";
import { t as Label } from "./label-DgGsacGb.mjs";
import { t as Badge } from "./badge-BXGiyo--.mjs";
import { t as copyToClipboard } from "./clipboard-CZDYJKX1.mjs";
import { t as ptBR, u as format } from "../_libs/date-fns.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/conta-C0HHAJD5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getMyAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("5066297d56e7d337c91702997c269ac30924387d613a1b2d901701e9e5bf61e4"));
var updateMyAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	username: stringType().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline"),
	display_name: stringType().trim().max(120).optional(),
	current_password: stringType().min(1).max(72),
	new_password: stringType().min(6).max(72).optional().or(literalType(""))
}).parse(input)).handler(createSsrRpc("6befa777ce5321d7bd83d12f6110229d28c5f24fae2fab7dfe08b6aa5f3c4391"));
var simulatePaymentSuccess = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	planId: stringType().uuid()
}).parse(input)).handler(createSsrRpc("99b9c86fe2af14a39edf0f32fb21884bf61aae520d8743896d7711ee942c5b1a"));
function ContaPage() {
	const fetchAccount = useServerFn(getMyAccount);
	const saveAccount = useServerFn(updateMyAccount);
	const mpPreference = useServerFn(createPaymentPreference);
	const runSimulation = useServerFn(simulatePaymentSuccess);
	const account = useQuery({
		queryKey: ["my-account"],
		queryFn: () => fetchAccount()
	});
	const [username, setUsername] = (0, import_react.useState)("");
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [currentPassword, setCurrentPassword] = (0, import_react.useState)("");
	const [newPassword, setNewPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [planLoading, setPlanLoading] = (0, import_react.useState)(null);
	const initializedAccountId = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!account.data?.userId) return;
		if (initializedAccountId.current === account.data.userId) return;
		initializedAccountId.current = account.data.userId;
		setUsername(account.data.username);
		setDisplayName(account.data.display_name ?? "");
	}, [account.data]);
	const handleSubmit = async (event) => {
		event.preventDefault();
		if (newPassword && newPassword !== confirmPassword) {
			toast.error("A nova senha e a confirmação não são iguais");
			return;
		}
		setLoading(true);
		try {
			const result = await saveAccount({ data: {
				username,
				display_name: displayName,
				current_password: currentPassword,
				new_password: newPassword
			} });
			await supabase.auth.signInWithPassword({
				email: `${result.username}@iptv.local`,
				password: newPassword || currentPassword
			});
			toast.success("Dados de acesso atualizados com sucesso!");
			setUsername(result.username);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			account.refetch();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao atualizar conta");
		} finally {
			setLoading(false);
		}
	};
	const handleUpgrade = async (planId) => {
		setPlanLoading(planId);
		try {
			const result = await mpPreference({ data: { planId } });
			if (result.simulate_success) {
				toast.info("Modo de teste: simulando ativação sem Mercado Pago...");
				if (!account.data?.userId) throw new Error("Conta não carregada para simulação");
				await runSimulation({ data: {
					userId: account.data.userId,
					planId
				} });
				toast.success("Plano ativado e bônus processado, quando aplicável!");
				account.refetch();
				return;
			}
			if (result.init_point) window.location.href = result.init_point;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
		} finally {
			setPlanLoading(null);
		}
	};
	typeof window !== "undefined" && account.data?.referral_code && `${window.location.origin}${account.data.referral_code}`;
	const [copyingLink, setCopyingLink] = (0, import_react.useState)(null);
	const [copyNotice, setCopyNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!copyNotice) return;
		const timer = window.setTimeout(() => setCopyNotice(null), 2200);
		return () => window.clearTimeout(timer);
	}, [copyNotice]);
	if (account.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-64 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	const currentPlan = account.data?.plan;
	const isOwner = account.data?.isOwner;
	const ownerReferralLinks = isOwner ? account.data?.ownerTestLinks ?? [] : [];
	const publicReferralLinks = account.data?.testLinks ?? [];
	const availablePlans = (account.data?.availablePlans || []).filter((plan) => {
		const isTestPlan = plan.name.toLowerCase().includes("teste") || Number(plan.price) === 0;
		const isMyPlan = currentPlan?.id === plan.id;
		if (isTestPlan && !isMyPlan && !isOwner) return false;
		return true;
	});
	const expiresDate = account.data?.expires_at ? new Date(account.data.expires_at) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UserPageShell, {
		className: "mx-auto max-w-4xl pb-20",
		title: "Minha Conta",
		description: "",
		icon: UserCog,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 md:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "md:col-span-1 border-primary/20 bg-primary/5 overflow-hidden relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute top-0 right-0 p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-8 w-8 text-primary/20 rotate-12" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xl font-bold flex items-center gap-2",
							children: "Meu plano"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Status da sua assinatura" })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-3xl font-black uppercase text-primary tracking-tighter",
									children: currentPlan?.name || "Sem Plano"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "outline",
									className: "w-fit mt-1 border-primary/30 text-[10px] font-bold uppercase",
									children: [account.data?.max_connections, " Conexão(ões)"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[10px] uppercase font-bold text-muted-foreground tracking-widest",
									children: "Vencimento"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: expiresDate ? format(expiresDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Vitalício / Sem limite"
								})]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "md:col-span-2 border-primary/10 bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "text-xl font-bold flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "h-5 w-5 text-primary" }), " Programa de indicação"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Indique amigos e ganhe dias extras ou descontos." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-6",
						children: [!account.data?.referral_code ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg bg-muted/50 p-6 text-center border border-dashed",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground uppercase font-bold tracking-widest",
								children: "Seu link de indicação será liberado após assinar um plano válido."
							})
						}) : publicReferralLinks.length === 0 && ownerReferralLinks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg bg-muted/50 p-6 text-center border border-dashed",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground uppercase font-bold tracking-widest",
								children: "Nenhum link de indicação disponível no momento."
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-6",
							children: [isOwner && ownerReferralLinks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-black uppercase tracking-[0.3em] text-primary",
										children: "Link exclusivo do dono"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-[9px] uppercase font-bold",
										children: "Somente o dono"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4",
									children: ownerReferralLinks.map((link) => {
										const fullUrl = `${window.location.origin}/teste/${link.slug}?ref=${account.data?.referral_code}`;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 p-4 rounded-xl border border-primary/10 bg-primary/5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] uppercase font-black tracking-widest text-primary",
													children: link.description || `Link: ${link.slug}`
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "outline",
														className: "text-[9px] uppercase font-bold border-primary/30",
														children: "Ativo"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "outline",
														className: "text-[9px] uppercase font-bold border-online/30 text-online",
														children: "Sem Bloqueio"
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													readOnly: true,
													value: fullUrl,
													className: "bg-background font-mono text-[10px] h-8"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													size: "icon",
													type: "button",
													disabled: copyingLink === link.slug,
													onClick: async () => {
														setCopyingLink(link.slug);
														if (await copyToClipboard(fullUrl)) {
															toast.success("Link de indicação copiado!");
															setCopyNotice("Link de indicação copiado!");
														} else {
															toast.error("Não foi possível copiar o link.");
															setCopyNotice("Não foi possível copiar o link.");
														}
														setCopyingLink((current) => current === link.slug ? null : current);
													},
													variant: "secondary",
													className: "h-8 w-8",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
												})]
											})]
										}, link.slug);
									})
								})]
							}), publicReferralLinks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-black uppercase tracking-[0.3em] text-primary/80",
									children: "Links públicos"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4",
									children: publicReferralLinks.map((link) => {
										const fullUrl = `${window.location.origin}/teste/${link.slug}?ref=${account.data?.referral_code}`;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 p-4 rounded-xl border border-primary/10 bg-primary/5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] uppercase font-black tracking-widest text-primary",
													children: link.description || `Link: ${link.slug}`
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[9px] uppercase font-bold border-primary/30",
													children: "Ativo"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													readOnly: true,
													value: fullUrl,
													className: "bg-background font-mono text-[10px] h-8"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													size: "icon",
													type: "button",
													disabled: copyingLink === link.slug,
													onClick: async () => {
														setCopyingLink(link.slug);
														if (await copyToClipboard(fullUrl)) {
															toast.success("Link de indicação copiado!");
															setCopyNotice("Link de indicação copiado!");
														} else {
															toast.error("Não foi possível copiar o link.");
															setCopyNotice("Não foi possível copiar o link.");
														}
														setCopyingLink((current) => current === link.slug ? null : current);
													},
													variant: "secondary",
													className: "h-8 w-8",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
												})]
											})]
										}, link.slug);
									})
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg bg-primary/10 p-4 border border-primary/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-primary leading-relaxed",
								children: "Cada novo usuário que assinar através de qualquer um dos seus links gera benefícios automáticos na sua conta."
							})
						})]
					})]
				})]
			}),
			copyNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed bottom-6 right-6 z-[80] animate-in fade-in slide-in-from-bottom-4 duration-300",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-primary/30 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-bold text-foreground",
							children: copyNotice
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: "Pronto, o link já está na área de transferência."
						})] })]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "text-2xl font-black tracking-tighter uppercase italic text-primary flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-6 w-6" }), " Planos disponíveis"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: availablePlans.map((plan) => {
						const isCurrent = currentPlan?.id === plan.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: cn("relative flex flex-col border-primary/10 transition-all hover:border-primary/40", isCurrent && "border-primary bg-primary/5 ring-1 ring-primary"),
							children: [
								isCurrent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: "absolute -top-2 -right-2 bg-primary text-primary-foreground font-black italic uppercase text-[10px]",
									children: "Atual"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
									className: "text-lg font-bold uppercase tracking-tighter",
									children: plan.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
									plan.duration_value,
									" ",
									plan.duration_unit === "minutes" ? "minutos" : plan.duration_unit === "hours" ? "horas" : "dias",
									" de acesso"
								] })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "flex-1 space-y-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-bold",
											children: "R$"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-3xl font-black tracking-tighter",
											children: Number(plan.price).toFixed(2)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "flex items-center gap-2 text-xs font-medium",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-primary" }),
													" ",
													plan.max_connections,
													" Conexão(ões) Simultâneas"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "flex items-center gap-2 text-xs font-medium",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-primary" }), " Canais, Filmes e Séries 4K"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "flex items-center gap-2 text-xs font-medium",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-primary" }), " Suporte Prioritário 24h"]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full font-black uppercase italic tracking-widest",
									variant: isCurrent ? "outline" : "default",
									disabled: isCurrent || !!planLoading,
									onClick: () => handleUpgrade(plan.id),
									children: planLoading === plan.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : isCurrent ? "Plano ativo" : "Assinar agora"
								}) })
							]
						}, plan.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-primary/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCog, { className: "h-6 w-6 text-primary" }), " Segurança da conta"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Gerencie seu usuário e altere sua senha de acesso." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-6 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "conta-username",
									className: "text-xs uppercase font-bold tracking-widest",
									children: "Usuário de acesso"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "conta-username",
									name: "account_username",
									autoComplete: "off",
									value: username,
									onChange: (e) => setUsername(e.target.value),
									className: "bg-muted/30",
									required: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "conta-display",
									className: "text-xs uppercase font-bold tracking-widest",
									children: "Nome de exibição"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "conta-display",
									name: "account_display_name",
									autoComplete: "off",
									value: displayName,
									onChange: (e) => setDisplayName(e.target.value),
									placeholder: "Seu nome no sistema",
									className: "bg-muted/30"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px bg-border my-2" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "conta-current",
									className: "text-xs uppercase font-bold tracking-widest text-primary",
									children: "Senha atual"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "conta-current",
									type: "password",
									name: "account_current_password",
									autoComplete: "current-password",
									value: currentPassword,
									onChange: (e) => setCurrentPassword(e.target.value),
									className: "bg-muted/30",
									placeholder: "Obrigatório para salvar alterações",
									required: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-6 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "conta-new",
										className: "text-xs uppercase font-bold tracking-widest",
										children: "Nova senha"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "conta-new",
										type: "password",
										name: "account_new_password",
										autoComplete: "new-password",
										value: newPassword,
										onChange: (e) => setNewPassword(e.target.value),
										className: "bg-muted/30",
										placeholder: "Mínimo de 6 caracteres"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "conta-confirm",
										className: "text-xs uppercase font-bold tracking-widest",
										children: "Confirmar nova senha"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "conta-confirm",
										type: "password",
										name: "account_confirm_password",
										autoComplete: "new-password",
										value: confirmPassword,
										onChange: (e) => setConfirmPassword(e.target.value),
										className: "bg-muted/30"
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							className: "w-full font-black uppercase italic tracking-widest h-12 text-lg shadow-lg shadow-primary/20",
							disabled: loading,
							children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }) : null, "Atualizar Meus Dados"]
						})
					]
				}) })]
			})
		]
	});
}
function cn(...inputs) {
	return inputs.filter(Boolean).join(" ");
}
//#endregion
export { ContaPage as component };
