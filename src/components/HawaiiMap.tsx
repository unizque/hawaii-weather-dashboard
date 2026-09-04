import { Fragment, useEffect, useMemo } from 'react';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Crosshair, Layers3, LocateFixed } from 'lucide-react';
import { islands } from '../data/islands';
import { degreesToCompass, stormCategory } from '../lib/weather';
import type { IslandDefinition, IslandId, TropicalSystem, WeatherAlert } from '../types/weather';

export type MapMode = 'islands' | 'pacific';

interface HawaiiMapProps {
  selectedIsland: IslandDefinition;
  selectedSystemId: string | null;
  alerts: WeatherAlert[];
  systems: TropicalSystem[];
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  onSelectIsland: (id: IslandId) => void;
  onSelectSystem: (system: TropicalSystem) => void;
}

function projectedPosition(system: TropicalSystem): LatLngExpression {
  const travelNm = system.movementSpeedKt * 12;
  const angle = (system.movementDirectionDegrees * Math.PI) / 180;
  const latitude = system.latitude + (Math.cos(angle) * travelNm) / 60;
  const longitude = system.longitude + (Math.sin(angle) * travelNm) / (60 * Math.cos((system.latitude * Math.PI) / 180));
  return [latitude, longitude];
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
        duration: 0.8,
      });
      return;
    }

    const selectedSystem = systems.find((system) => system.id === selectedSystemId);
    if (selectedSystem) {
      const bounds: LatLngBoundsExpression = [
        [Math.min(selectedSystem.latitude, 18.5) - 3, Math.min(selectedSystem.longitude, -161) - 4],
        [Math.max(selectedSystem.latitude, 22.5) + 3, Math.max(selectedSystem.longitude, -154) + 4],
      ];
      map.flyToBounds(bounds, { padding: [28, 28], duration: 0.9 });
      return;
    }

    map.flyTo([19, -154], 4, { animate: true, duration: 0.8 });
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
        properties: {
          event: alert.event,
          severity: alert.severity,
        },
      })),
  };
}

export function HawaiiMap({
  selectedIsland,
  selectedSystemId,
  alerts,
  systems,
  mode,
  onModeChange,
  onSelectIsland,
  onSelectSystem,
}: HawaiiMapProps) {
  const alertCollection = useMemo(() => createAlertCollection(alerts), [alerts]);

  return (
    <section className="panel map-panel" aria-label="Interactive Central Pacific map">
      <div className="map-toolbar">
        <div>
          <span className="overline">Operational map</span>
          <strong>{mode === 'islands' ? 'Hawaiian Islands' : 'Central & Eastern Pacific'}</strong>
        </div>
        <div className="segmented-control" aria-label="Map extent">
          <button className={mode === 'islands' ? 'is-active' : ''} type="button" onClick={() => onModeChange('islands')}>
            <LocateFixed size={14} /> Islands
          </button>
          <button className={mode === 'pacific' ? 'is-active' : ''} type="button" onClick={() => onModeChange('pacific')}>
            <Layers3 size={14} /> Pacific
          </button>
        </div>
      </div>

      <div className="map-stage">
        <MapContainer
          center={[20.75, -157.3]}
          zoom={6}
          minZoom={3}
          maxZoom={10}
          zoomControl={false}
          attributionControl
          preferCanvas
        >
          <MapController
            mode={mode}
            selectedIsland={selectedIsland}
            systems={systems}
            selectedSystemId={selectedSystemId}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {alertCollection.features.length > 0 && (
            <GeoJSON
              key={alerts.map((alert) => alert.id).join(':')}
              data={alertCollection}
              style={() => ({
                color: '#ff8067',
                fillColor: '#ff8067',
                fillOpacity: 0.13,
                opacity: 0.75,
                weight: 1.5,
                dashArray: '6 5',
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
                  color: isSelected ? '#f0ead7' : island.accent,
                  fillColor: island.accent,
                  fillOpacity: isSelected ? 1 : 0.78,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => onSelectIsland(island.id) }}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={isSelected}>
                  {island.name}
                </Tooltip>
              </CircleMarker>
            );
          })}

          {systems.map((system) => {
            const selected = system.id === selectedSystemId;
            const center: LatLngExpression = [system.latitude, system.longitude];
            return (
              <Fragment key={system.id}>
                <Polyline
                  positions={[center, projectedPosition(system)]}
                  pathOptions={{ color: '#ff8067', weight: selected ? 2 : 1, opacity: selected ? 0.9 : 0.45, dashArray: '5 7' }}
                />
                <CircleMarker
                  center={center}
                  radius={selected ? 11 : 8}
                  pathOptions={{
                    color: selected ? '#fff8e7' : '#ff8067',
                    fillColor: '#d9473f',
                    fillOpacity: 0.9,
                    weight: selected ? 3 : 2,
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
                  </Popup>
                </CircleMarker>
              </Fragment>
            );
          })}
        </MapContainer>

        <div className="map-coordinate">
          <Crosshair size={13} />
          <span>NOAA / NWS operational data</span>
        </div>
        <div className="map-legend" aria-label="Map legend">
          <span><i className="legend-dot legend-dot--island" /> Island station</span>
          <span><i className="legend-dot legend-dot--storm" /> Tropical system</span>
          <span><i className="legend-line" /> Alert area</span>
        </div>
      </div>
    </section>
  );
}
