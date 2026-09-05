import { pacificSatelliteService } from '../data/satellite';
import { sampleRecentFrames } from '../lib/imagery';

interface SatelliteCatalogResponse {
  features?: Array<{
    attributes?: Record<string, unknown>;
  }>;
  error?: { message?: string };
}

export interface SatelliteImageRequest {
  bbox: string;
  width: number;
  height: number;
  frameTime: string | null;
}

function timestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseSatelliteCatalog(payload: SatelliteCatalogResponse): string[] {
  const times = (payload.features ?? []).flatMap(({ attributes = {} }) => {
    const value = attributes.end_time
      ?? attributes.End_Time
      ?? attributes.start_time
      ?? attributes.Start_Time;
    const parsed = timestamp(value);
    return parsed === null ? [] : [parsed];
  });
  return sampleRecentFrames(times);
}

function catalogUrl(): string {
  const url = new URL(`${pacificSatelliteService.serviceUrl}/query`);
  url.searchParams.set('where', '1=1');
  url.searchParams.set('outFields', 'objectid,start_time,end_time');
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('orderByFields', 'end_time DESC');
  url.searchParams.set('resultRecordCount', '40');
  url.searchParams.set('f', 'json');
  return url.toString();
}

export async function fetchSatelliteFrames(signal: AbortSignal): Promise<{ frames: string[] }> {
  const response = await fetch(catalogUrl(), { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Satellite catalog returned ${response.status}`);
  const payload = await response.json() as SatelliteCatalogResponse;
  if (payload.error) throw new Error(payload.error.message ?? 'Satellite catalog is unavailable.');
  return { frames: parseSatelliteCatalog(payload) };
}

export function satelliteImageUrl({ bbox, width, height, frameTime }: SatelliteImageRequest): string {
  const url = new URL(`${pacificSatelliteService.serviceUrl}/exportImage`);
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('bboxSR', '3857');
  url.searchParams.set('imageSR', '3857');
  url.searchParams.set('size', `${width},${height}`);
  url.searchParams.set('format', 'jpgpng');
  url.searchParams.set('compressionQuality', '76');
  url.searchParams.set('interpolation', 'RSP_BilinearInterpolation');
  url.searchParams.set('transparent', 'false');
  if (frameTime) url.searchParams.set('time', String(Date.parse(frameTime)));
  url.searchParams.set('f', 'image');
  return url.toString();
}
