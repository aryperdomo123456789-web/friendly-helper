import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MAGO_RUNTIME_CLEAR_EVENT,
  MAGO_RUNTIME_ERROR_EVENT,
  type CapturedRuntimeErrorDetail,
} from "@/lib/error-capture";

type RuntimeErrorItem = CapturedRuntimeErrorDetail & {
  headline: string;
};

const MAX_ITEMS = 5;
const MAX_ITEM_AGE_MS = 2 * 60 * 1000;
const PRUNE_INTERVAL_MS = 5_000;
const ORIGIN_ORDER: Array<CapturedRuntimeErrorDetail["origin"]> = ["server", "worker", "client", "unknown"];
const ORIGIN_LABELS: Record<CapturedRuntimeErrorDetail["origin"], string> = {
  server: "Server",
  worker: "Worker",
  client: "Cliente",
  unknown: "Outro",
};

function getHeadline(summary: string) {
  return summary.split("\n").find((line) => line.trim())?.trim() || "Erro sem detalhes";
}

function getOriginTone(origin: CapturedRuntimeErrorDetail["origin"]) {
  if (origin === "worker") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  if (origin === "server") return "border-sky-500/20 bg-sky-500/10 text-sky-200";
  if (origin === "client") return "border-violet-500/20 bg-violet-500/10 text-violet-200";
  return "border-white/10 bg-white/5 text-neutral-300";
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export function RuntimeErrorMonitor() {
  const [items, setItems] = useState<RuntimeErrorItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeOrigin, setActiveOrigin] = useState<"all" | CapturedRuntimeErrorDetail["origin"]>("all");

  useEffect(() => {
    const handleCapturedError = (event: Event) => {
      const detail = (event as CustomEvent<CapturedRuntimeErrorDetail>).detail;
      if (!detail?.id) return;
      if (Date.now() - detail.at > MAX_ITEM_AGE_MS) return;

      setItems((current) => {
        if (current.some((item) => item.id === detail.id)) return current;
        const nextItem = {
          ...detail,
          headline: getHeadline(detail.summary),
        };
        return [nextItem, ...current].slice(0, MAX_ITEMS);
      });
      setOpen(true);
    };

    const handleClear = () => {
      setItems([]);
      setOpen(false);
    };

    window.addEventListener(MAGO_RUNTIME_ERROR_EVENT, handleCapturedError as EventListener);
    window.addEventListener(MAGO_RUNTIME_CLEAR_EVENT, handleClear);

    const pruneTimer = window.setInterval(() => {
      setItems((current) => {
        const now = Date.now();
        const next = current.filter((item) => now - item.at <= MAX_ITEM_AGE_MS);
        if (next.length === current.length) return current;
        if (next.length === 0) setOpen(false);
        return next;
      });
    }, PRUNE_INTERVAL_MS);

    window.dispatchEvent(new Event(MAGO_RUNTIME_CLEAR_EVENT));

    return () => {
      window.removeEventListener(MAGO_RUNTIME_ERROR_EVENT, handleCapturedError as EventListener);
      window.removeEventListener(MAGO_RUNTIME_CLEAR_EVENT, handleClear);
      window.clearInterval(pruneTimer);
    };
  }, []);

  const visibleItems = useMemo(() => {
    const filtered = activeOrigin === "all" ? items : items.filter((item) => item.origin === activeOrigin);
    return filtered.slice(0, MAX_ITEMS);
  }, [activeOrigin, items]);

  const groupedItems = useMemo(() => {
    if (activeOrigin !== "all") {
      return [{ origin: activeOrigin, items: visibleItems }];
    }

    return ORIGIN_ORDER.map((origin) => ({
      origin,
      items: items.filter((item) => item.origin === origin).slice(0, MAX_ITEMS),
    })).filter((group) => group.items.length > 0);
  }, [activeOrigin, items, visibleItems]);

  const latest = visibleItems[0] ?? items[0];

  if (!latest) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(27rem,calc(100vw-1rem))]">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-red-500/20 bg-[#101010]/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-[0.99] opacity-95",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-2.5 border-b border-white/8 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
          aria-expanded={open}
          aria-label="Alternar monitor de erros recentes"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-200">
              <AlertTriangle size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-white">Erro novo detectado</span>
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">
                  {visibleItems.length}
                </span>
              </div>
              <p className="truncate text-[11px] leading-4 text-neutral-400">{latest.headline}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {formatTime(latest.at)}
            </span>
            {open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </div>
        </button>

        {open ? (
          <div className="p-2.5">
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">Monitor leve</div>
                <p className="text-[12px] leading-5 text-neutral-300">
                  Só aparece quando um erro realmente novo entra no fluxo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItems([])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <X size={13} />
                Limpar
              </button>
            </div>

            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {(["all", ...ORIGIN_ORDER] as const).map((origin) => {
                const count = origin === "all" ? items.length : items.filter((item) => item.origin === origin).length;
                return (
                  <button
                    key={origin}
                    type="button"
                    onClick={() => setActiveOrigin(origin)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                      activeOrigin === origin
                        ? "border-white/15 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10",
                    )}
                  >
                    <span>{origin === "all" ? "Todos" : ORIGIN_LABELS[origin]}</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-neutral-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <ScrollArea className="max-h-56 pr-2">
              <div className="space-y-2.5">
                {groupedItems.map((group) => (
                  <section key={group.origin} className="space-y-1.5">
                    {activeOrigin === "all" ? (
                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]", getOriginTone(group.origin))}>
                            {ORIGIN_LABELS[group.origin]}
                          </span>
                          <span className="text-[11px] text-neutral-500">{group.items.length} alerta(s)</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-2.5">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]", getOriginTone(item.origin))}>
                                  {ORIGIN_LABELS[item.origin]}
                                </span>
                                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-red-200">
                                  {item.mechanism}
                                </span>
                                <span className="text-[11px] text-neutral-500">{formatTime(item.at)}</span>
                              </div>
                              <p className="mt-1.5 text-[13px] font-medium leading-5 text-white">{item.headline}</p>
                            </div>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-300">
                              novo
                            </span>
                          </div>
                          {item.summary !== item.headline ? (
                            <details className="mt-1.5">
                              <summary className="cursor-pointer list-none text-[11px] text-neutral-400 transition-colors hover:text-neutral-200">
                                Ver detalhe técnico
                              </summary>
                              <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/8 bg-black/30 p-2.5 text-[11px] leading-5 text-neutral-200">
                                {item.summary}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </div>
    </div>
  );
}
