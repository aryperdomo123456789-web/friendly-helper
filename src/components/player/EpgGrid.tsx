import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildEpgGridRows,
  filterEpgGridRows,
  getEpgEventPosition,
  getEpgProgramsInTimeline,
  getEpgTimeline,
  getTimelineVirtualWindow,
  getVirtualWindow,
  type EpgGridChannel,
  type IndexedEpgGridChannel,
} from "@/lib/epg-client";

type EpgGridProps = {
  rows: EpgGridChannel[];
  loading?: boolean;
  onSelectChannel?: (channelId: string) => void;
};

const ROW_HEIGHT = 112;
const HEADER_HEIGHT = 38;
const LABEL_WIDTH = 176;
const TIMELINE_WIDTH = 1_440;
const TIMELINE_HOURS = 6;

function formatSlot(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VisibleEpgRow({
  row,
  timeline,
  timelineOffset,
  timelineWidth,
  onSelectChannel,
}: {
  row: IndexedEpgGridChannel;
  timeline: ReturnType<typeof getEpgTimeline>;
  timelineOffset: number;
  timelineWidth: number;
  onSelectChannel?: (channelId: string) => void;
}) {
  const visibleEvents = getEpgProgramsInTimeline(row.index, timeline)
    .map((program) => getEpgEventPosition(program, timeline))
    .filter((event): event is NonNullable<typeof event> => event !== null);

  return (
    <div className="flex h-[112px] border-b border-border/50 bg-card/30">
      <button
        type="button"
        className="sticky left-0 z-10 flex h-full w-[176px] shrink-0 items-start gap-2 border-r border-border/60 bg-card px-3 py-3 text-left transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        onClick={() => onSelectChannel?.(row.id)}
        title={`Abrir ${row.name}`}
      >
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-foreground">{row.name}</span>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {row.index.programs.length} evento(s)
          </span>
        </span>
      </button>
      <div
        className="relative h-full shrink-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:120px_100%]"
        style={{ width: TIMELINE_WIDTH }}
      >
        <div className="absolute inset-y-0" style={{ left: timelineOffset, width: timelineWidth }}>
          {visibleEvents.map(({ leftPct, widthPct, program }) => (
            <button
              key={program.id}
              type="button"
              className={cn(
                "absolute inset-y-2 overflow-hidden rounded-md border px-2 text-left text-[10px] shadow-sm transition hover:z-10 hover:scale-[1.01] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                program.startMs <= Date.now() && Date.now() < program.endMs
                  ? "border-primary/70 bg-primary/20 text-primary"
                  : "border-border/70 bg-secondary/70 text-foreground",
              )}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              onClick={() => onSelectChannel?.(row.id)}
              title={`${row.name}: ${program.title}`}
              aria-label={`${row.name}: ${program.title}`}
            >
              <span className="block truncate font-semibold">{program.title}</span>
              <span className="mt-1 block truncate text-[9px] opacity-70">
                {formatSlot(program.startMs)} – {formatSlot(program.endMs)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EpgGrid({ rows, loading = false, onSelectChannel }: EpgGridProps) {
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(640);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateWidth) : null;
    observer?.observe(viewport);
    return () => observer?.disconnect();
  }, []);

  const indexedRows = useMemo(() => buildEpgGridRows(rows), [rows]);
  const rowsWithPrograms = useMemo(
    () => indexedRows.filter((row) => row.index.programs.length > 0),
    [indexedRows],
  );
  const visibleRows = useMemo(
    () => filterEpgGridRows(rowsWithPrograms, query),
    [query, rowsWithPrograms],
  );
  const timeline = useMemo(() => getEpgTimeline(), []);
  const rowWindow = useMemo(
    () =>
      getVirtualWindow(
        visibleRows.length,
        Math.max(0, scrollTop - HEADER_HEIGHT),
        280,
        ROW_HEIGHT,
        2,
      ),
    [scrollTop, visibleRows.length],
  );
  const timelineWindow = useMemo(
    () =>
      getTimelineVirtualWindow(
        timeline,
        scrollLeft,
        Math.max(320, viewportWidth - LABEL_WIDTH),
        TIMELINE_WIDTH,
        240,
      ),
    [scrollLeft, timeline, viewportWidth],
  );
  const slots = useMemo(
    () =>
      Array.from({ length: TIMELINE_HOURS * 2 + 1 }, (_, index) => {
        const timestamp = timeline.startMs + index * 30 * 60 * 1000;
        return {
          timestamp,
          left: (index / (TIMELINE_HOURS * 2)) * 100,
        };
      }),
    [timeline],
  );

  if (loading && (rows.length === 0 || rowsWithPrograms.length === 0)) {
    return (
      <section className="rounded-xl border border-border/70 bg-card/40 p-4 text-xs text-muted-foreground">
        Carregando programação dos canais...
      </section>
    );
  }
  if (!loading && visibleRows.length === 0) return null;

  return (
    <section className="space-y-2 rounded-xl border border-border/70 bg-card/40 p-2 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Guia EPG multi-canal</h2>
            <p className="text-[10px] text-muted-foreground">
              {visibleRows.length} canais · janela de {TIMELINE_HOURS} horas
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-[210px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar canal ou programa..."
            aria-label="Buscar na grade EPG"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <div
        ref={viewportRef}
        className="wp-scroll max-h-[328px] min-h-[160px] overflow-auto rounded-lg border border-border/60 bg-background/40"
        onScroll={(event) => {
          const target = event.currentTarget;
          setScrollTop(target.scrollTop);
          setScrollLeft(target.scrollLeft);
          setViewportWidth(target.clientWidth);
        }}
        aria-label="Grade EPG virtualizada"
        role="grid"
      >
        {loading && rowsWithPrograms.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
            Carregando programação...
          </div>
        ) : (
          <div
            className="relative min-w-[1616px]"
            style={{
              width: LABEL_WIDTH + TIMELINE_WIDTH,
              height: HEADER_HEIGHT + rowWindow.totalHeight,
            }}
          >
            <div className="sticky top-0 z-20 flex h-[38px] border-b border-border/70 bg-card/95 backdrop-blur">
              <div className="sticky left-0 z-30 flex w-[176px] shrink-0 items-center border-r border-border/70 bg-card/95 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Canais
              </div>
              <div className="relative h-full shrink-0" style={{ width: TIMELINE_WIDTH }}>
                {slots.map((slot) => (
                  <span
                    key={slot.timestamp}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-muted-foreground first:translate-x-0 last:-translate-x-full"
                    style={{ left: `${slot.left}%` }}
                  >
                    {formatSlot(slot.timestamp)}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="absolute left-0 right-0 top-[38px]"
              style={{ height: rowWindow.totalHeight }}
            >
              <div style={{ transform: `translateY(${rowWindow.offsetTop}px)` }}>
                {visibleRows.slice(rowWindow.start, rowWindow.end).map((row) => (
                  <VisibleEpgRow
                    key={row.id}
                    row={row}
                    timeline={timelineWindow.timeline}
                    timelineOffset={timelineWindow.offsetPx}
                    timelineWidth={timelineWindow.widthPx}
                    {...(onSelectChannel ? { onSelectChannel } : {})}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
