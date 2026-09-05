import { useCallback } from 'react';
import { hawaiiReflectivityService } from '../data/radar';
import { fetchRadarSource } from '../services/radar';
import type { FrameLoopController } from '../types/imagery';
import { useFrameLoop } from './useFrameLoop';

export interface RadarLoopController extends FrameLoopController {
  serviceUrl: string;
  layerName: string | null;
}

const fallbackSource = {
  layerName: hawaiiReflectivityService.fallbackLayer,
  frames: [] as string[],
};

export function useRadarLoop({ enabled }: { enabled: boolean }): RadarLoopController {
  const loadSource = useCallback(
    (signal: AbortSignal) => fetchRadarSource(hawaiiReflectivityService.serviceUrl, signal),
    [],
  );
  const { source, ...loop } = useFrameLoop({
    enabled,
    sourceKey: hawaiiReflectivityService.serviceUrl,
    fallbackSource,
    loadSource,
  });

  return {
    ...loop,
    serviceUrl: hawaiiReflectivityService.serviceUrl,
    layerName: source.layerName ?? hawaiiReflectivityService.fallbackLayer,
  };
}
