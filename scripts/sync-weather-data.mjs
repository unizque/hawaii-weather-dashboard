import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cachePath = resolve(projectRoot, 'public/data/weather-cache.json');
const NHC_CURRENT_STORMS = 'https://www.nhc.noaa.gov/CurrentStorms.json';
const requestHeaders = {
  Accept: 'application/json, text/plain;q=0.9',
  'User-Agent': 'PacificSignal/0.1 (+https://github.com/unizque/hawaii-weather-dashboard)',
};

const stations = [
  { stationId: '51001', name: 'Northwest Hawaiʻi', latitude: 23.445, longitude: -162.279 },
  { stationId: '51002', name: 'Southwest Hawaiʻi', latitude: 17.037, longitude: -157.697 },
  { stationId: '51003', name: 'Western Hawaiʻi', latitude: 19.196, longitude: -160.639 },
  { stationId: '51004', name: 'Southeast Hawaiʻi', latitude: 17.602, longitude: -152.398 },
];

const classificationNames = {
  HU: 'Hurricane',
  TS: 'Tropical storm',
  TD: 'Tropical depression',
  ST: 'Subtropical storm',
  SD: 'Subtropical depression',
  PT: 'Post-tropical cyclone',
  DB: 'Disturbance',
};

async function fetchWithTimeout(url, responseType = 'json') {
  const response = await fetch(url, {
    headers: requestHeaders,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return responseType === 'text' ? response.text() : response.json();
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeStorms(payload) {
  return (payload.activeStorms ?? [])
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

function measurement(value, multiplier = 1) {
  if (!value || value === 'MM') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier * 10) / 10 : null;
}

function parseBuoyReport(text, station) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.find((line) => line.startsWith('#YY'));
  const report = lines.find((line) => !line.startsWith('#'));
  if (!header || !report) throw new Error(`Station ${station.stationId} returned no observations`);

  const columns = header.replace(/^#/, '').trim().split(/\s+/);
  const values = report.trim().split(/\s+/);
  const row = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  const observedAt = new Date(
    Date.UTC(Number(row.YY), Number(row.MM) - 1, Number(row.DD), Number(row.hh), Number(row.mm)),
  ).toISOString();

  return {
    ...station,
    observedAt,
    windSpeedKt: measurement(row.WSPD, 1.94384),
    gustKt: measurement(row.GST, 1.94384),
    waveHeightFt: measurement(row.WVHT, 3.28084),
    dominantPeriodSeconds: measurement(row.DPD),
    pressureMb: measurement(row.PRES),
    waterTemperatureF: row.WTMP === 'MM' ? null : measurement(String((Number(row.WTMP) * 9) / 5 + 32)),
  };
}

async function getExistingCache() {
  try {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    return { generatedAt: null, storms: [], buoys: [] };
  }
}

async function sync() {
  const existing = await getExistingCache();
  const [stormResult, ...buoyResults] = await Promise.allSettled([
    fetchWithTimeout(NHC_CURRENT_STORMS),
    ...stations.map(async (station) => {
      const report = await fetchWithTimeout(
        `https://www.ndbc.noaa.gov/data/realtime2/${station.stationId}.txt`,
        'text',
      );
      return parseBuoyReport(report, station);
    }),
  ]);

  const storms = stormResult.status === 'fulfilled' ? normalizeStorms(stormResult.value) : existing.storms;
  const buoys = buoyResults.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
  const successfulSources = [stormResult, ...buoyResults].filter((result) => result.status === 'fulfilled').length;
  const cache = {
    generatedAt: successfulSources > 0 ? new Date().toISOString() : existing.generatedAt,
    storms,
    buoys: buoys.length > 0 ? buoys : existing.buoys,
  };

  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');

  const failures = [stormResult, ...buoyResults].filter((result) => result.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Weather sync completed with ${failures.length} unavailable source(s); retained cached values.`);
  } else {
    console.log(`Weather cache updated with ${storms.length} Pacific system(s) and ${buoys.length} buoy(s).`);
  }
}

await sync();
