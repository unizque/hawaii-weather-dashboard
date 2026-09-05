import { useEffect, useState } from 'react';
import type { FrameLoopController, FrameLoopStatus } from '../types/imagery';

interface FrameSource {
  frames: string[];
}

interface UseFrameLoopOptions<T extends FrameSource> {
  enabled: boolean;
  sourceKey: string;
  fallbackSource: T;
  loadSource: (signal: AbortSignal) => Promise<T>;
  refreshIntervalMs?: number;
}

export interface FrameLoopResult<T extends FrameSource> extends FrameLoopController {
  source: T;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useFrameLoop<T extends FrameSource>({
  enabled,
  sourceKey,
  fallbackSource,
  loadSource,
  refreshIntervalMs = 5 * 60 * 1_000,
}: UseFrameLoopOptions<T>): FrameLoopResult<T> {
  const [loaded, setLoaded] = useState<{ key: string; source: T } | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<FrameLoopStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setRefreshToken((value) => value + 1), refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, refreshIntervalMs]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setIsPlaying(false);
      return;
    }

    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    setFrameIndex(0);
    setIsPlaying(false);

    loadSource(controller.signal)
      .then((source) => {
        if (controller.signal.aborted) return;
        setLoaded({ key: sourceKey, source });
        setFrameIndex(Math.max(0, source.frames.length - 1));
        setIsPlaying(source.frames.length > 1 && !prefersReducedMotion());
        setStatus(source.frames.length > 1 ? 'ready' : 'current-only');
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ key: sourceKey, source: fallbackSource });
        setStatus('current-only');
        setError(caught instanceof Error ? caught.message : 'Imagery history is unavailable.');
      });

    return () => controller.abort();
  }, [enabled, fallbackSource, loadSource, refreshToken, sourceKey]);

  const sourceMatches = loaded?.key === sourceKey;
  const source = sourceMatches ? loaded.source : fallbackSource;
  const frames = source.frames;

  useEffect(() => {
    if (!enabled || !isPlaying || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % frames.length);
    }, 1_450);
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

  return {
    source,
    frameTime: frames[frameIndex] ?? null,
    frames,
    frameIndex,
    isPlaying: sourceMatches && isPlaying,
    status: !enabled ? 'idle' : sourceMatches ? status : 'loading',
    error,
    togglePlayback: () => setIsPlaying((value) => frames.length > 1 && !value),
    seek,
  };
}
