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
