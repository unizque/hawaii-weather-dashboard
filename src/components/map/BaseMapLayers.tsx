import { TileLayer } from 'react-leaflet';
import { SmoothWmsLayer } from './SmoothWmsLayer';

export interface RadarLayerOptions {
  enabled: boolean;
  serviceUrl: string;
  layerName: string | null;
  frameTime: string | null;
}

export function BaseMapLayers({ radar }: { radar?: RadarLayerOptions }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        updateWhenIdle
        keepBuffer={1}
      />
      {radar?.enabled && radar.layerName && (
        <SmoothWmsLayer
          serviceUrl={radar.serviceUrl}
          layerName={radar.layerName}
          frameTime={radar.frameTime}
        />
      )}
    </>
  );
}
