import { TileLayer, WMSTileLayer } from 'react-leaflet';

const NWS_HAWAII_RADAR_WMS =
  'https://opengeo.ncep.noaa.gov/geoserver/hawaii/hawaii_bref_qcd/ows';

export function BaseMapLayers({ radarEnabled }: { radarEnabled: boolean }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        updateWhenIdle
        keepBuffer={1}
      />
      {radarEnabled && (
        <WMSTileLayer
          attribution="Radar: NOAA / National Weather Service"
          url={NWS_HAWAII_RADAR_WMS}
          params={{
            layers: 'hawaii_bref_qcd',
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
          }}
          opacity={0.68}
          zIndex={280}
          updateWhenIdle
          keepBuffer={1}
        />
      )}
    </>
  );
}
