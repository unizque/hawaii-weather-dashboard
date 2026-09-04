import { Waves, Wind } from 'lucide-react';
import { formatAge } from '../lib/weather';
import type { BuoyReading, FeedStatus } from '../types/weather';

interface BuoyPanelProps {
  buoys: BuoyReading[];
  status: FeedStatus;
  updatedAt: string | null;
}

function reading(value: number | null, unit: string): string {
  return value === null ? '—' : `${value}${unit}`;
}

export function BuoyPanel({ buoys, status, updatedAt }: BuoyPanelProps) {
  const buoy = buoys[0];

  return (
    <section className="panel buoy-panel">
      <div className="panel-heading panel-heading--compact">
        <div>
          <span className="overline">Mapped offshore station</span>
          <h3>{buoy ? `Buoy ${buoy.stationId}` : 'Offshore network'}</h3>
        </div>
        <Waves size={19} aria-hidden="true" />
      </div>

      {buoy ? (
        <div className="buoy-readout">
          <div>
            <Waves size={17} />
            <span>Wave height</span>
            <strong>{reading(buoy.waveHeightFt, ' ft')}</strong>
          </div>
          <div>
            <Wind size={17} />
            <span>Wind</span>
            <strong>{reading(buoy.windSpeedKt, ' kt')}</strong>
          </div>
          <p>{buoy.name} · {formatAge(buoy.observedAt || updatedAt)}</p>
        </div>
      ) : (
        <div className="empty-state"><Waves size={20} /><p>Waiting for the next buoy sync.</p></div>
      )}
    </section>
  );
}
