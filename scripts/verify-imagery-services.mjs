import assert from 'node:assert/strict';
import { hawaiiReflectivityService } from '../src/data/radar.ts';
import { pacificSatelliteService } from '../src/data/satellite.ts';

const githubPagesOrigin = 'https://unizque.github.io';

function assertBrowserAccess(response, label) {
  const allowedOrigin = response.headers.get('access-control-allow-origin');
  assert.ok(
    allowedOrigin === '*' || allowedOrigin === githubPagesOrigin,
    `${label} does not allow requests from GitHub Pages`,
  );
}

function radarCapabilitiesUrl() {
  const url = new URL(hawaiiReflectivityService.serviceUrl);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('version', '1.3.0');
  url.searchParams.set('request', 'GetCapabilities');
  return url;
}

function satelliteCatalogUrl() {
  const url = new URL(`${pacificSatelliteService.serviceUrl}/query`);
  url.searchParams.set('where', '1=1');
  url.searchParams.set('outFields', 'objectid,start_time,end_time');
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('orderByFields', 'end_time DESC');
  url.searchParams.set('resultRecordCount', '40');
  url.searchParams.set('f', 'json');
  return url;
}

function satelliteTimes(payload) {
  return (payload.features ?? [])
    .map(({ attributes = {} }) => attributes.end_time ?? attributes.End_Time)
    .filter((value) => typeof value === 'number' && Number.isFinite(value))
    .sort((a, b) => a - b);
}

function satelliteImageUrl(frameTime) {
  const url = new URL(`${pacificSatelliteService.serviceUrl}/exportImage`);
  url.searchParams.set('bbox', '-20037508,-2504688,-14471533,4865942');
  url.searchParams.set('bboxSR', '3857');
  url.searchParams.set('imageSR', '3857');
  url.searchParams.set('size', '320,220');
  url.searchParams.set('format', 'jpgpng');
  url.searchParams.set('compressionQuality', '76');
  url.searchParams.set('interpolation', 'RSP_BilinearInterpolation');
  url.searchParams.set('transparent', 'false');
  url.searchParams.set('time', String(frameTime));
  url.searchParams.set('f', 'image');
  return url;
}

async function verifyRadar() {
  const response = await fetch(radarCapabilitiesUrl(), {
    headers: { Origin: githubPagesOrigin },
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.ok, true, `Hawaiʻi radar capabilities returned ${response.status}`);
  assertBrowserAccess(response, 'Hawaiʻi radar');

  const capabilities = await response.text();
  const layerName = capabilities.match(/<Name>([^<]*(?:bref_qcd|sr_bref)[^<]*)<\/Name>/i)?.[1];
  const timeDimension = capabilities.match(/<(?:Dimension|Extent)\b[^>]*name=["']time["'][^>]*>([^<]+)</i)?.[1];
  assert.ok(layerName, 'Hawaiʻi radar is missing its reflectivity layer');
  assert.ok(timeDimension?.includes('/') || timeDimension?.includes(','), 'Hawaiʻi radar does not advertise animated history');
  console.log(`Hawaiʻi radar: ${layerName} · animated history available`);
}

async function verifySatellite() {
  const catalogResponse = await fetch(satelliteCatalogUrl(), {
    headers: { Origin: githubPagesOrigin },
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(catalogResponse.ok, true, `GOES satellite catalog returned ${catalogResponse.status}`);
  assertBrowserAccess(catalogResponse, 'GOES satellite catalog');

  const payload = await catalogResponse.json();
  const frames = satelliteTimes(payload);
  assert.ok(frames.length > 1, 'GOES satellite catalog does not contain animated history');

  const latestFrame = frames.at(-1);
  assert.ok(latestFrame, 'GOES satellite catalog is missing its latest frame time');
  const imageResponse = await fetch(satelliteImageUrl(latestFrame), {
    headers: { Origin: githubPagesOrigin },
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(imageResponse.ok, true, `GOES satellite image returned ${imageResponse.status}`);
  // The browser displays this response as an <img>; unlike the JSON catalog fetch,
  // image rendering does not require an Access-Control-Allow-Origin header.
  assert.match(imageResponse.headers.get('content-type') ?? '', /^image\//, 'GOES export did not return an image');
  assert.ok((await imageResponse.arrayBuffer()).byteLength > 1_000, 'GOES export returned an empty image');
  console.log(`GOES satellite: ${frames.length} catalog frames · export image available`);
}

await Promise.all([verifyRadar(), verifySatellite()]);
