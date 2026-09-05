import { useEffect, useMemo, useState } from 'react';
import type { WMSParams } from 'leaflet';
import { Pane, WMSTileLayer } from 'react-leaflet';

interface SmoothWmsLayerProps {
  serviceUrl: string;
  layerName: string;
  frameTime: string | null;
  opacity?: number;
}

const currentFrame = 'current';

export function SmoothWmsLayer({
  serviceUrl,
  layerName,
  frameTime,
  opacity = 0.68,
}: SmoothWmsLayerProps) {
  const desiredFrame = frameTime ?? currentFrame;
  const [displayedFrame, setDisplayedFrame] = useState(desiredFrame);
  const [incomingFrame, setIncomingFrame] = useState<string | null>(null);
  const [incomingReady, setIncomingReady] = useState(false);

  useEffect(() => {
    if (desiredFrame === displayedFrame) {
      setIncomingFrame(null);
      setIncomingReady(false);
      return;
    }
    setIncomingFrame(desiredFrame);
    setIncomingReady(false);
  }, [desiredFrame, displayedFrame]);

  useEffect(() => {
    if (!incomingFrame || !incomingReady) return;
    const timer = window.setTimeout(() => {
      setDisplayedFrame(incomingFrame);
      setIncomingFrame(null);
      setIncomingReady(false);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [incomingFrame, incomingReady]);

  const layers = useMemo(() => {
    const next = [{ frame: displayedFrame, opacity: incomingReady ? 0 : opacity }];
    if (incomingFrame && incomingFrame !== displayedFrame) {
      next.push({ frame: incomingFrame, opacity: incomingReady ? opacity : 0 });
    }
    return next;
  }, [displayedFrame, incomingFrame, incomingReady, opacity]);

  return (
    <>
      {layers.map((layer) => {
        const paneName = `radar-frame-${layer.frame.replace(/\D/g, '') || 'current'}`;
        const params: WMSParams & { time?: string } = {
          layers: layerName,
          format: 'image/png',
          transparent: true,
          version: '1.1.1',
          ...(layer.frame === currentFrame ? {} : { time: layer.frame }),
        };

        return (
          <Pane
            key={`${serviceUrl}:${layerName}:${layer.frame}`}
            name={paneName}
            style={{
              zIndex: 280,
              opacity: layer.opacity,
              pointerEvents: 'none',
              transition: 'opacity 420ms linear',
              willChange: 'opacity',
            }}
          >
            <WMSTileLayer
              attribution="Radar: NOAA / National Weather Service"
              url={serviceUrl}
              params={params}
              opacity={1}
              updateWhenIdle
              updateInterval={300}
              keepBuffer={1}
              className="weather-frame-layer weather-frame-layer--radar"
              eventHandlers={{
                load: () => {
                  if (layer.frame === incomingFrame) setIncomingReady(true);
                },
              }}
            />
          </Pane>
        );
      })}
    </>
  );
}
