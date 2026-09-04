import type { WeatherCache } from '../types/weather';
import { fetchJson } from './http';

let weatherCachePromise: Promise<WeatherCache> | null = null;

export function getWeatherCache(): Promise<WeatherCache> {
  if (!weatherCachePromise) {
    const cacheUrl = new URL(`${import.meta.env.BASE_URL}data/weather-cache.json`, window.location.href).toString();
    const requestUrl = new URL(cacheUrl);
    requestUrl.searchParams.set('v', String(Date.now()));
    weatherCachePromise = fetchJson<WeatherCache>(requestUrl.toString()).catch((error: unknown) => {
      weatherCachePromise = null;
      throw error;
    });
  }

  return weatherCachePromise;
}

export function clearWeatherCache(): void {
  weatherCachePromise = null;
}
