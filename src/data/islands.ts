import type { IslandDefinition } from '../types/weather';

export const islands: IslandDefinition[] = [
  {
    id: 'kauai',
    name: 'Kauaʻi',
    localName: 'Līhuʻe',
    stationLabel: 'Northwestern district',
    latitude: 21.9742,
    longitude: -159.367,
    accent: '#79e0bf',
  },
  {
    id: 'oahu',
    name: 'Oʻahu',
    localName: 'Honolulu',
    stationLabel: 'Southern shoreline',
    latitude: 21.3069,
    longitude: -157.8583,
    accent: '#53d7e8',
  },
  {
    id: 'molokai',
    name: 'Molokaʻi',
    localName: 'Kaunakakai',
    stationLabel: 'Central district',
    latitude: 21.09,
    longitude: -157.022,
    accent: '#c5e36b',
  },
  {
    id: 'maui',
    name: 'Maui',
    localName: 'Kahului',
    stationLabel: 'Central valley',
    latitude: 20.8893,
    longitude: -156.4729,
    accent: '#f4bd4a',
  },
  {
    id: 'hawaii',
    name: 'Hawaiʻi',
    localName: 'Hilo',
    stationLabel: 'Windward coast',
    latitude: 19.7241,
    longitude: -155.0868,
    accent: '#ff7f67',
  },
];

export const defaultIsland = islands[1]!;
