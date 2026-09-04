import { Umbrella, Wind } from 'lucide-react';
import type { ForecastPeriod, IslandDefinition } from '../types/weather';
import { WeatherGlyph } from './WeatherGlyph';

interface ForecastRailProps {
  island: IslandDefinition;
  periods: ForecastPeriod[];
}

export function ForecastRail({ island, periods }: ForecastRailProps) {
  return (
    <section className="panel forecast-rail">
      <div className="forecast-rail__title">
        <span className="overline">Island outlook</span>
        <h3>{island.name}</h3>
        <span className="forecast-rail__hint">7 periods</span>
      </div>
      <div className="forecast-rail__periods" tabIndex={0} aria-label={`${island.name} forecast periods`}>
        {periods.slice(0, 7).map((period) => (
          <article className="forecast-card" key={`${period.id}-${period.startTime}`}>
            <small>{period.name}</small>
            <WeatherGlyph forecast={period.shortForecast} isDaytime={period.isDaytime} size={28} />
            <strong>{period.temperatureF}°</strong>
            <p>{period.shortForecast}</p>
            <div>
              <span><Umbrella size={12} /> {period.precipitationChance ?? 0}%</span>
              <span><Wind size={12} /> {period.windSpeed.replace(' mph', '')}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
