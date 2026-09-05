import type { IslandDefinition } from '../types/weather';

export const islands: IslandDefinition[] = [
  {
    id: 'kauai',
    name: 'Kauaʻi',
    localName: 'Līhuʻe',
    stationLabel: 'Northwestern district',
    latitude: 21.9742,
    longitude: -159.367,
    accent: '#4f8f78',
  },
  {
    id: 'oahu',
    name: 'Oʻahu',
    localName: 'Honolulu',
    stationLabel: 'Southern shoreline',
    latitude: 21.3069,
    longitude: -157.8583,
    accent: '#277fa5',
  },
  {
    id: 'molokai',
    name: 'Molokaʻi',
    localName: 'Kaunakakai',
    stationLabel: 'Central district',
    latitude: 21.09,
    longitude: -157.022,
    accent: '#7c9d55',
  },
  {
    id: 'maui',
    name: 'Maui',
    localName: 'Kahului',
    stationLabel: 'Central valley',
    latitude: 20.8893,
    longitude: -156.4729,
    accent: '#d69c39',
  },
  {
    id: 'hawaii',
    name: 'Hawaiʻi',
    localName: 'Hilo',
    stationLabel: 'Windward coast',
    latitude: 19.7241,
    longitude: -155.0868,
    accent: '#d9634e',
  },
];

export const defaultIsland = islands[1]!;
