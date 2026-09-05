import { TileLayer, WMSTileLayer } from 'react-leaflet';
import type { WMSParams } from 'leaflet';
import type { RadarMode } from '../../data/radar';

export interface RadarLayerOptions {
  enabled: boolean;
  serviceUrl: string;
  layerName: string | null;
  frameTime: string | null;
  mode: RadarMode;
}

export function BaseMapLayers({ radar }: { radar: RadarLayerOptions }) {
  const radarParams: (WMSParams & { time?: string }) | null = radar.layerName ? {
    layers: radar.layerName,
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    ...(radar.frameTime ? { time: radar.frameTime } : {}),
  } : null;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        updateWhenIdle
        keepBuffer={1}
      />
      {radar.enabled && radar.layerName && radarParams && (
        <WMSTileLayer
          key={`${radar.serviceUrl}-${radar.layerName}`}
          attribution="Radar: NOAA / National Weather Service"
          url={radar.serviceUrl}
          params={radarParams}
          opacity={radar.mode === 'velocity' ? 0.76 : 0.68}
          zIndex={280}
          updateWhenIdle
          keepBuffer={1}
        />
      )}
    </>
  );
}
