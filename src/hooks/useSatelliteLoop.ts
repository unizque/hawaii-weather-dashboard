import { useCallback } from 'react';
import { pacificSatelliteService } from '../data/satellite';
import { fetchSatelliteFrames } from '../services/satellite';
import type { FrameLoopController } from '../types/imagery';
import { useFrameLoop } from './useFrameLoop';

const fallbackSource = { frames: [] as string[] };

export function useSatelliteLoop({ enabled }: { enabled: boolean }): FrameLoopController {
  const loadSource = useCallback((signal: AbortSignal) => fetchSatelliteFrames(signal), []);
  return useFrameLoop({
    enabled,
    sourceKey: pacificSatelliteService.serviceUrl,
    fallbackSource,
    loadSource,
  });
}
