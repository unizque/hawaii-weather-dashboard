import { describe, expect, it } from 'vitest';
import { celsiusToFahrenheit, degreesToCompass, formatAge, stormCategory } from './weather';

describe('weather utilities', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(26.7)).toBe(80);
  });

  it('normalizes compass headings', () => {
    expect(degreesToCompass(0)).toBe('N');
    expect(degreesToCompass(225)).toBe('SW');
    expect(degreesToCompass(370)).toBe('N');
    expect(degreesToCompass(null)).toBe('—');
  });

  it('uses Saffir-Simpson thresholds expressed in knots', () => {
    expect(stormCategory(33)).toBe('Tropical depression');
    expect(stormCategory(63)).toBe('Tropical storm');
    expect(stormCategory(64)).toBe('Category 1');
    expect(stormCategory(130)).toBe('Category 4');
  });

  it('formats feed age compactly', () => {
    const now = Date.parse('2026-09-04T22:00:00Z');
    expect(formatAge('2026-09-04T21:45:00Z', now)).toBe('15m ago');
    expect(formatAge('2026-09-02T22:00:00Z', now)).toBe('2d ago');
  });
});
