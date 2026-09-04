import { useEffect, useMemo } from 'react';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { LatLngBoundsExpression, LatLngExpression, PathOptions } from 'leaflet';
import { CircleMarker, GeoJSON, MapContainer, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import { islands } from '../data/islands';
import { modelColors, warningColor } from '../lib/tropical';
import { stormCategory } from '../lib/weather';
import type { BuoyReading, TropicalForecastPoint, TropicalSystem, WeatherAlert } from '../types/weather';
import { BaseMapLayers } from './map/BaseMapLayers';
import { BuoyMarkers } from './map/BuoyMarkers';

export interface TropicalLayerState {
  cone: boolean;
  officialTrack: boolean;
  guidance: boolean;
  warnings: boolean;
  radar: boolean;
  buoys: boolean;
}

interface TropicalMapProps {
  system: TropicalSystem;
  alerts: WeatherAlert[];
  buoys: BuoyReading[];
  layers: TropicalLayerState;
}

function pointPosition(point: TropicalForecastPoint): LatLngExpression {
  return [point.latitude, point.longitude];
}

function collectCoordinates(value: unknown, output: LatLngExpression[]): void {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    output.push([value[1], value[0]]);
    return;
  }
  value.forEach((child) => collectCoordinates(child, output));
}

function collectGeometryCoordinates(geometry: Geometry, output: LatLngExpression[]): void {
  if ('coordinates' in geometry) {
    collectCoordinates(geometry.coordinates, output);
    return;
  }
  geometry.geometries.forEach((child) => collectGeometryCoordinates(child, output));
}

function TropicalMapController({ system }: { system: TropicalSystem }) {
  const map = useMap();

  useEffect(() => {
    const positions: LatLngExpression[] = [[system.latitude, system.longitude]];
    system.products.forecast.forEach((point) => positions.push(pointPosition(point)));
    system.products.cone?.features.forEach((feature) => collectGeometryCoordinates(feature.geometry, positions));

    if (positions.length > 1) {
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [34, 34], maxZoom: 6, animate: false });
    } else {
      map.setView([system.latitude, system.longitude], 5, { animate: false });
    }
  }, [map, system]);

  return null;
}

function createWarningCollection(
  system: TropicalSystem,
  alerts: WeatherAlert[],
): FeatureCollection<Geometry, GeoJsonProperties> {
  const nwsFeatures: Array<Feature<Geometry, GeoJsonProperties>> = alerts
    .filter((alert) => alert.geometry && /hurricane|tropical storm/i.test(alert.event))
    .map((alert) => ({
      type: 'Feature',
      id: alert.id,
      geometry: alert.geometry!,
      properties: { name: alert.event, description: alert.headline },
    }));

  return {
    type: 'FeatureCollection',
    features: [...(system.products.warnings?.features ?? []), ...nwsFeatures],
  };
}

function warningStyle(feature?: Feature<Geometry, GeoJsonProperties>): PathOptions {
  const name = String(feature?.properties?.name ?? 'Tropical warning');
  const color = warningColor(name);
  return { color, fillColor: color, fillOpacity: 0.2, opacity: 0.95, weight: 3, dashArray: '8 5' };
}

export function TropicalMap({ system, alerts, buoys, layers }: TropicalMapProps) {
  const warnings = useMemo(() => createWarningCollection(system, alerts), [alerts, system]);
  const officialPositions: LatLngExpression[] = [
    [system.latitude, system.longitude],
    ...system.products.forecast.filter((point) => point.tauHours > 0).map(pointPosition),
  ];

  return (
    <div className="tropical-map-stage">
      <MapContainer
        center={[system.latitude, system.longitude]}
        zoom={5}
        minZoom={2}
        maxZoom={10}
        attributionControl
        preferCanvas
        fadeAnimation={false}
        markerZoomAnimation={false}
        worldCopyJump
      >
        <TropicalMapController system={system} />
        <BaseMapLayers radarEnabled={layers.radar} />

        {layers.cone && system.products.cone && (
          <GeoJSON
            key={`cone-${system.id}-${system.advisoryNumber ?? 'current'}`}
            data={system.products.cone}
            style={{ color: '#314c5e', fillColor: '#ffffff', fillOpacity: 0.58, opacity: 0.95, weight: 2 }}
          />
        )}

        {layers.warnings && warnings.features.length > 0 && (
          <GeoJSON
            key={`warnings-${system.id}-${warnings.features.length}`}
            data={warnings}
            style={warningStyle}
          />
        )}

        {layers.guidance && system.products.guidance.map((track) => (
          <Polyline
            key={`${system.id}-${track.id}-${track.initializedAt}`}
            positions={track.points.map(pointPosition)}
            pathOptions={{
              color: modelColors[track.id] ?? '#5e6870',
              weight: track.kind === 'consensus' ? 3 : 2,
              opacity: track.kind === 'consensus' ? 0.95 : 0.78,
              dashArray: track.kind === 'consensus' ? undefined : '7 5',
            }}
          >
            <Tooltip sticky>{track.name} guidance</Tooltip>
          </Polyline>
        ))}

        {layers.officialTrack && officialPositions.length > 1 && (
          <Polyline positions={officialPositions} pathOptions={{ color: '#172f40', weight: 4, opacity: 0.96 }} />
        )}

        {layers.officialTrack && system.products.forecast.map((point) => (
          <CircleMarker
            key={`${system.id}-forecast-${point.tauHours}`}
            center={pointPosition(point)}
            radius={point.tauHours === 0 ? 7 : 5}
            pathOptions={{
              color: '#ffffff',
              fillColor: (point.intensityKt ?? 0) >= 64 ? '#c72f42' : '#e17a38',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} permanent={point.tauHours % 24 === 0}>
              {point.tauHours === 0 ? 'Now' : `${point.tauHours}h`} · {point.intensityKt ?? '—'} kt
            </Tooltip>
            <Popup>
              <strong>{point.tauHours === 0 ? 'Current position' : `${point.tauHours}-hour forecast`}</strong>
              <br />
              {point.intensityKt === null ? 'Intensity unavailable' : `${stormCategory(point.intensityKt)} · ${point.intensityKt} kt`}
            </Popup>
          </CircleMarker>
        ))}

        <CircleMarker
          center={[system.latitude, system.longitude]}
          radius={10}
          pathOptions={{ color: '#ffffff', fillColor: '#c72f42', fillOpacity: 1, weight: 3 }}
        >
          <Tooltip direction="top" offset={[0, -9]} permanent>{system.name}</Tooltip>
        </CircleMarker>

        {islands.map((island) => (
          <CircleMarker
            key={island.id}
            center={[island.latitude, island.longitude]}
            radius={4}
            pathOptions={{ color: '#ffffff', fillColor: '#16789f', fillOpacity: 0.95, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>{island.name}</Tooltip>
          </CircleMarker>
        ))}

        {layers.buoys && <BuoyMarkers buoys={buoys} />}
      </MapContainer>

      {layers.radar && (
        <div className="radar-legend" aria-label="Radar reflectivity legend">
          <span>Light rain</span><i /><i /><i /><i /><span>Heavy</span>
        </div>
      )}
      <div className="tropical-map-key">
        <span><i className="key-line key-line--official" /> Official forecast</span>
        {layers.cone && <span><i className="key-box key-box--cone" /> Forecast cone</span>}
        {layers.warnings && <span><i className="key-box key-box--warning" /> Watches / warnings</span>}
      </div>
    </div>
  );
}
