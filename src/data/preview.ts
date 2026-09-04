import type { CurrentConditions, ForecastPeriod, IslandDefinition } from '../types/weather';

const islandOffsets: Record<IslandDefinition['id'], number> = {
  kauai: -1,
  oahu: 1,
  molokai: 0,
  maui: 2,
  hawaii: -2,
};

export function createPreviewConditions(island: IslandDefinition): CurrentConditions {
  const temperatureF = 80 + islandOffsets[island.id];

  return {
    temperatureF,
    feelsLikeF: temperatureF + 3,
    humidityPercent: 68,
    windSpeedMph: 14,
    windDirection: 'ENE',
    pressureMb: 1015,
    description: 'Partly cloudy with passing windward showers',
    observedAt: new Date().toISOString(),
    stationName: `${island.localName} design preview`,
  };
}

export function createPreviewForecast(island: IslandDefinition): ForecastPeriod[] {
  const labels = ['Now', 'Tonight', 'Saturday', 'Saturday Night', 'Sunday', 'Sunday Night'];
  const summaries = [
    'Mostly Sunny',
    'Windward Showers',
    'Breezy',
    'Scattered Showers',
    'Mostly Sunny',
    'Partly Cloudy',
  ];
  const base = 81 + islandOffsets[island.id];

  return labels.map((name, index) => ({
    id: index,
    name,
    startTime: new Date(Date.now() + index * 12 * 60 * 60 * 1_000).toISOString(),
    temperatureF: index % 2 === 0 ? base + (index === 2 ? 1 : 0) : base - 8,
    windSpeed: index < 3 ? '12 to 18 mph' : '8 to 14 mph',
    windDirection: 'ENE',
    shortForecast: summaries[index]!,
    precipitationChance: index % 2 === 0 ? 20 : 40,
    isDaytime: index % 2 === 0,
  }));
}
