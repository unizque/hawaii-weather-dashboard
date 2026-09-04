import type { BuoyReading, FeedResult } from '../types/weather';
import { getWeatherCache } from './cache';

export async function fetchCachedBuoys(): Promise<FeedResult<BuoyReading[]>> {
  try {
    const cache = await getWeatherCache();
    return {
      data: cache.buoys,
      status: cache.buoys.length > 0 ? 'cached' : 'unavailable',
      updatedAt: cache.generatedAt,
    };
  } catch (error: unknown) {
    return {
      data: [],
      status: 'unavailable',
      updatedAt: null,
      error: error instanceof Error ? error.message : 'Buoy cache unavailable',
    };
  }
}
