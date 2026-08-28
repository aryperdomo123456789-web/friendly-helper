export type EpgProgram = {
  title: string;
  description: string;
  start: string;
  end: string;
  start_timestamp: string;
  stop_timestamp: string;
};

export type IndexedEpgProgram = EpgProgram & {
  id: string;
  startMs: number;
  endMs: number;
};

export type EpgIndex = {
  programs: IndexedEpgProgram[];
  firstStartMs: number | null;
  lastEndMs: number | null;
  currentIndex: number;
};

export type EpgCacheSnapshot = {
  programs: EpgProgram[];
  savedAt: number;
  stale: boolean;
};

export type EpgGridChannel = {
  id: string;
  name: string;
  icon?: string | null;
  programs: EpgProgram[];
};

export type IndexedEpgGridChannel = EpgGridChannel & {
  index: EpgIndex;
};

export type EpgTimeline = {
  startMs: number;
  endMs: number;
  durationMs: number;
};

export type EpgEventPosition = {
  leftPct: number;
  widthPct: number;
  program: IndexedEpgProgram;
};

export type TimelineVirtualWindow = {
  timeline: EpgTimeline;
  offsetPx: number;
  widthPx: number;
  totalWidth: number;
};

export type VirtualWindow = {
  start: number;
  end: number;
  offsetTop: number;
  totalHeight: number;
};

const EPG_DB_NAME = "magoplayerpro-epg";
const EPG_DB_VERSION = 1;
const EPG_STORE = "snapshots";
const EPG_FRESH_MS = 6 * 60 * 60 * 1000;
const EPG_STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PROGRAMS = 10_000;

function parseDateValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }

  const text = String(value).trim();
  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : null;
}

function programStartMs(program: EpgProgram): number | null {
  return (
    parseDateValue(program.start_timestamp) ??
    parseDateValue(program.start) ??
    parseDateValue(program.end)
  );
}

function programEndMs(program: EpgProgram, startMs: number): number {
  const end = parseDateValue(program.stop_timestamp) ?? parseDateValue(program.end);
  return end && end > startMs ? end : startMs + 30 * 60 * 1000;
}

export function normalizeEpgPrograms(programs: EpgProgram[]): IndexedEpgProgram[] {
  return programs
    .slice(0, MAX_PROGRAMS)
    .map((program, sourceIndex) => {
      const startMs = programStartMs(program) ?? sourceIndex;
      const endMs = programEndMs(program, startMs);
      return {
        ...program,
        id: `${startMs}-${endMs}-${sourceIndex}`,
        startMs,
        endMs,
      };
    })
    .sort((left, right) => left.startMs - right.startMs || left.id.localeCompare(right.id));
}

export function buildEpgIndex(programs: EpgProgram[], nowMs = Date.now()): EpgIndex {
  const indexed = normalizeEpgPrograms(programs);
  let currentIndex = indexed.findIndex(
    (program) => program.startMs <= nowMs && nowMs < program.endMs,
  );
  if (currentIndex < 0) {
    currentIndex = indexed.findIndex((program) => program.endMs > nowMs);
  }
  return {
    programs: indexed,
    firstStartMs: indexed[0]?.startMs ?? null,
    lastEndMs: indexed.at(-1)?.endMs ?? null,
    currentIndex: currentIndex < 0 ? 0 : currentIndex,
  };
}

export function buildEpgGridRows(
  channels: EpgGridChannel[],
  nowMs = Date.now(),
): IndexedEpgGridChannel[] {
  return channels
    .filter((channel) => channel.id.trim() && channel.name.trim())
    .map((channel) => ({
      ...channel,
      index: buildEpgIndex(channel.programs, nowMs),
    }));
}

export function filterEpgGridRows(
  rows: IndexedEpgGridChannel[],
  query: string,
): IndexedEpgGridChannel[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => {
    if (row.name.toLocaleLowerCase().includes(needle)) return true;
    return row.index.programs.some((program) => program.title.toLocaleLowerCase().includes(needle));
  });
}

export function getEpgTimeline(nowMs = Date.now(), durationMs = 6 * 60 * 60 * 1000): EpgTimeline {
  const slotMs = 30 * 60 * 1000;
  const startMs = Math.floor(nowMs / slotMs) * slotMs;
  const safeDuration = Math.max(slotMs, durationMs);
  return { startMs, endMs: startMs + safeDuration, durationMs: safeDuration };
}

export function getTimelineVirtualWindow(
  timeline: EpgTimeline,
  scrollLeft: number,
  viewportWidth: number,
  totalWidth = 1_440,
  overscanPx = 240,
): TimelineVirtualWindow {
  const safeTotalWidth = Math.max(1, totalWidth);
  const safeViewportWidth = Math.max(1, Math.min(viewportWidth, safeTotalWidth));
  const maxScrollLeft = Math.max(0, safeTotalWidth - safeViewportWidth);
  const safeScrollLeft = Math.max(0, Math.min(scrollLeft, maxScrollLeft));
  const startPx = Math.max(0, safeScrollLeft - overscanPx);
  const endPx = Math.min(safeTotalWidth, safeScrollLeft + safeViewportWidth + overscanPx);
  const startMs = timeline.startMs + (startPx / safeTotalWidth) * timeline.durationMs;
  const endMs = timeline.startMs + (endPx / safeTotalWidth) * timeline.durationMs;
  return {
    timeline: { startMs, endMs, durationMs: Math.max(1, endMs - startMs) },
    offsetPx: startPx,
    widthPx: Math.max(1, endPx - startPx),
    totalWidth: safeTotalWidth,
  };
}

export function getEpgProgramsInTimeline(
  index: EpgIndex,
  timeline: EpgTimeline,
): IndexedEpgProgram[] {
  let low = 0;
  let high = index.programs.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const program = index.programs[middle];
    if (!program || program.endMs <= timeline.startMs) low = middle + 1;
    else high = middle;
  }
  const programs: IndexedEpgProgram[] = [];
  for (let cursor = low; cursor < index.programs.length; cursor += 1) {
    const program = index.programs[cursor];
    if (!program || program.startMs >= timeline.endMs) break;
    programs.push(program);
  }
  return programs;
}

export function getEpgEventPosition(
  program: IndexedEpgProgram,
  timeline: EpgTimeline,
): EpgEventPosition | null {
  const overlapStart = Math.max(program.startMs, timeline.startMs);
  const overlapEnd = Math.min(program.endMs, timeline.endMs);
  if (overlapEnd <= overlapStart) return null;
  const leftPct = ((overlapStart - timeline.startMs) / timeline.durationMs) * 100;
  const widthPct = ((overlapEnd - overlapStart) / timeline.durationMs) * 100;
  return {
    leftPct: Math.max(0, Math.min(100, leftPct)),
    widthPct: Math.max(1.5, Math.min(100 - leftPct, widthPct)),
    program,
  };
}

export function getVirtualWindow(
  itemCount: number,
  scrollTop: number,
  viewportHeight: number,
  itemHeight = 76,
  overscan = 4,
): VirtualWindow {
  const totalHeight = Math.max(0, itemCount * itemHeight);
  const safeTop = Math.max(0, scrollTop);
  const safeViewport = Math.max(1, viewportHeight);
  const firstVisible = Math.floor(safeTop / itemHeight);
  const visibleCount = Math.ceil(safeViewport / itemHeight);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(itemCount, firstVisible + visibleCount + overscan);
  return {
    start,
    end,
    offsetTop: start * itemHeight,
    totalHeight,
  };
}

function hasIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openEpgDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(EPG_DB_NAME, EPG_DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB indisponível."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EPG_STORE)) {
        db.createObjectStore(EPG_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function cacheKey(userId: string, serverId: string, streamId: string): string {
  return `${userId}:${serverId}:${streamId}`;
}

export async function readEpgSnapshot(
  userId: string,
  serverId: string,
  streamId: string,
): Promise<EpgCacheSnapshot | null> {
  if (!hasIndexedDb()) return null;
  const db = await openEpgDb();
  try {
    const record = await new Promise<{ programs: EpgProgram[]; savedAt: number } | undefined>(
      (resolve, reject) => {
        const request = db
          .transaction(EPG_STORE, "readonly")
          .objectStore(EPG_STORE)
          .get(cacheKey(userId, serverId, streamId));
        request.onerror = () => reject(request.error);
        request.onsuccess = () =>
          resolve(request.result as { programs: EpgProgram[]; savedAt: number } | undefined);
      },
    );
    if (!record || !Array.isArray(record.programs)) return null;
    const age = Math.max(0, Date.now() - record.savedAt);
    if (age > EPG_STALE_MAX_MS) return null;
    return { programs: record.programs, savedAt: record.savedAt, stale: age > EPG_FRESH_MS };
  } finally {
    db.close();
  }
}

export async function writeEpgSnapshot(
  userId: string,
  serverId: string,
  streamId: string,
  programs: EpgProgram[],
): Promise<void> {
  if (!hasIndexedDb()) return;
  const db = await openEpgDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db
        .transaction(EPG_STORE, "readwrite")
        .objectStore(EPG_STORE)
        .put({
          key: cacheKey(userId, serverId, streamId),
          programs: programs.slice(0, MAX_PROGRAMS),
          savedAt: Date.now(),
        });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } finally {
    db.close();
  }
}
