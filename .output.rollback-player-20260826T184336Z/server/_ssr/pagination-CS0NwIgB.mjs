import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { B as Ellipsis, J as ChevronRight, Y as ChevronLeft } from "../_libs/lucide-react.mjs";
import { s as cn } from "./router-DG2Zwgow.mjs";
import { n as buttonVariants } from "./button-ApJKGylB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pagination-CS0NwIgB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SUPPORT_MESSAGE_TYPES = [
	"user_message",
	"support_reply",
	"payment_receipt",
	"payment_event",
	"system_notification",
	"admin_note",
	"closure_prompt",
	"closure_response",
	"thread_closed",
	"satisfaction_prompt",
	"satisfaction_response"
];
var SUPPORT_MESSAGE_META = {
	user_message: {
		label: "Cliente",
		className: "bg-slate-500/15 text-slate-200 border-slate-500/20"
	},
	support_reply: {
		label: "Suporte",
		className: "bg-sky-500/15 text-sky-200 border-sky-500/20"
	},
	payment_receipt: {
		label: "Comprovante",
		className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
	},
	payment_event: {
		label: "Pagamento",
		className: "bg-cyan-500/15 text-cyan-200 border-cyan-500/20"
	},
	system_notification: {
		label: "Sistema",
		className: "bg-amber-500/15 text-amber-200 border-amber-500/20"
	},
	admin_note: {
		label: "Interno",
		className: "bg-violet-500/15 text-violet-200 border-violet-500/20"
	},
	closure_prompt: {
		label: "Encerramento",
		className: "bg-rose-500/15 text-rose-200 border-rose-500/20"
	},
	closure_response: {
		label: "Resposta",
		className: "bg-rose-500/15 text-rose-200 border-rose-500/20"
	},
	thread_closed: {
		label: "Fechado",
		className: "bg-zinc-500/15 text-zinc-200 border-zinc-500/20"
	},
	satisfaction_prompt: {
		label: "Satisfação",
		className: "bg-amber-500/15 text-amber-200 border-amber-500/20"
	},
	satisfaction_response: {
		label: "Avaliação",
		className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
	}
};
function normalizeSupportMessageType(value) {
	if (typeof value === "string" && SUPPORT_MESSAGE_TYPES.includes(value)) return value;
	return "user_message";
}
function inferSupportMessageType(message, threadUserId) {
	const explicitType = normalizeSupportMessageType(message.message_type);
	if (message.message_type && explicitType) return explicitType;
	if (!message.sender_id) return "system_notification";
	return message.sender_id === threadUserId ? "user_message" : "support_reply";
}
function getSupportMessageTypeMeta(type) {
	return SUPPORT_MESSAGE_META[normalizeSupportMessageType(type)] ?? SUPPORT_MESSAGE_META.user_message;
}
var Pagination = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
	role: "navigation",
	"aria-label": "pagination",
	className: cn("mx-auto flex w-full justify-center", className),
	...props
});
Pagination.displayName = "Pagination";
var PaginationContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
	ref,
	className: cn("flex flex-row items-center gap-1", className),
	...props
}));
PaginationContent.displayName = "PaginationContent";
var PaginationItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
	ref,
	className: cn("", className),
	...props
}));
PaginationItem.displayName = "PaginationItem";
var PaginationLink = ({ className, isActive, size = "icon", ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
	"aria-current": isActive ? "page" : void 0,
	className: cn(buttonVariants({
		variant: isActive ? "outline" : "ghost",
		size
	}), className),
	...props
});
PaginationLink.displayName = "PaginationLink";
var PaginationPrevious = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationLink, {
	"aria-label": "Go to previous page",
	size: "default",
	className: cn("gap-1 pl-2.5", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Previous" })]
});
PaginationPrevious.displayName = "PaginationPrevious";
var PaginationNext = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationLink, {
	"aria-label": "Go to next page",
	size: "default",
	className: cn("gap-1 pr-2.5", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Next" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })]
});
PaginationNext.displayName = "PaginationNext";
var PaginationEllipsis = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
	"aria-hidden": true,
	className: cn("flex h-9 w-9 items-center justify-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "sr-only",
		children: "More pages"
	})]
});
PaginationEllipsis.displayName = "PaginationEllipsis";
//#endregion
export { PaginationNext as a, inferSupportMessageType as c, PaginationItem as i, PaginationContent as n, PaginationPrevious as o, PaginationEllipsis as r, getSupportMessageTypeMeta as s, Pagination as t };
