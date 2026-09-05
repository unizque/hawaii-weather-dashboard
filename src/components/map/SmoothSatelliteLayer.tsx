import { useEffect, useMemo, useState } from 'react';
import type { LatLngBoundsExpression, Map as LeafletMap } from 'leaflet';
import { ImageOverlay, Pane, useMap, useMapEvents } from 'react-leaflet';
import { satelliteImageUrl } from '../../services/satellite';

interface SmoothSatelliteLayerProps {
  frameTime: string | null;
  opacity?: number;
}

interface SatelliteViewport {
  bbox: string;
  bounds: LatLngBoundsExpression;
  width: number;
  height: number;
  signature: string;
}

interface SatelliteRequest {
  key: string;
  url: string;
  bounds: LatLngBoundsExpression;
}

function captureViewport(map: LeafletMap): SatelliteViewport {
  const bounds = map.getBounds();
  const southWest = map.options.crs.project(bounds.getSouthWest());
  const northEast = map.options.crs.project(bounds.getNorthEast());
  const size = map.getSize();
  const pixelRatio = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 1.35);
  const width = Math.max(320, Math.min(1_400, Math.round(size.x * pixelRatio)));
  const height = Math.max(240, Math.min(950, Math.round(size.y * pixelRatio)));
  const bbox = [southWest.x, southWest.y, northEast.x, northEast.y]
    .map((value) => value.toFixed(2))
    .join(',');

  return {
    bbox,
    bounds: [
      [bounds.getSouth(), bounds.getWest()],
      [bounds.getNorth(), bounds.getEast()],
    ],
    width,
    height,
    signature: `${bbox}:${width}x${height}`,
  };
}

export function SmoothSatelliteLayer({ frameTime, opacity = 0.66 }: SmoothSatelliteLayerProps) {
  const map = useMap();
  const [viewport, setViewport] = useState(() => captureViewport(map));

  const updateViewport = () => {
    const next = captureViewport(map);
    setViewport((current) => current.signature === next.signature ? current : next);
  };

  useMapEvents({
    moveend: updateViewport,
    resize: updateViewport,
  });

  const desiredRequest = useMemo<SatelliteRequest>(() => {
    const frameKey = frameTime ?? 'current';
    return {
      key: `${frameKey}:${viewport.signature}`,
      bounds: viewport.bounds,
      url: satelliteImageUrl({
        bbox: viewport.bbox,
        width: viewport.width,
        height: viewport.height,
        frameTime,
      }),
    };
  }, [frameTime, viewport]);

  const [displayedRequest, setDisplayedRequest] = useState(desiredRequest);
  const [incomingRequest, setIncomingRequest] = useState<SatelliteRequest | null>(null);
  const [incomingReady, setIncomingReady] = useState(false);

  useEffect(() => {
    if (desiredRequest.key === displayedRequest.key) {
      setIncomingRequest(null);
      setIncomingReady(false);
      return;
    }
    setIncomingRequest(desiredRequest);
    setIncomingReady(false);
  }, [desiredRequest, displayedRequest.key]);

  useEffect(() => {
    if (!incomingRequest || !incomingReady) return;
    const timer = window.setTimeout(() => {
      setDisplayedRequest(incomingRequest);
      setIncomingRequest(null);
      setIncomingReady(false);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [incomingReady, incomingRequest]);

  const layers = [{ request: displayedRequest, opacity: incomingReady ? 0 : opacity }];
  if (incomingRequest && incomingRequest.key !== displayedRequest.key) {
    layers.push({ request: incomingRequest, opacity: incomingReady ? opacity : 0 });
  }

  return (
    <Pane name="satellite-imagery" style={{ zIndex: 250, pointerEvents: 'none' }}>
      {layers.map((layer) => (
        <ImageOverlay
          key={layer.request.key}
          url={layer.request.url}
          bounds={layer.request.bounds}
          opacity={layer.opacity}
          alt="NOAA GOES satellite imagery"
          className="weather-frame-layer weather-frame-layer--satellite"
          eventHandlers={{
            load: () => {
              if (layer.request.key === incomingRequest?.key) setIncomingReady(true);
            },
          }}
        />
      ))}
    </Pane>
  );
}
