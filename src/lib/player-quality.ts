export type PlayerQualityOption = {
  index: number;
  label: string;
  height?: number;
  bitrate?: number;
};

const MAX_QUALITY_OPTIONS = 12;
const MAX_HEIGHT = 8_640;
const MAX_BITRATE = 1_000_000_000;

function safeNumber(value: unknown, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.min(maximum, Math.round(value))
    : undefined;
}

export function normalizePlayerQualityOptions(levels: unknown[]): PlayerQualityOption[] {
  return levels
    .slice(0, MAX_QUALITY_OPTIONS)
    .map((rawLevel, index) => {
      const level = rawLevel as { height?: unknown; bitrate?: unknown };
      const height = safeNumber(level?.height, MAX_HEIGHT);
      const bitrate = safeNumber(level?.bitrate, MAX_BITRATE);
      const label = height
        ? `${height}p`
        : bitrate
          ? `${Math.round(bitrate / 1000)} kbps`
          : `Nível ${index + 1}`;
      return {
        index,
        label,
        ...(height !== undefined ? { height } : {}),
        ...(bitrate !== undefined ? { bitrate } : {}),
      };
    })
    .filter((option) => option.height !== undefined || option.bitrate !== undefined);
}

export function qualityChangeDetails(options: PlayerQualityOption[], index: number) {
  if (index < 0) return { reason: "auto" };
  const selected = options.find((option) => option.index === index);
  if (!selected) return { reason: "invalid_quality_selection" };
  return {
    level: selected.index,
    ...(selected.bitrate !== undefined ? { bitrate: selected.bitrate } : {}),
    reason: "manual",
  };
}
