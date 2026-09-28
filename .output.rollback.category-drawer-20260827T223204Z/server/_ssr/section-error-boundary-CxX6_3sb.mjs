import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as TriangleAlert } from "../_libs/lucide-react.mjs";
import { c as reportLovableError } from "./router-DN7yiIe9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/section-error-boundary-CxX6_3sb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SectionErrorBoundary = class extends import_react.Component {
	state = {
		hasError: false,
		error: null
	};
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	componentDidCatch(error, errorInfo) {
		reportLovableError(error, {
			boundary: "section_error_boundary",
			title: this.props.title,
			description: this.props.description,
			componentStack: errorInfo.componentStack
		});
	}
	componentDidUpdate(prevProps) {
		if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) this.setState({
			hasError: false,
			error: null
		});
	}
	handleReset = () => {
		this.setState({
			hasError: false,
			error: null
		});
	};
	render() {
		if (this.state.hasError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: this.props.className,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl shadow-black/30",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }), "Seção indisponível"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-4 text-xl font-black text-white",
						children: this.props.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-neutral-400",
						children: this.props.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 rounded-2xl border border-white/10 bg-black/30 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs uppercase tracking-widest text-neutral-500",
							children: "Detalhe técnico"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 whitespace-pre-wrap break-words text-sm text-neutral-200",
							children: this.state.error?.message || "Erro sem mensagem disponível."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: this.handleReset,
							className: "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700",
							children: "Tentar novamente"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => window.location.reload(),
							className: "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10",
							children: "Recarregar página"
						})]
					})
				]
			})
		});
		return this.props.children;
	}
};
//#endregion
export { SectionErrorBoundary as t };
