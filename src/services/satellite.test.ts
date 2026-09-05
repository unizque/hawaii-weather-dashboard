import { describe, expect, it } from 'vitest';
import { parseSatelliteCatalog, satelliteImageUrl } from './satellite';

describe('NOAA satellite service', () => {
  it('reduces a rolling catalog to the latest two hours', () => {
    const start = Date.parse('2026-09-04T20:00:00Z');
    const features = Array.from({ length: 19 }, (_, index) => ({
      attributes: { end_time: start + index * 10 * 60 * 1_000 },
    }));
    const frames = parseSatelliteCatalog({ features });

    expect(frames).toHaveLength(13);
    expect(frames[0]).toBe('2026-09-04T21:00:00.000Z');
    expect(frames.at(-1)).toBe('2026-09-04T23:00:00.000Z');
  });

  it('builds a projected, time-specific export request', () => {
    const url = new URL(satelliteImageUrl({
      bbox: '-18000000,1000000,-12000000,5000000',
      width: 900,
      height: 600,
      frameTime: '2026-09-04T23:00:00.000Z',
    }));

    expect(url.pathname).toContain('MERGEDGC_Last_24hr/ImageServer/exportImage');
    expect(url.searchParams.get('bboxSR')).toBe('3857');
    expect(url.searchParams.get('time')).toBe(String(Date.parse('2026-09-04T23:00:00.000Z')));
  });
});
