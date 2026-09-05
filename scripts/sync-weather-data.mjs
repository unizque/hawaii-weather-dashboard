import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { strFromU8, unzipSync } from 'fflate';
import { parseAtcfGuidance } from './lib/atcf.mjs';
import { parseKmlFeatures } from './lib/kml.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cachePath = resolve(projectRoot, 'public/data/weather-cache.json');
const NHC_CURRENT_STORMS = 'https://www.nhc.noaa.gov/CurrentStorms.json';
const requestHeaders = {
  Accept: 'application/json, text/plain;q=0.9',
  'User-Agent': 'PacificSignal/0.1 (+https://github.com/unizque/hawaii-weather-dashboard)',
};

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
  if (responseType === 'text') return response.text();
  if (responseType === 'bytes') return new Uint8Array(await response.arrayBuffer());
  return response.json();
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
      forecastAdvisoryUrl: storm.forecastAdvisory?.url ?? null,
      discussionUrl: storm.forecastDiscussion?.url ?? null,
      graphicsUrl: storm.forecastGraphics?.url ?? null,
      windProbabilitiesUrl: storm.windSpeedProbabilities?.url ?? null,
      coneUrl: storm.trackCone?.kmzFile ?? null,
      products: {
        cone: null,
        warnings: null,
        forecast: [],
        guidance: [],
      },
    }))
    .sort((a, b) => b.intensityKt - a.intensityKt);
}

async function fetchKmzFeatures(url, geometryTypes) {
  const bytes = await fetchWithTimeout(url, 'bytes');
  const archive = unzipSync(bytes);
  const filename = Object.keys(archive).find((name) => name.toLowerCase().endsWith('.kml'));
  if (!filename) throw new Error(`${url} contained no KML document`);
  return parseKmlFeatures(strFromU8(archive[filename]), geometryTypes);
}

async function fetchAtcfProducts(stormId) {
  const bytes = await fetchWithTimeout(
    `https://ftp.nhc.noaa.gov/atcf/aid_public/a${stormId.toLowerCase()}.dat.gz`,
    'bytes',
  );
  return parseAtcfGuidance(gunzipSync(bytes).toString('utf8'));
}

async function enrichStorm(storm, source, existingStorm) {
  const [guidanceResult, coneResult, warningsResult] = await Promise.allSettled([
    fetchAtcfProducts(storm.id),
    source.trackCone?.kmzFile
      ? fetchKmzFeatures(source.trackCone.kmzFile, ['Polygon'])
      : Promise.resolve(null),
    source.windWatchesWarnings?.kmzFile
      ? fetchKmzFeatures(source.windWatchesWarnings.kmzFile, ['Polygon', 'LineString'])
      : Promise.resolve(null),
  ]);

  const previous = existingStorm?.products ?? {
    cone: null,
    warnings: null,
    forecast: [],
    guidance: [],
  };
  const guidance = guidanceResult.status === 'fulfilled' ? guidanceResult.value : null;
  const cone = coneResult.status === 'fulfilled' && coneResult.value?.features.length
    ? coneResult.value
    : previous.cone;
  const warnings = warningsResult.status === 'fulfilled' && warningsResult.value?.features.length
    ? warningsResult.value
    : previous.warnings;

  return {
    ...storm,
    products: {
      cone,
      warnings,
      forecast: guidance?.forecast.length ? guidance.forecast : previous.forecast,
      guidance: guidance?.guidance.length ? guidance.guidance : previous.guidance,
    },
  };
}

async function getExistingCache() {
  try {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    return { generatedAt: null, storms: [] };
  }
}

async function sync() {
  const existing = await getExistingCache();
  let storms = existing.storms;
  let generatedAt = existing.generatedAt;

  try {
    const stormSource = await fetchWithTimeout(NHC_CURRENT_STORMS);
    const normalized = normalizeStorms(stormSource);
    storms = await Promise.all(normalized.map((storm) => {
      const source = (stormSource.activeStorms ?? []).find((candidate) => candidate.id === storm.id) ?? {};
      const existingStorm = existing.storms.find((candidate) => candidate.id === storm.id);
      return enrichStorm(storm, source, existingStorm);
    }));
    generatedAt = new Date().toISOString();
    console.log(`Weather cache updated with ${storms.length} Pacific system(s).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`NHC sync unavailable; retained the previous tropical cache. ${message}`);
  }

  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify({ generatedAt, storms }, null, 2)}\n`, 'utf8');
}

await sync();
