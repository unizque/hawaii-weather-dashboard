import { ExternalLink, Pause, Play, RotateCcw } from 'lucide-react';
import type { RadarMode } from '../../data/radar';
import type { RadarLoopController } from '../../hooks/useRadarLoop';
import { formatHstTime } from '../../lib/weather';

interface RadarPlaybackProps {
  mode: RadarMode;
  radar: RadarLoopController;
  onModeChange?: (mode: RadarMode) => void;
  stormName?: string;
}

function frameLabel(value: string | null): string {
  if (!value) return 'Current image';
  return `${formatHstTime(value, { hour: 'numeric', minute: '2-digit' })} HST`;
}

export function RadarPlayback({ mode, radar, onModeChange, stormName }: RadarPlaybackProps) {
  const distanceMiles = radar.distanceKm === null ? null : Math.round(radar.distanceKm * 0.621_371);
  const canPlay = radar.frames.length > 1;

  return (
    <section className="radar-player" aria-label="NOAA radar playback controls">
      <div className="radar-player__topline">
        {onModeChange ? (
          <div className="radar-product-switch" aria-label="Radar product">
            <button type="button" aria-pressed={mode === 'reflectivity'} onClick={() => onModeChange('reflectivity')}>
              Rain
            </button>
            <button type="button" aria-pressed={mode === 'velocity'} onClick={() => onModeChange('velocity')}>
              Rotation
            </button>
          </div>
        ) : <strong>Rain radar</strong>}
        <span>{mode === 'velocity' && radar.nearestSite ? radar.nearestSite.id : 'Past 2 hours'}</span>
      </div>

      {radar.status === 'out-of-range' ? (
        <div className="radar-player__notice">
          <RotateCcw size={16} />
          <p>
            <strong>Outside Doppler range</strong>
            {stormName ?? 'This storm'} is about {distanceMiles ?? '—'} miles from {radar.nearestSite?.name ?? 'the nearest Hawaiʻi radar'}.
          </p>
          <a href="https://www.star.nesdis.noaa.gov/GOES/sector.php?sat=G18&sector=hi" target="_blank" rel="noreferrer" aria-label="Open NOAA satellite imagery">
            Satellite <ExternalLink size={12} />
          </a>
        </div>
      ) : radar.status === 'unavailable' ? (
        <div className="radar-player__notice">
          <RotateCcw size={16} />
          <p><strong>Velocity temporarily unavailable</strong>Use NOAA radar or satellite imagery while this product reconnects.</p>
        </div>
      ) : (
        <>
          <div className="radar-player__timeline">
            <button
              type="button"
              onClick={radar.togglePlayback}
              disabled={!canPlay}
              aria-label={radar.isPlaying ? 'Pause radar loop' : 'Play radar loop'}
            >
              {radar.isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, radar.frames.length - 1)}
              value={radar.frameIndex}
              disabled={!canPlay}
              onChange={(event) => radar.seek(Number(event.target.value))}
              aria-label="Radar frame"
            />
            <time>{radar.status === 'loading' ? 'Loading history…' : frameLabel(radar.frameTime)}</time>
          </div>
          <div className={`radar-scale radar-scale--${mode}`} aria-label={mode === 'velocity' ? 'Radial velocity color scale' : 'Reflectivity color scale'}>
            <span>{mode === 'velocity' ? 'Toward radar' : 'Light rain'}</span><i /><i /><i /><i /><span>{mode === 'velocity' ? 'Away' : 'Heavy'}</span>
          </div>
          {radar.status === 'current-only' && (
            <p className="radar-player__fallback">Current NOAA image shown; the historical loop is temporarily unavailable.</p>
          )}
          {mode === 'reflectivity' && stormName && distanceMiles !== null && distanceMiles > 143 && (
            <p className="radar-player__fallback">Distant storms may be beyond Hawaiʻi radar coverage; use NOAA satellite imagery offshore.</p>
          )}
        </>
      )}
    </section>
  );
}
