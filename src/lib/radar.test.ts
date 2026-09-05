import { describe, expect, it } from 'vitest';
import { parseRadarCapabilities } from './radar';

const capabilities = `<?xml version="1.0"?>
<WMS_Capabilities><Capability><Layer>
  <Layer><Name>hawaii_bref_qcd</Name></Layer>
  <Dimension name="time" units="ISO8601">2026-09-04T20:00:00Z/2026-09-04T23:00:00Z/PT10M</Dimension>
</Layer></Capability></WMS_Capabilities>`;

describe('radar capabilities', () => {
  it('selects reflectivity and limits playback to two hours', () => {
    const result = parseRadarCapabilities(capabilities);
    expect(result.layerName).toBe('hawaii_bref_qcd');
    expect(result.frames).toHaveLength(13);
    expect(result.frames[0]).toBe('2026-09-04T21:00:00.000Z');
    expect(result.frames.at(-1)).toBe('2026-09-04T23:00:00.000Z');
  });

  it('returns a safe empty result for malformed capabilities', () => {
    expect(parseRadarCapabilities('<xml />')).toEqual({ layerName: null, frames: [] });
  });
});
