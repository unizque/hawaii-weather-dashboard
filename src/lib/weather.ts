import type { AlertSeverity } from '../types/weather';

export function celsiusToFahrenheit(value: number): number {
  return Math.round((value * 9) / 5 + 32);
}

export function metersPerSecondToMph(value: number): number {
  return Math.round(value * 2.236_936);
}

export function pascalToMillibar(value: number): number {
  return Math.round(value / 100);
}

export function degreesToCompass(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) return '—';

  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16]!;
}

export function stormCategory(intensityKt: number): string {
  if (intensityKt >= 137) return 'Category 5';
  if (intensityKt >= 113) return 'Category 4';
  if (intensityKt >= 96) return 'Category 3';
  if (intensityKt >= 83) return 'Category 2';
  if (intensityKt >= 64) return 'Category 1';
  if (intensityKt >= 34) return 'Tropical storm';
  return 'Tropical depression';
}

export function severityTone(severity: AlertSeverity): 'danger' | 'warning' | 'watch' | 'info' {
  if (severity === 'Extreme') return 'danger';
  if (severity === 'Severe') return 'warning';
  if (severity === 'Moderate') return 'watch';
  return 'info';
}

export function formatHstTime(value: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Honolulu',
    ...options,
  }).format(date);
}

export function formatAge(value: string | null, now = Date.now()): string {
  if (!value) return 'not yet updated';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'unknown age';

  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
