function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function textFromTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function blocksForTag(block, tag) {
  return [...block.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`, 'gi'))].map(
    (match) => match[0],
  );
}

function coordinatesFromBlock(block) {
  const raw = textFromTag(block, 'coordinates');
  return raw
    .split(/\s+/)
    .flatMap((tuple) => {
      const [longitude, latitude] = tuple.split(',').map(Number);
      return Number.isFinite(longitude) && Number.isFinite(latitude) ? [[longitude, latitude]] : [];
    });
}

function closedRing(coordinates) {
  if (coordinates.length < 3) return [];
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? coordinates : [...coordinates, first];
}

function polygonGeometry(block) {
  const outerBlock = blocksForTag(block, 'outerBoundaryIs')[0];
  if (!outerBlock) return null;
  const outer = closedRing(coordinatesFromBlock(outerBlock));
  if (outer.length < 4) return null;
  const inner = blocksForTag(block, 'innerBoundaryIs')
    .map((boundary) => closedRing(coordinatesFromBlock(boundary)))
    .filter((ring) => ring.length >= 4);
  return { type: 'Polygon', coordinates: [outer, ...inner] };
}

export function parseKmlFeatures(kml, geometryTypes = ['Polygon', 'LineString', 'Point']) {
  const features = [];
  const placemarks = blocksForTag(kml, 'Placemark');

  placemarks.forEach((placemark, placemarkIndex) => {
    const properties = {
      name: textFromTag(placemark, 'name') || `Product ${placemarkIndex + 1}`,
      description: textFromTag(placemark, 'description'),
    };

    if (geometryTypes.includes('Polygon')) {
      blocksForTag(placemark, 'Polygon').forEach((polygon, geometryIndex) => {
        const geometry = polygonGeometry(polygon);
        if (geometry) features.push({ type: 'Feature', id: `polygon-${placemarkIndex}-${geometryIndex}`, properties, geometry });
      });
    }

    if (geometryTypes.includes('LineString')) {
      blocksForTag(placemark, 'LineString').forEach((line, geometryIndex) => {
        const coordinates = coordinatesFromBlock(line);
        if (coordinates.length >= 2) {
          features.push({
            type: 'Feature',
            id: `line-${placemarkIndex}-${geometryIndex}`,
            properties,
            geometry: { type: 'LineString', coordinates },
          });
        }
      });
    }

    if (geometryTypes.includes('Point')) {
      blocksForTag(placemark, 'Point').forEach((point, geometryIndex) => {
        const coordinate = coordinatesFromBlock(point)[0];
        if (coordinate) {
          features.push({
            type: 'Feature',
            id: `point-${placemarkIndex}-${geometryIndex}`,
            properties,
            geometry: { type: 'Point', coordinates: coordinate },
          });
        }
      });
    }
  });

  return { type: 'FeatureCollection', features };
}
