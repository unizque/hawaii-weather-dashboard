import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKmlFeatures } from './kml.mjs';

const fixture = `<?xml version="1.0"?>
<kml><Document><Placemark><name>Forecast cone</name><description><![CDATA[Official product]]></description>
<Polygon><outerBoundaryIs><LinearRing><coordinates>-160,20,0 -159,20,0 -159,21,0 -160,20,0</coordinates></LinearRing></outerBoundaryIs></Polygon>
</Placemark></Document></kml>`;

test('converts KML polygon placemarks into GeoJSON', () => {
  const result = parseKmlFeatures(fixture, ['Polygon']);
  assert.equal(result.features.length, 1);
  assert.equal(result.features[0].properties.name, 'Forecast cone');
  assert.equal(result.features[0].geometry.type, 'Polygon');
  assert.deepEqual(result.features[0].geometry.coordinates[0][0], [-160, 20]);
});
