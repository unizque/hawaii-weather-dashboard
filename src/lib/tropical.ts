import type { GuidanceKind } from '../types/weather';

export const modelColors: Record<string, string> = {
  consensus: '#6c4ccf',
  gfs: '#1976b9',
  ecmwf: '#d04c45',
  hafsa: '#178264',
  hafsb: '#d08322',
  ukmet: '#8f579f',
  cmc: '#65753a',
};

export const guidanceKindLabels: Record<GuidanceKind, string> = {
  consensus: 'Consensus aid',
  global: 'Global model',
  hurricane: 'Hurricane model',
};

export function knotsToMph(knots: number): number {
  return Math.round(knots * 1.150_779);
}

export type ForecastIntensityCode = 'D' | 'S' | 'H' | 'M' | '?';
export type StormIntensityTone = 'depression' | 'storm' | 'hurricane' | 'major';

export function forecastIntensityCode(intensityKt: number | null): ForecastIntensityCode {
  if (intensityKt === null) return '?';
  if (intensityKt < 34) return 'D';
  if (intensityKt < 64) return 'S';
  if (intensityKt < 96) return 'H';
  return 'M';
}

export function stormIntensityTone(intensityKt: number): StormIntensityTone {
  if (intensityKt < 34) return 'depression';
  if (intensityKt < 64) return 'storm';
  if (intensityKt < 96) return 'hurricane';
  return 'major';
}

export function warningColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('hurricane warning')) return '#cf2148';
  if (normalized.includes('hurricane watch')) return '#ef6b35';
  if (normalized.includes('tropical storm warning')) return '#1b73b3';
  if (normalized.includes('tropical storm watch')) return '#e7ad27';
  return '#c66b35';
}
