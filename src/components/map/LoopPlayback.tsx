import { ExternalLink, Pause, Play, RotateCcw } from 'lucide-react';
import { pacificSatelliteService } from '../../data/satellite';
import { formatHstTime } from '../../lib/weather';
import type { FrameLoopController } from '../../types/imagery';

interface LoopPlaybackProps {
  kind: 'radar' | 'satellite';
  title: string;
  sourceLabel: string;
  loop: FrameLoopController;
}

function frameLabel(value: string | null): string {
  if (!value) return 'Current image';
  return `${formatHstTime(value, { hour: 'numeric', minute: '2-digit' })} HST`;
}

export function LoopPlayback({ kind, title, sourceLabel, loop }: LoopPlaybackProps) {
  const canPlay = loop.frames.length > 1;

  return (
    <section className={`weather-loop weather-loop--${kind}`} aria-label={`${title} playback controls`}>
      <div className="weather-loop__topline">
        <strong>{title}</strong>
        <span>{sourceLabel} · Past 2 hours</span>
      </div>

      {loop.status === 'unavailable' ? (
        <div className="weather-loop__notice">
          <RotateCcw size={16} />
          <p><strong>Imagery temporarily unavailable</strong>Use the official NOAA source while this layer reconnects.</p>
        </div>
      ) : (
        <>
          <div className="weather-loop__timeline">
            <button
              type="button"
              onClick={loop.togglePlayback}
              disabled={!canPlay}
              aria-label={loop.isPlaying ? `Pause ${title}` : `Play ${title}`}
            >
              {loop.isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, loop.frames.length - 1)}
              value={loop.frameIndex}
              disabled={!canPlay}
              onChange={(event) => loop.seek(Number(event.target.value))}
              aria-label={`${title} frame`}
            />
            <time>{loop.status === 'loading' ? 'Loading history…' : frameLabel(loop.frameTime)}</time>
          </div>

          {kind === 'radar' ? (
            <div className="weather-loop__scale" aria-label="Radar reflectivity color scale">
              <span>Light rain</span><i /><i /><i /><i /><span>Heavy</span>
            </div>
          ) : (
            <div className="weather-loop__source-note">
              <span>GeoColor in daylight · multispectral infrared after dark</span>
              <a href={pacificSatelliteService.informationUrl} target="_blank" rel="noreferrer">
                NOAA source <ExternalLink size={11} />
              </a>
            </div>
          )}

          {loop.status === 'current-only' && (
            <p className="weather-loop__fallback">Current NOAA image shown; historical playback is reconnecting.</p>
          )}
        </>
      )}
    </section>
  );
}
