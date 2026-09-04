import { ArrowUpRight, Radio } from 'lucide-react';
import { degreesToCompass, stormCategory } from '../lib/weather';
import type { FeedStatus, TropicalSystem } from '../types/weather';
import { FeedBadge } from './FeedBadge';

interface TropicalListProps {
  systems: TropicalSystem[];
  status: FeedStatus;
  selectedSystemId: string | null;
  onSelect: (system: TropicalSystem) => void;
}

export function TropicalList({ systems, status, selectedSystemId, onSelect }: TropicalListProps) {
  return (
    <section className="panel tropical-list">
      <div className="panel-heading panel-heading--compact">
        <div>
          <span className="overline">Tropical desk</span>
          <h3>Pacific systems</h3>
        </div>
        <FeedBadge status={status} />
      </div>

      <div className="tropical-list__body">
        {systems.length === 0 ? (
          <div className="empty-state">
            <Radio size={20} />
            <p>{status === 'loading' ? 'Checking the basin…' : 'No Pacific systems in the current feed.'}</p>
          </div>
        ) : (
          systems.slice(0, 3).map((system) => (
            <button
              type="button"
              className={`storm-row ${selectedSystemId === system.id ? 'is-active' : ''}`}
              key={system.id}
              onClick={() => onSelect(system)}
            >
              <span className="storm-row__symbol" aria-hidden="true">
                {system.intensityKt >= 64 ? '◉' : '○'}
              </span>
              <span className="storm-row__name">
                <small>{stormCategory(system.intensityKt)}</small>
                <strong>{system.name}</strong>
              </span>
              <span className="storm-row__meta">
                <strong>{system.intensityKt} kt</strong>
                <small>
                  {degreesToCompass(system.movementDirectionDegrees)} {system.movementSpeedKt} kt
                </small>
              </span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          ))
        )}
      </div>
    </section>
  );
}
