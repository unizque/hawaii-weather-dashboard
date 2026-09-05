import assert from 'node:assert/strict';
import { hawaiiRadarSites, hawaiiReflectivityService } from '../src/data/radar.ts';
import { parseRadarCapabilities } from '../src/lib/radar.ts';

const githubPagesOrigin = 'https://unizque.github.io';

function capabilitiesUrl(serviceUrl) {
  const url = new URL(serviceUrl);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('version', '1.3.0');
  url.searchParams.set('request', 'GetCapabilities');
  return url.toString();
}

async function verifyProduct(label, serviceUrl, mode) {
  const response = await fetch(capabilitiesUrl(serviceUrl), {
    headers: { Origin: githubPagesOrigin },
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.ok, true, `${label} capabilities returned ${response.status}`);

  const allowedOrigin = response.headers.get('access-control-allow-origin');
  assert.ok(
    allowedOrigin === '*' || allowedOrigin === githubPagesOrigin,
    `${label} does not allow requests from GitHub Pages`,
  );

  const capabilities = parseRadarCapabilities(await response.text(), mode);
  assert.ok(capabilities.layerName, `${label} is missing the ${mode} layer`);
  assert.ok(capabilities.frames.length > 1, `${label} does not advertise an animated time dimension`);
  console.log(`${label}: ${capabilities.layerName} · ${capabilities.frames.length} two-hour frames`);
}

await verifyProduct('Hawaiʻi mosaic', hawaiiReflectivityService.serviceUrl, 'reflectivity');
await Promise.all(
  hawaiiRadarSites.map((site) => verifyProduct(`${site.id} ${site.name}`, site.serviceUrl, 'velocity')),
);
