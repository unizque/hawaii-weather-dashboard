import { useEffect, useMemo, useState } from 'react';
import {
  hawaiiRadarSites,
  hawaiiReflectivityService,
  radarRangeKm,
  type RadarMode,
  type RadarSite,
} from '../data/radar';
import { nearestRadarSite, parseRadarCapabilities } from '../lib/radar';

export type RadarLoopStatus = 'idle' | 'loading' | 'ready' | 'current-only' | 'out-of-range' | 'unavailable';

interface RadarTarget {
  latitude: number;
  longitude: number;
}

interface UseRadarLoopOptions {
  enabled: boolean;
  mode: RadarMode;
  target?: RadarTarget;
}

export interface RadarLoopController {
  serviceUrl: string;
  layerName: string | null;
  frameTime: string | null;
  frames: string[];
  frameIndex: number;
  isPlaying: boolean;
  status: RadarLoopStatus;
  nearestSite: RadarSite | null;
  distanceKm: number | null;
  hasCoverage: boolean;
  error: string | null;
  togglePlayback: () => void;
  seek: (index: number) => void;
}

function capabilitiesUrl(serviceUrl: string): string {
  const url = new URL(serviceUrl);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('version', '1.3.0');
  url.searchParams.set('request', 'GetCapabilities');
  return url.toString();
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useRadarLoop({ enabled, mode, target }: UseRadarLoopOptions): RadarLoopController {
  const nearest = useMemo(
    () => target ? nearestRadarSite(target, hawaiiRadarSites) : null,
    [target?.latitude, target?.longitude],
  );
  const hasCoverage = mode === 'reflectivity' || Boolean(nearest && nearest.distanceKm <= radarRangeKm);
  const serviceUrl = mode === 'reflectivity'
    ? hawaiiReflectivityService.serviceUrl
    : nearest?.site.serviceUrl ?? '';
  const fallbackLayer = mode === 'reflectivity' ? hawaiiReflectivityService.fallbackLayer : null;
  const sourceKey = `${mode}:${serviceUrl}`;

  const [loadedSource, setLoadedSource] = useState('');
  const [layerName, setLayerName] = useState<string | null>(fallbackLayer);
  const [frames, setFrames] = useState<string[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<RadarLoopStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setRefreshToken((value) => value + 1), 5 * 60 * 1_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setIsPlaying(false);
      return;
    }

    if (!hasCoverage || !serviceUrl) {
      setLoadedSource(sourceKey);
      setLayerName(null);
      setFrames([]);
      setFrameIndex(0);
      setIsPlaying(false);
      setStatus('out-of-range');
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoadedSource(sourceKey);
    setStatus('loading');
    setError(null);
    setLayerName(fallbackLayer);
    setFrames([]);
    setFrameIndex(0);
    setIsPlaying(false);

    fetch(capabilitiesUrl(serviceUrl), { signal: controller.signal, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Radar service returned ${response.status}`);
        return response.text();
      })
      .then((xml) => {
        const capabilities = parseRadarCapabilities(xml, mode);
        const nextLayer = capabilities.layerName ?? fallbackLayer;
        if (!nextLayer) throw new Error('The requested radar product is not listed by NOAA.');

        setLayerName(nextLayer);
        setFrames(capabilities.frames);
        setFrameIndex(Math.max(0, capabilities.frames.length - 1));
        setIsPlaying(capabilities.frames.length > 1 && !prefersReducedMotion());
        setStatus(capabilities.frames.length > 1 ? 'ready' : 'current-only');
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setFrames([]);
        setFrameIndex(0);
        setIsPlaying(false);
        setLayerName(fallbackLayer);
        setStatus(fallbackLayer ? 'current-only' : 'unavailable');
        setError(caught instanceof Error ? caught.message : 'Radar history is unavailable.');
      });

    return () => controller.abort();
  }, [enabled, fallbackLayer, hasCoverage, mode, refreshToken, serviceUrl, sourceKey]);

  useEffect(() => {
    if (!enabled || !isPlaying || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % frames.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [enabled, frames.length, isPlaying]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setIsPlaying(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const seek = (index: number) => {
    setIsPlaying(false);
    setFrameIndex(Math.max(0, Math.min(frames.length - 1, index)));
  };

  const sourceMatches = loadedSource === sourceKey;
  const visibleFrames = sourceMatches ? frames : [];
  const visibleStatus: RadarLoopStatus = !enabled
    ? 'idle'
    : !hasCoverage
      ? 'out-of-range'
      : sourceMatches
        ? status
        : 'loading';

  return {
    serviceUrl,
    layerName: sourceMatches ? layerName : fallbackLayer,
    frameTime: visibleFrames[frameIndex] ?? null,
    frames: visibleFrames,
    frameIndex,
    isPlaying: sourceMatches && isPlaying,
    status: visibleStatus,
    nearestSite: nearest?.site ?? null,
    distanceKm: nearest?.distanceKm ?? null,
    hasCoverage,
    error,
    togglePlayback: () => setIsPlaying((value) => !value),
    seek,
  };
}
