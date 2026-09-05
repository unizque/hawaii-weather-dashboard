import type { RadarCapabilities } from '../lib/radar';
import { parseRadarCapabilities } from '../lib/radar';

function capabilitiesUrl(serviceUrl: string): string {
  const url = new URL(serviceUrl);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('version', '1.3.0');
  url.searchParams.set('request', 'GetCapabilities');
  return url.toString();
}

export async function fetchRadarSource(serviceUrl: string, signal: AbortSignal): Promise<RadarCapabilities> {
  const response = await fetch(capabilitiesUrl(serviceUrl), { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Radar service returned ${response.status}`);
  return parseRadarCapabilities(await response.text());
}
