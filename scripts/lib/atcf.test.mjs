import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAtcfGuidance, parseAtcfRecords } from './atcf.mjs';

const fixture = [
  'EP, 12, 2026090418, 03, OFCL,   0, 132N, 1607W, 130, 926',
  'EP, 12, 2026090418, 03, OFCL,  24, 141N, 1640W, 125, 932',
  'EP, 12, 2026090418, 03, AVNO,   0, 132N, 1607W, 130, 926',
  'EP, 12, 2026090418, 03, AVNO,  24, 145N, 1632W, 118, 940',
  'EP, 12, 2026090412, 03, AVNO,  24, 140N, 1620W, 110, 948',
].join('\n');

test('parses ATCF tenths-degree coordinates', () => {
  const [record] = parseAtcfRecords(fixture);
  assert.equal(record.latitude, 13.2);
  assert.equal(record.longitude, -160.7);
});

test('selects the latest official and model guidance cycles', () => {
  const result = parseAtcfGuidance(fixture);
  assert.equal(result.forecast.length, 2);
  assert.equal(result.guidance[0].id, 'gfs');
  assert.equal(result.guidance[0].points[1].longitude, -163.2);
  assert.equal(result.forecast[1].validAt, '2026-09-05T18:00:00.000Z');
});
