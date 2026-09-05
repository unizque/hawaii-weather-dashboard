export type RadarMode = 'reflectivity' | 'velocity';

export interface RadarSite {
  id: 'PHKI' | 'PHKM' | 'PHMO' | 'PHWA';
  name: string;
  latitude: number;
  longitude: number;
  serviceUrl: string;
}

export const radarRangeKm = 230;

export const hawaiiReflectivityService = {
  serviceUrl: 'https://opengeo.ncep.noaa.gov/geoserver/hawaii/hawaii_bref_qcd/ows',
  fallbackLayer: 'hawaii_bref_qcd',
};

export const hawaiiRadarSites: RadarSite[] = [
  {
    id: 'PHKI',
    name: 'South Kauaʻi',
    latitude: 21.89389,
    longitude: -159.5525,
    serviceUrl: 'https://opengeo.ncep.noaa.gov/geoserver/phki/ows',
  },
  {
    id: 'PHMO',
    name: 'Molokaʻi',
    latitude: 21.13278,
    longitude: -157.18028,
    serviceUrl: 'https://opengeo.ncep.noaa.gov/geoserver/phmo/ows',
  },
  {
    id: 'PHKM',
    name: 'Kohala',
    latitude: 20.12528,
    longitude: -155.77778,
    serviceUrl: 'https://opengeo.ncep.noaa.gov/geoserver/phkm/ows',
  },
  {
    id: 'PHWA',
    name: 'South Point',
    latitude: 19.095,
    longitude: -155.56889,
    serviceUrl: 'https://opengeo.ncep.noaa.gov/geoserver/phwa/ows',
  },
];
