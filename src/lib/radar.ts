import type { RadarMode, RadarSite } from '../data/radar';

const earthRadiusKm = 6_371;
const twoHoursMs = 2 * 60 * 60 * 1_000;
const maximumFrames = 13;

export interface RadarCapabilities {
  layerName: string | null;
  frames: string[];
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function durationMilliseconds(value: string): number | null {
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!match) return null;

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const milliseconds = (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1_000;
  return milliseconds > 0 ? milliseconds : null;
}

function expandTimeToken(value: string): number[] {
  const parts = value.split('/');
  if (parts.length !== 3) {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? [] : [timestamp];
  }

  const start = Date.parse(parts[0] ?? '');
  const end = Date.parse(parts[1] ?? '');
  const interval = durationMilliseconds(parts[2] ?? '');
  if (Number.isNaN(start) || Number.isNaN(end) || interval === null || start > end) return [];

  const timestamps: number[] = [];
  for (let timestamp = start; timestamp <= end && timestamps.length < 2_000; timestamp += interval) {
    timestamps.push(timestamp);
  }
  return timestamps;
}

function sampleRecentFrames(timestamps: number[]): string[] {
  const unique = [...new Set(timestamps)].sort((a, b) => a - b);
  const latest = unique.at(-1);
  if (latest === undefined) return [];

  const recent = unique.filter((timestamp) => timestamp >= latest - twoHoursMs);
  if (recent.length <= maximumFrames) return recent.map((timestamp) => new Date(timestamp).toISOString());

  const sampled = Array.from({ length: maximumFrames }, (_, index) => {
    const target = latest - twoHoursMs + (twoHoursMs * index) / (maximumFrames - 1);
    return recent.reduce((nearest, timestamp) =>
      Math.abs(timestamp - target) < Math.abs(nearest - target) ? timestamp : nearest,
    recent[0]!);
  });

  return [...new Set(sampled)].map((timestamp) => new Date(timestamp).toISOString());
}

function layerNames(xml: string): string[] {
  return [...xml.matchAll(/<(?:[A-Za-z0-9_-]+:)?Name>([^<]+)<\/(?:[A-Za-z0-9_-]+:)?Name>/gi)]
    .map((match) => decodeXml(match[1] ?? ''))
    .filter(Boolean);
}

function timeValues(xml: string): number[] {
  const dimensions = [
    ...xml.matchAll(
      /<(?:[A-Za-z0-9_-]+:)?(?:Dimension|Extent)\b[^>]*\bname=["']time["'][^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?(?:Dimension|Extent)>/gi,
    ),
  ];

  return dimensions.flatMap((match) =>
    decodeXml(match[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .split(',')
      .flatMap((token) => expandTimeToken(token.trim())),
  );
}

export function parseRadarCapabilities(xml: string, mode: RadarMode): RadarCapabilities {
  const names = layerNames(xml);
  const layerName = names.find((name) => {
    const normalized = name.toLowerCase();
    return mode === 'velocity'
      ? normalized.includes('sr_bvel')
      : normalized.includes('bref_qcd') || normalized.includes('sr_bref');
  }) ?? null;

  return {
    layerName,
    frames: sampleRecentFrames(timeValues(xml)),
  };
}

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceKilometers(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
): number {
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function nearestRadarSite(
  target: { latitude: number; longitude: number },
  sites: RadarSite[],
): { site: RadarSite; distanceKm: number } | null {
  return sites.reduce<{ site: RadarSite; distanceKm: number } | null>((nearest, site) => {
    const distanceKm = distanceKilometers(target, site);
    return nearest === null || distanceKm < nearest.distanceKm ? { site, distanceKm } : nearest;
  }, null);
}
