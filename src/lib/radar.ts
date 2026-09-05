import { sampleRecentFrames } from './imagery';

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

export function parseRadarCapabilities(xml: string): RadarCapabilities {
  const layerName = layerNames(xml).find((name) => {
    const normalized = name.toLowerCase();
    return normalized.includes('bref_qcd') || normalized.includes('sr_bref');
  }) ?? null;

  return {
    layerName,
    frames: sampleRecentFrames(timeValues(xml)),
  };
}
