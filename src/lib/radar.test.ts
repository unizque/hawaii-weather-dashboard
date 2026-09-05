import { describe, expect, it } from 'vitest';
import { hawaiiRadarSites } from '../data/radar';
import { distanceKilometers, nearestRadarSite, parseRadarCapabilities } from './radar';

const capabilities = `<?xml version="1.0"?>
<WMS_Capabilities><Capability><Layer>
  <Layer><Name>phmo_sr_bvel</Name></Layer>
  <Dimension name="time" units="ISO8601">2026-09-04T20:00:00Z/2026-09-04T23:00:00Z/PT10M</Dimension>
</Layer></Capability></WMS_Capabilities>`;

describe('radar utilities', () => {
  it('selects the velocity layer and limits the loop to two hours', () => {
    const result = parseRadarCapabilities(capabilities, 'velocity');
    expect(result.layerName).toBe('phmo_sr_bvel');
    expect(result.frames).toHaveLength(13);
    expect(result.frames[0]).toBe('2026-09-04T21:00:00.000Z');
    expect(result.frames.at(-1)).toBe('2026-09-04T23:00:00.000Z');
  });

  it('finds the closest Hawaiʻi radar', () => {
    const nearest = nearestRadarSite({ latitude: 21.3, longitude: -157.85 }, hawaiiRadarSites);
    expect(nearest?.site.id).toBe('PHMO');
    expect(nearest?.distanceKm).toBeLessThan(100);
  });

  it('calculates great-circle distance', () => {
    expect(distanceKilometers(
      { latitude: 21.89389, longitude: -159.5525 },
      { latitude: 21.89389, longitude: -159.5525 },
    )).toBe(0);
  });
});
