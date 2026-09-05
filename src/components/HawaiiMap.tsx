import { useEffect, useMemo, useState } from 'react';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { CircleMarker, GeoJSON, MapContainer, Popup, Tooltip, useMap } from 'react-leaflet';
import { CloudRain, Layers3, LocateFixed, RadioTower } from 'lucide-react';
import { islands } from '../data/islands';
import { degreesToCompass, stormCategory } from '../lib/weather';
import type {
  BuoyReading,
  IslandDefinition,
  IslandId,
  TropicalSystem,
  WeatherAlert,
} from '../types/weather';
import { BaseMapLayers } from './map/BaseMapLayers';
import { BuoyMarkers } from './map/BuoyMarkers';

export type MapMode = 'islands' | 'pacific';

interface HawaiiMapProps {
  selectedIsland: IslandDefinition;
  selectedSystemId: string | null;
  alerts: WeatherAlert[];
  systems: TropicalSystem[];
  buoys: BuoyReading[];
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  onSelectIsland: (id: IslandId) => void;
  onSelectSystem: (system: TropicalSystem) => void;
}

function MapController({
  mode,
  selectedIsland,
  systems,
  selectedSystemId,
}: Pick<HawaiiMapProps, 'mode' | 'selectedIsland' | 'systems' | 'selectedSystemId'>) {
  const map = useMap();

  useEffect(() => {
    if (mode === 'islands') {
      map.flyTo([selectedIsland.latitude, selectedIsland.longitude], selectedIsland.id === 'oahu' ? 8 : 7, {
        animate: true,
        duration: 0.55,
      });
      return;
    }

    const selectedSystem = systems.find((system) => system.id === selectedSystemId);
    if (selectedSystem) {
      const bounds: LatLngBoundsExpression = [
        [Math.min(selectedSystem.latitude, 18.5) - 3, Math.min(selectedSystem.longitude, -161) - 4],
        [Math.max(selectedSystem.latitude, 22.5) + 3, Math.max(selectedSystem.longitude, -154) + 4],
      ];
      map.flyToBounds(bounds, { padding: [24, 24], duration: 0.65 });
      return;
    }

    map.flyTo([19, -154], 4, { animate: true, duration: 0.55 });
  }, [map, mode, selectedIsland, selectedSystemId, systems]);

  return null;
}

function createAlertCollection(alerts: WeatherAlert[]): FeatureCollection<Geometry, GeoJsonProperties> {
  return {
    type: 'FeatureCollection',
    features: alerts
      .filter((alert) => alert.geometry)
      .map((alert) => ({
        type: 'Feature',
        id: alert.id,
        geometry: alert.geometry!,
        properties: { event: alert.event, severity: alert.severity },
      })),
  };
}

export function HawaiiMap({
  selectedIsland,
  selectedSystemId,
  alerts,
  systems,
  buoys,
  mode,
  onModeChange,
  onSelectIsland,
  onSelectSystem,
}: HawaiiMapProps) {
  const alertCollection = useMemo(() => createAlertCollection(alerts), [alerts]);
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [buoysEnabled, setBuoysEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  return (
    <section className="panel map-panel" aria-label="Interactive Central Pacific map">
      <div className="map-toolbar">
        <div>
          <span className="overline">Weather map</span>
          <strong>{mode === 'islands' ? 'Hawaiian Islands' : 'Central & Eastern Pacific'}</strong>
        </div>
        <div className="map-toolbar__controls">
          <div className="segmented-control" aria-label="Map extent">
            <button className={mode === 'islands' ? 'is-active' : ''} type="button" onClick={() => onModeChange('islands')}>
              <LocateFixed size={14} /> Islands
            </button>
            <button className={mode === 'pacific' ? 'is-active' : ''} type="button" onClick={() => onModeChange('pacific')}>
              <Layers3 size={14} /> Pacific
            </button>
          </div>
          <div className="map-layer-pills" aria-label="Map layers">
            <button type="button" aria-pressed={radarEnabled} onClick={() => setRadarEnabled((value) => !value)}>
              <CloudRain size={14} /> Radar
            </button>
            <button type="button" aria-pressed={buoysEnabled} onClick={() => setBuoysEnabled((value) => !value)}>
              <RadioTower size={14} /> Buoys
            </button>
            <button type="button" aria-pressed={alertsEnabled} onClick={() => setAlertsEnabled((value) => !value)}>
              Alerts
            </button>
          </div>
        </div>
      </div>

      <div className="map-stage">
        <MapContainer
          center={[20.75, -157.3]}
          zoom={6}
          minZoom={3}
          maxZoom={11}
          attributionControl
          preferCanvas
          fadeAnimation={false}
          markerZoomAnimation={false}
          worldCopyJump
        >
          <MapController
            mode={mode}
            selectedIsland={selectedIsland}
            systems={systems}
            selectedSystemId={selectedSystemId}
          />
          <BaseMapLayers radarEnabled={radarEnabled} />

          {alertsEnabled && alertCollection.features.length > 0 && (
            <GeoJSON
              key={alerts.map((alert) => alert.id).join(':')}
              data={alertCollection}
              style={() => ({
                color: '#c44e42',
                fillColor: '#ef8068',
                fillOpacity: 0.16,
                opacity: 0.8,
                weight: 2,
                dashArray: '7 5',
              })}
            />
          )}

          {islands.map((island) => {
            const isSelected = island.id === selectedIsland.id;
            return (
              <CircleMarker
                key={island.id}
                center={[island.latitude, island.longitude]}
                radius={isSelected ? 8 : 5}
                pathOptions={{
                  color: isSelected ? '#173d57' : '#ffffff',
                  fillColor: island.accent,
                  fillOpacity: 1,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{ click: () => onSelectIsland(island.id) }}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={isSelected}>
                  {island.name}
                </Tooltip>
              </CircleMarker>
            );
          })}

          {buoysEnabled && <BuoyMarkers buoys={buoys} />}

          {systems.map((system) => {
            const selected = system.id === selectedSystemId;
            const center: LatLngExpression = [system.latitude, system.longitude];
            return (
              <CircleMarker
                key={system.id}
                center={center}
                radius={selected ? 11 : 8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: system.intensityKt >= 64 ? '#c72f42' : '#e17a38',
                  fillOpacity: 0.96,
                  weight: selected ? 4 : 2,
                }}
                eventHandlers={{ click: () => onSelectSystem(system) }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={selected}>
                  {system.name} · {system.intensityKt} kt
                </Tooltip>
                <Popup>
                  <strong>{system.name}</strong>
                  <br />
                  {stormCategory(system.intensityKt)} · {system.pressureMb} mb
                  <br />
                  Moving {degreesToCompass(system.movementDirectionDegrees)} at {system.movementSpeedKt} kt
                  <br />
                  Select the storm to open the full tracker.
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {radarEnabled && (
          <div className="radar-legend" aria-label="Radar reflectivity legend">
            <span>Light rain</span><i /><i /><i /><i /><span>Heavy</span>
          </div>
        )}
        <div className="map-legend" aria-label="Map legend">
          <span><i className="legend-dot legend-dot--island" /> Island</span>
          <span><i className="legend-dot legend-dot--buoy" /> NOAA buoy</span>
          <span><i className="legend-dot legend-dot--storm" /> Tropical system</span>
        </div>
      </div>
    </section>
  );
}
