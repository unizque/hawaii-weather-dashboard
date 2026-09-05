import { describe, expect, it } from 'vitest';
import { officialAlertPage } from './alerts';
import type { WeatherAlert } from '../types/weather';

const alert: WeatherAlert = {
  id: 'urn:oid:test',
  event: 'High Surf Advisory',
  headline: 'High surf along exposed shores',
  severity: 'Minor',
  urgency: 'Expected',
  areaDescription: 'Kauaʻi and Oʻahu',
  description: 'Large breaking waves are expected.',
  instruction: 'Stay away from exposed shorelines.',
  effectiveAt: '2026-09-04T20:00:00Z',
  expiresAt: '2026-09-05T04:00:00Z',
  geometry: null,
  sourceUrl: 'https://api.weather.gov/alerts/urn:oid:test',
};

describe('alert links', () => {
  it('builds a readable official NWS product page for API alerts', () => {
    expect(officialAlertPage(alert)).toBe(
      'https://forecast.weather.gov/wwamap/wwatxtget.php?cwa=HFO&wwa=High+Surf+Advisory',
    );
  });

  it('keeps a direct non-API source URL', () => {
    expect(officialAlertPage({ ...alert, sourceUrl: 'https://www.weather.gov/hfo/' })).toBe('https://www.weather.gov/hfo/');
  });
});
