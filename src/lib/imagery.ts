const defaultWindowMs = 2 * 60 * 60 * 1_000;
const defaultMaximumFrames = 13;

export function sampleRecentFrames(
  timestamps: number[],
  windowMs = defaultWindowMs,
  maximumFrames = defaultMaximumFrames,
): string[] {
  const unique = [...new Set(timestamps.filter(Number.isFinite))].sort((a, b) => a - b);
  const latest = unique.at(-1);
  if (latest === undefined) return [];

  const recent = unique.filter((timestamp) => timestamp >= latest - windowMs);
  if (recent.length <= maximumFrames) return recent.map((timestamp) => new Date(timestamp).toISOString());

  const sampled = Array.from({ length: maximumFrames }, (_, index) => {
    const target = latest - windowMs + (windowMs * index) / (maximumFrames - 1);
    return recent.reduce((nearest, timestamp) =>
      Math.abs(timestamp - target) < Math.abs(nearest - target) ? timestamp : nearest,
    recent[0]!);
  });

  return [...new Set(sampled)].map((timestamp) => new Date(timestamp).toISOString());
}
