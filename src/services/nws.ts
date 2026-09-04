import type { Geometry } from 'geojson';
import type {
  AlertSeverity,
  CurrentConditions,
  FeedResult,
  ForecastPeriod,
  IslandDefinition,
  WeatherAlert,
} from '../types/weather';
import { celsiusToFahrenheit, degreesToCompass, metersPerSecondToMph, pascalToMillibar } from '../lib/weather';
import { fetchJson } from './http';

const NWS_API = 'https://api.weather.gov';

interface Quantity {
  value: number | null;
  unitCode?: string;
}

interface PointResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
    observationStations: string;
  };
}

interface ForecastResponse {
  properties: {
    updateTime: string;
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
      probabilityOfPrecipitation?: Quantity;
    }>;
  };
}

interface StationCollection {
  features: Array<{
    id: string;
    properties: {
      name: string;
      stationIdentifier: string;
    };
  }>;
}

interface ObservationResponse {
  properties: {
    timestamp: string;
    textDescription: string | null;
    temperature: Quantity;
    heatIndex: Quantity;
    windChill: Quantity;
    relativeHumidity: Quantity;
    windSpeed: Quantity;
    windDirection: Quantity;
    barometricPressure: Quantity;
  };
}

interface AlertCollection {
  features: Array<{
    id: string;
    geometry: Geometry | null;
    properties: {
      event: string;
      headline: string | null;
      severity: string;
      urgency: string;
      areaDesc: string;
      description: string;
      instruction: string | null;
      effective: string;
      expires: string;
      '@id'?: string;
    };
  }>;
}

function finite(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function fahrenheit(value: Quantity | undefined, fallback: number): number {
  if (!value || value.value === null) return fallback;
  return value.unitCode?.endsWith('degF') ? Math.round(value.value) : celsiusToFahrenheit(value.value);
}

function normalizeForecast(response: ForecastResponse): ForecastPeriod[] {
  return response.properties.periods.slice(0, 8).map((period) => ({
    id: period.number,
    name: period.name,
    startTime: period.startTime,
    temperatureF:
      period.temperatureUnit.toUpperCase() === 'F'
        ? Math.round(period.temperature)
        : celsiusToFahrenheit(period.temperature),
    windSpeed: period.windSpeed,
    windDirection: period.windDirection,
    shortForecast: period.shortForecast,
    precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
    isDaytime: period.isDaytime,
  }));
}

export async function fetchIslandWeather(
  island: IslandDefinition,
  signal?: AbortSignal,
): Promise<{
  conditions: FeedResult<CurrentConditions>;
  forecast: FeedResult<ForecastPeriod[]>;
}> {
  const point = await fetchJson<PointResponse>(`${NWS_API}/points/${island.latitude},${island.longitude}`, { signal });
  const [forecastResponse, stationCollection] = await Promise.all([
    fetchJson<ForecastResponse>(point.properties.forecast, { signal }),
    fetchJson<StationCollection>(point.properties.observationStations, { signal }),
  ]);

  const forecast = normalizeForecast(forecastResponse);
  const firstPeriod = forecast[0];
  const station = stationCollection.features[0];

  if (!station) {
    throw new Error(`No observation station was returned for ${island.name}`);
  }

  const observation = await fetchJson<ObservationResponse>(`${station.id}/observations/latest`, { signal });
  const properties = observation.properties;
  const temperatureF = fahrenheit(properties.temperature, firstPeriod?.temperatureF ?? 80);
  const apparentTemperatureF = fahrenheit(
    properties.heatIndex.value !== null ? properties.heatIndex : properties.windChill,
    temperatureF,
  );
  const observedAt = properties.timestamp || forecastResponse.properties.updateTime;

  return {
    conditions: {
      data: {
        temperatureF,
        feelsLikeF: apparentTemperatureF,
        humidityPercent: Math.round(finite(properties.relativeHumidity.value, 0)),
        windSpeedMph: metersPerSecondToMph(finite(properties.windSpeed.value, 0)),
        windDirection: degreesToCompass(properties.windDirection.value),
        pressureMb: pascalToMillibar(finite(properties.barometricPressure.value, 101_300)),
        description: properties.textDescription || firstPeriod?.shortForecast || 'Conditions unavailable',
        observedAt,
        stationName: station.properties.name || station.properties.stationIdentifier,
      },
      status: 'live',
      updatedAt: observedAt,
    },
    forecast: {
      data: forecast,
      status: 'live',
      updatedAt: forecastResponse.properties.updateTime,
    },
  };
}

function normalizeSeverity(value: string): AlertSeverity {
  const allowed: AlertSeverity[] = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
  return allowed.includes(value as AlertSeverity) ? (value as AlertSeverity) : 'Unknown';
}

export async function fetchHawaiiAlerts(signal?: AbortSignal): Promise<FeedResult<WeatherAlert[]>> {
  const response = await fetchJson<AlertCollection>(`${NWS_API}/alerts/active?area=HI`, { signal });
  const alerts = response.features
    .map((feature) => ({
      id: feature.id,
      event: feature.properties.event,
      headline: feature.properties.headline || feature.properties.event,
      severity: normalizeSeverity(feature.properties.severity),
      urgency: feature.properties.urgency,
      areaDescription: feature.properties.areaDesc,
      description: feature.properties.description,
      instruction: feature.properties.instruction,
      effectiveAt: feature.properties.effective,
      expiresAt: feature.properties.expires,
      geometry: feature.geometry,
      sourceUrl: feature.properties['@id'] ?? null,
    }))
    .sort((a, b) => {
      const rank: Record<AlertSeverity, number> = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
      return rank[a.severity] - rank[b.severity];
    });

  return {
    data: alerts,
    status: 'live',
    updatedAt: new Date().toISOString(),
  };
}
