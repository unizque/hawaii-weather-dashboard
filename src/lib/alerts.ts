import type { WeatherAlert } from '../types/weather';

export function officialAlertPage(alert: WeatherAlert): string {
  if (alert.sourceUrl && !alert.sourceUrl.includes('api.weather.gov')) return alert.sourceUrl;

  const url = new URL('https://forecast.weather.gov/wwamap/wwatxtget.php');
  url.searchParams.set('cwa', 'HFO');
  url.searchParams.set('wwa', alert.event);
  return url.toString();
}
