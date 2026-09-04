import type { FeedResult, TropicalSystem } from '../types/weather';
import { titleCase } from '../lib/weather';
import { getWeatherCache } from './cache';
import { fetchJson } from './http';

const NHC_CURRENT_STORMS = 'https://www.nhc.noaa.gov/CurrentStorms.json';

interface NhcStormResponse {
  activeStorms?: Array<{
    id: string;
    binNumber?: string;
    name: string;
    classification: string;
    intensity: string;
    pressure: string;
    latitudeNumeric: number;
    longitudeNumeric: number;
    movementDir: number;
    movementSpeed: number;
    lastUpdate: string;
    publicAdvisory?: { advNum?: string; url?: string } | null;
    forecastDiscussion?: { url?: string } | null;
    forecastGraphics?: { url?: string } | null;
  }>;
}

const classificationNames: Record<string, string> = {
  HU: 'Hurricane',
  TS: 'Tropical storm',
  TD: 'Tropical depression',
  ST: 'Subtropical storm',
  SD: 'Subtropical depression',
  PT: 'Post-tropical cyclone',
  DB: 'Disturbance',
};

function normalizeStorms(response: NhcStormResponse): TropicalSystem[] {
  return (response.activeStorms ?? [])
    .filter((storm) => storm.id.toLowerCase().startsWith('ep') || storm.binNumber?.toUpperCase().startsWith('CP'))
    .map((storm) => ({
      id: storm.id,
      name: titleCase(storm.name),
      classification: classificationNames[storm.classification] ?? storm.classification,
      intensityKt: Number(storm.intensity) || 0,
      pressureMb: Number(storm.pressure) || 0,
      latitude: storm.latitudeNumeric,
      longitude: storm.longitudeNumeric,
      movementDirectionDegrees: storm.movementDir,
      movementSpeedKt: storm.movementSpeed,
      advisoryNumber: storm.publicAdvisory?.advNum ?? null,
      updatedAt: storm.lastUpdate,
      advisoryUrl: storm.publicAdvisory?.url ?? null,
      discussionUrl: storm.forecastDiscussion?.url ?? null,
      graphicsUrl: storm.forecastGraphics?.url ?? null,
    }))
    .sort((a, b) => b.intensityKt - a.intensityKt);
}

export async function fetchPacificSystems(signal?: AbortSignal): Promise<FeedResult<TropicalSystem[]>> {
  try {
    const response = await fetchJson<NhcStormResponse>(NHC_CURRENT_STORMS, { signal });
    const storms = normalizeStorms(response);
    return {
      data: storms,
      status: 'live',
      updatedAt: storms[0]?.updatedAt ?? new Date().toISOString(),
    };
  } catch (error: unknown) {
    const cache = await getWeatherCache();
    return {
      data: cache.storms,
      status: cache.storms.length > 0 ? 'cached' : 'unavailable',
      updatedAt: cache.generatedAt,
      error: error instanceof Error ? error.message : 'NHC live feed unavailable',
    };
  }
}
