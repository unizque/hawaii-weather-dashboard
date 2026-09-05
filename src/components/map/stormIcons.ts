import { divIcon, type DivIcon } from 'leaflet';
import { forecastIntensityCode, stormIntensityTone } from '../../lib/tropical';
import { stormSymbolPaths } from '../StormSymbol';

const stormIcons = new Map<string, DivIcon>();
const forecastIcons = new Map<string, DivIcon>();

function stormSvg(): string {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="${stormSymbolPaths.leading}"/><path d="${stormSymbolPaths.trailing}"/><circle cx="32" cy="32" r="5"/><circle class="storm-map-icon__eye" cx="32" cy="32" r="2"/></svg>`;
}

export function stormMapIcon(intensityKt: number, selected = false): DivIcon {
  const tone = stormIntensityTone(intensityKt);
  const key = `${tone}:${selected ? 'selected' : 'standard'}`;
  const cached = stormIcons.get(key);
  if (cached) return cached;

  const icon = divIcon({
    className: `map-div-icon storm-map-icon storm-map-icon--${tone}${selected ? ' is-selected' : ''}`,
    html: stormSvg(),
    iconSize: selected ? [40, 40] : [34, 34],
    iconAnchor: selected ? [20, 20] : [17, 17],
    popupAnchor: [0, -18],
    tooltipAnchor: [0, -18],
  });
  stormIcons.set(key, icon);
  return icon;
}

export function forecastPointIcon(intensityKt: number | null): DivIcon {
  const code = forecastIntensityCode(intensityKt);
  const cached = forecastIcons.get(code);
  if (cached) return cached;

  const tone = intensityKt === null ? 'unknown' : stormIntensityTone(intensityKt);
  const icon = divIcon({
    className: 'map-div-icon',
    html: `<span class="forecast-intensity forecast-intensity--${tone}">${code}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -13],
    tooltipAnchor: [0, -15],
  });
  forecastIcons.set(code, icon);
  return icon;
}
