import { Droplets, Gauge, MapPin, Navigation, Wind } from 'lucide-react';
import { formatAge } from '../lib/weather';
import type { CurrentConditions, FeedStatus, IslandDefinition } from '../types/weather';
import { FeedBadge } from './FeedBadge';
import { WeatherGlyph } from './WeatherGlyph';

interface ConditionsPanelProps {
  island: IslandDefinition;
  conditions: CurrentConditions;
  status: FeedStatus;
  updatedAt: string | null;
}

export function ConditionsPanel({ island, conditions, status, updatedAt }: ConditionsPanelProps) {
  const metrics = [
    { label: 'Wind', value: `${conditions.windDirection} ${conditions.windSpeedMph}`, unit: 'mph', icon: Wind },
    { label: 'Humidity', value: conditions.humidityPercent, unit: '%', icon: Droplets },
    { label: 'Pressure', value: conditions.pressureMb, unit: 'mb', icon: Gauge },
    { label: 'Feels like', value: conditions.feelsLikeF, unit: '°F', icon: Navigation },
  ];

  return (
    <section className="panel conditions-panel">
      <div className="panel-heading panel-heading--compact">
        <div>
          <span className="overline">Current conditions</span>
          <h3>{island.localName}</h3>
        </div>
        <FeedBadge status={status} />
      </div>

      <div className="conditions-hero">
        <div className="conditions-hero__temperature">
          <strong>{conditions.temperatureF}</strong>
          <span>°F</span>
        </div>
        <div className="conditions-hero__icon">
          <WeatherGlyph forecast={conditions.description} size={48} />
        </div>
      </div>
      <p className="conditions-summary">{conditions.description}</p>

      <div className="metric-grid">
        {metrics.map(({ label, value, unit, icon: Icon }) => (
          <div className="metric" key={label}>
            <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>{label}</span>
            <strong>
              {value}<small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>

      <div className="station-note">
        <MapPin size={13} />
        <span>{conditions.stationName}</span>
        <small>{formatAge(updatedAt)}</small>
      </div>
    </section>
  );
}
