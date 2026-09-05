import { describe, expect, it } from 'vitest';
import { forecastIntensityCode, stormIntensityTone } from './tropical';

describe('tropical intensity markers', () => {
  it.each([
    [25, 'D'],
    [34, 'S'],
    [63, 'S'],
    [64, 'H'],
    [95, 'H'],
    [96, 'M'],
    [140, 'M'],
  ] as const)('labels %i kt as %s', (intensity, code) => {
    expect(forecastIntensityCode(intensity)).toBe(code);
  });

  it('uses an unknown marker when forecast intensity is absent', () => {
    expect(forecastIntensityCode(null)).toBe('?');
  });

  it('keeps marker colors aligned with the intensity label', () => {
    expect(stormIntensityTone(30)).toBe('depression');
    expect(stormIntensityTone(45)).toBe('storm');
    expect(stormIntensityTone(80)).toBe('hurricane');
    expect(stormIntensityTone(115)).toBe('major');
  });
});
