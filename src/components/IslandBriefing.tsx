import type { CSSProperties } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { islands } from '../data/islands';
import type { CurrentConditions, IslandDefinition, IslandId } from '../types/weather';

interface IslandBriefingProps {
  selectedIsland: IslandDefinition;
  conditions: CurrentConditions;
  onSelectIsland: (id: IslandId) => void;
}

export function IslandBriefing({ selectedIsland, conditions, onSelectIsland }: IslandBriefingProps) {
  return (
    <section className="panel island-briefing">
      <div className="panel-heading">
        <div>
          <span className="overline">Island briefing</span>
          <h2>{selectedIsland.name}</h2>
        </div>
        <MapPin size={19} strokeWidth={1.5} aria-hidden="true" />
      </div>

      <div className="island-selector" role="list" aria-label="Choose an island">
        {islands.map((island) => (
          <button
            type="button"
            key={island.id}
            className={`island-selector__item ${island.id === selectedIsland.id ? 'is-active' : ''}`}
            onClick={() => onSelectIsland(island.id)}
            style={{ '--island-accent': island.accent } as CSSProperties}
          >
            <span className="island-selector__marker" aria-hidden="true" />
            <span>
              <strong>{island.name}</strong>
              <small>{island.localName}</small>
            </span>
            <span className="island-selector__temp">{island.id === selectedIsland.id ? `${conditions.temperatureF}°` : '··'}</span>
          </button>
        ))}
      </div>

      <div className="location-readout">
        <Navigation size={15} aria-hidden="true" />
        <span>{selectedIsland.stationLabel}</span>
        <small>
          {selectedIsland.latitude.toFixed(2)}°N · {Math.abs(selectedIsland.longitude).toFixed(2)}°W
        </small>
      </div>
    </section>
  );
}
