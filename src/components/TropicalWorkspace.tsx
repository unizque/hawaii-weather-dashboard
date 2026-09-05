import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CloudRain,
  Eye,
  Info,
  Layers3,
  RadioTower,
  Route,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { guidanceKindLabels, knotsToMph, modelColors } from '../lib/tropical';
import { degreesToCompass, formatHstTime, stormCategory } from '../lib/weather';
import type { BuoyReading, TropicalSystem, WeatherAlert } from '../types/weather';
import { TropicalMap, type TropicalLayerState } from './TropicalMap';

interface TropicalWorkspaceProps {
  systems: TropicalSystem[];
  selectedSystemId: string | null;
  alerts: WeatherAlert[];
  buoys: BuoyReading[];
  onSelectSystem: (system: TropicalSystem) => void;
  onBack: () => void;
}

const initialLayers: TropicalLayerState = {
  cone: true,
  officialTrack: true,
  guidance: false,
  warnings: true,
  radar: false,
  buoys: true,
};

function advisoryTime(value: string): string {
  return `${formatHstTime(value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} HST`;
}

export function TropicalWorkspace({
  systems,
  selectedSystemId,
  alerts,
  buoys,
  onSelectSystem,
  onBack,
}: TropicalWorkspaceProps) {
  const [layers, setLayers] = useState<TropicalLayerState>(initialLayers);
  const system = systems.find((candidate) => candidate.id === selectedSystemId) ?? systems[0] ?? null;

  const warnings = useMemo(() => {
    if (!system) return [];
    const nhcWarnings = (system.products.warnings?.features ?? []).map((feature) => ({
      id: String(feature.id ?? feature.properties?.name ?? 'nhc-warning'),
      name: String(feature.properties?.name ?? 'Tropical cyclone watch or warning'),
      description: String(feature.properties?.description ?? ''),
      url: system.advisoryUrl,
    }));
    const nwsWarnings = alerts
      .filter((alert) => /hurricane|tropical storm/i.test(alert.event))
      .map((alert) => ({
        id: alert.id,
        name: alert.event,
        description: alert.headline,
        url: alert.sourceUrl,
      }));

    return [...new Map([...nhcWarnings, ...nwsWarnings].map((warning) => [warning.name, warning])).values()];
  }, [alerts, system]);

  const toggleLayer = (layer: keyof TropicalLayerState) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  if (!system) {
    return (
      <main className="tropical-workspace tropical-workspace--quiet">
        <div className="section-heading">
          <button className="text-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Island overview</button>
          <span className="overline">Tropical weather center</span>
          <h2>No active Pacific tropical cyclones</h2>
          <p>The tracker will populate automatically when NOAA or the Central Pacific Hurricane Center begins advisories.</p>
          <a className="primary-link" href="https://www.nhc.noaa.gov/?epac" target="_blank" rel="noreferrer">
            View the official Pacific outlook <ArrowUpRight size={15} />
          </a>
        </div>
      </main>
    );
  }

  const category = stormCategory(system.intensityKt);
  const hasCone = Boolean(system.products.cone?.features.length);
  const hasGuidance = system.products.guidance.length > 0;
  const sourceLinks = [
    { label: 'Public advisory', url: system.advisoryUrl },
    { label: 'Forecast discussion', url: system.discussionUrl },
    { label: 'Forecast advisory', url: system.forecastAdvisoryUrl },
    { label: 'Wind probabilities', url: system.windProbabilitiesUrl },
    { label: 'Official graphics', url: system.graphicsUrl },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  return (
    <main className="tropical-workspace">
      <header className="tropical-workspace__header">
        <div>
          <button className="text-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Island overview</button>
          <span className="overline">Tropical weather center</span>
          <h2>Pacific storm tracker</h2>
          <p>Official NHC/CPHC forecast products, warnings, and selected model guidance in one focused view.</p>
        </div>
        <a className="secondary-link" href="https://www.nhc.noaa.gov/?epac" target="_blank" rel="noreferrer">
          National Hurricane Center <ArrowUpRight size={15} />
        </a>
      </header>

      <div className="storm-selector" role="list" aria-label="Active Pacific tropical systems">
        {systems.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className={candidate.id === system.id ? 'is-active' : ''}
            onClick={() => onSelectSystem(candidate)}
          >
            <span className={candidate.intensityKt >= 96 ? 'storm-symbol is-major' : 'storm-symbol'}>◉</span>
            <span><small>{stormCategory(candidate.intensityKt)}</small><strong>{candidate.name}</strong></span>
            <b>{candidate.intensityKt} kt</b>
          </button>
        ))}
      </div>

      <section className="storm-summary-card">
        <div className="storm-summary-card__identity">
          <span className={system.intensityKt >= 96 ? 'storm-orb is-major' : 'storm-orb'} aria-hidden="true">◉</span>
          <div>
            <span className="overline">Advisory {system.advisoryNumber ?? 'current'}</span>
            <h3>{system.classification} {system.name}</h3>
            <p>{category} · Issued {advisoryTime(system.updatedAt)}</p>
          </div>
        </div>
        <dl className="storm-vitals">
          <div><dt>Maximum winds</dt><dd>{system.intensityKt} <small>kt</small><span>{knotsToMph(system.intensityKt)} mph</span></dd></div>
          <div><dt>Pressure</dt><dd>{system.pressureMb || '—'} <small>mb</small></dd></div>
          <div><dt>Movement</dt><dd>{degreesToCompass(system.movementDirectionDegrees)} <small>{system.movementSpeedKt} kt</small></dd></div>
          <div><dt>Center</dt><dd>{system.latitude.toFixed(1)}°N <small>{Math.abs(system.longitude).toFixed(1)}°W</small></dd></div>
        </dl>
      </section>

      <section className="tropical-map-card">
        <div className="tropical-map-card__toolbar">
          <div>
            <span className="overline">Official forecast map</span>
            <h3>{system.name} — five-day outlook</h3>
          </div>
          <div className="tropical-layer-controls" aria-label="Tropical map layers">
            <button type="button" aria-pressed={layers.cone} disabled={!hasCone} onClick={() => toggleLayer('cone')}>
              <Eye size={14} /> Cone
            </button>
            <button type="button" aria-pressed={layers.officialTrack} onClick={() => toggleLayer('officialTrack')}>
              <Route size={14} /> Official track
            </button>
            <button type="button" aria-pressed={layers.guidance} disabled={!hasGuidance} onClick={() => toggleLayer('guidance')}>
              <Layers3 size={14} /> Models
            </button>
            <button type="button" aria-pressed={layers.warnings} onClick={() => toggleLayer('warnings')}>
              <ShieldAlert size={14} /> Warnings
            </button>
            <button type="button" aria-pressed={layers.radar} onClick={() => toggleLayer('radar')}>
              <CloudRain size={14} /> Radar loop
            </button>
            <button type="button" aria-pressed={layers.buoys} onClick={() => toggleLayer('buoys')}>
              <RadioTower size={14} /> Buoys
            </button>
          </div>
        </div>
        <TropicalMap system={system} alerts={alerts} buoys={buoys} layers={layers} />
        <div className="cone-explainer">
          <Info size={17} />
          <p><strong>How to read the cone:</strong> it represents the probable path of the storm’s center. Hazardous wind, rain, surf, and flooding can occur well outside it.</p>
        </div>
      </section>

      <div className="tropical-detail-grid">
        <section className="detail-card forecast-timeline-card">
          <div className="detail-card__heading"><div><span className="overline">NHC / CPHC</span><h3>Official forecast points</h3></div><Route size={20} /></div>
          {system.products.forecast.length > 0 ? (
            <div className="forecast-timeline">
              {system.products.forecast.map((point) => (
                <article key={`${point.validAt}-${point.tauHours}`}>
                  <span className="timeline-dot" />
                  <time>{point.tauHours === 0 ? 'Current' : `+${point.tauHours} hours`}<small>{advisoryTime(point.validAt)}</small></time>
                  <div><strong>{point.intensityKt ?? '—'} kt</strong><span>{point.intensityKt === null ? 'Intensity unavailable' : stormCategory(point.intensityKt)}</span></div>
                  <p>{point.latitude.toFixed(1)}°N · {Math.abs(point.longitude).toFixed(1)}°W</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="detail-empty">Forecast points are being prepared. Use the official advisory links for the complete current forecast.</p>
          )}
        </section>

        <section className="detail-card warning-card">
          <div className="detail-card__heading"><div><span className="overline">Coastal products</span><h3>Watches & warnings</h3></div><ShieldAlert size={20} /></div>
          {warnings.length > 0 ? warnings.map((warning) => (
            <a key={warning.id} className="tropical-warning" href={warning.url ?? system.advisoryUrl ?? '#'} target="_blank" rel="noreferrer">
              <span /><div><strong>{warning.name}</strong><p>{warning.description || 'See the current public advisory for affected areas.'}</p></div><ArrowUpRight size={15} />
            </a>
          )) : (
            <div className="no-tropical-warnings"><ShieldAlert size={22} /><p>No hurricane or tropical-storm coastal watches or warnings are present in the current products.</p></div>
          )}
        </section>

        <section className="detail-card guidance-card">
          <div className="detail-card__heading"><div><span className="overline">Track guidance</span><h3>Selected model runs</h3></div><Wind size={20} /></div>
          {system.products.guidance.length > 0 ? (
            <div className="guidance-list">
              {system.products.guidance.map((track) => (
                <div key={track.id}>
                  <i style={{ backgroundColor: modelColors[track.id] ?? '#5e6870' }} />
                  <span><strong>{track.name}</strong><small>{guidanceKindLabels[track.kind]}</small></span>
                  <time>{formatHstTime(track.initializedAt, { month: 'short', day: 'numeric', hour: 'numeric' })} HST</time>
                </div>
              ))}
            </div>
          ) : <p className="detail-empty">Model guidance is not available for this advisory yet.</p>}
          <p className="guidance-disclaimer"><Info size={14} /> Model guidance is automated and can contain errors. It is not an official forecast; the NHC/CPHC track and cone take priority.</p>
        </section>

        <section className="detail-card sources-card">
          <div className="detail-card__heading"><div><span className="overline">Official products</span><h3>Read the full advisory</h3></div><BookOpen size={20} /></div>
          <div className="official-links">
            {sourceLinks.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={14} /></a>)}
          </div>
        </section>
      </div>
    </main>
  );
}
