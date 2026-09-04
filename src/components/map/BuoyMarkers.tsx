import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import type { BuoyReading } from '../../types/weather';
import { formatAge } from '../../lib/weather';

function value(reading: number | null, unit: string): string {
  return reading === null ? 'Not reported' : `${reading} ${unit}`;
}

export function BuoyMarkers({ buoys }: { buoys: BuoyReading[] }) {
  return buoys.map((buoy) => (
    <CircleMarker
      key={buoy.stationId}
      center={[buoy.latitude, buoy.longitude]}
      radius={5}
      pathOptions={{
        color: '#ffffff',
        fillColor: '#16789f',
        fillOpacity: 0.95,
        weight: 2,
      }}
    >
      <Tooltip direction="top" offset={[0, -6]}>
        Buoy {buoy.stationId} · {value(buoy.waveHeightFt, 'ft')}
      </Tooltip>
      <Popup>
        <strong>NOAA Buoy {buoy.stationId}</strong>
        <br />
        {buoy.name}
        <br />
        Waves: {value(buoy.waveHeightFt, 'ft')} · Wind: {value(buoy.windSpeedKt, 'kt')}
        <br />
        Water: {value(buoy.waterTemperatureF, '°F')} · {formatAge(buoy.observedAt)}
      </Popup>
    </CircleMarker>
  ));
}
