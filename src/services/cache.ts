import type { WeatherCache } from '../types/weather';
import { fetchJson } from './http';

let weatherCachePromise: Promise<WeatherCache> | null = null;

export function getWeatherCache(): Promise<WeatherCache> {
  if (!weatherCachePromise) {
    const cacheUrl = new URL(`${import.meta.env.BASE_URL}data/weather-cache.json`, window.location.href).toString();
    weatherCachePromise = fetchJson<WeatherCache>(cacheUrl).catch((error: unknown) => {
      weatherCachePromise = null;
      throw error;
    });
  }

  return weatherCachePromise;
}
