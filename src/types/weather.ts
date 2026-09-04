import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

export type IslandId = 'kauai' | 'oahu' | 'molokai' | 'maui' | 'hawaii';

export type FeedStatus = 'loading' | 'live' | 'cached' | 'preview' | 'unavailable';

export interface IslandDefinition {
  id: IslandId;
  name: string;
  localName: string;
  stationLabel: string;
  latitude: number;
  longitude: number;
  accent: string;
}

export interface CurrentConditions {
  temperatureF: number;
  feelsLikeF: number;
  humidityPercent: number;
  windSpeedMph: number;
  windDirection: string;
  pressureMb: number;
  description: string;
  observedAt: string;
  stationName: string;
}

export interface ForecastPeriod {
  id: number;
  name: string;
  startTime: string;
  temperatureF: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  precipitationChance: number | null;
  isDaytime: boolean;
}

export type AlertSeverity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  severity: AlertSeverity;
  urgency: string;
  areaDescription: string;
  description: string;
  instruction: string | null;
  effectiveAt: string;
  expiresAt: string;
  geometry: Geometry | null;
  sourceUrl: string | null;
}

export interface TropicalSystem {
  id: string;
  name: string;
  classification: string;
  intensityKt: number;
  pressureMb: number;
  latitude: number;
  longitude: number;
  movementDirectionDegrees: number;
  movementSpeedKt: number;
  advisoryNumber: string | null;
  updatedAt: string;
  advisoryUrl: string | null;
  forecastAdvisoryUrl: string | null;
  discussionUrl: string | null;
  graphicsUrl: string | null;
  windProbabilitiesUrl: string | null;
  coneUrl: string | null;
  products: TropicalProducts;
}

export interface TropicalForecastPoint {
  tauHours: number;
  validAt: string;
  latitude: number;
  longitude: number;
  intensityKt: number | null;
  pressureMb: number | null;
}

export type GuidanceKind = 'consensus' | 'global' | 'hurricane';

export interface ModelGuidanceTrack {
  id: string;
  name: string;
  kind: GuidanceKind;
  initializedAt: string;
  points: TropicalForecastPoint[];
}

export interface TropicalProducts {
  cone: FeatureCollection<Geometry, GeoJsonProperties> | null;
  warnings: FeatureCollection<Geometry, GeoJsonProperties> | null;
  forecast: TropicalForecastPoint[];
  guidance: ModelGuidanceTrack[];
}

export interface BuoyReading {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  windSpeedKt: number | null;
  gustKt: number | null;
  waveHeightFt: number | null;
  dominantPeriodSeconds: number | null;
  pressureMb: number | null;
  waterTemperatureF: number | null;
}

export interface FeedResult<T> {
  data: T;
  status: FeedStatus;
  updatedAt: string | null;
  error?: string;
}

export interface WeatherCache {
  generatedAt: string | null;
  storms: TropicalSystem[];
  buoys: BuoyReading[];
}
