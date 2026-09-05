const guidanceGroups = [
  { id: 'consensus', name: 'NHC consensus', kind: 'consensus', techniques: ['HCCA', 'TVCN', 'TVCE'] },
  { id: 'gfs', name: 'GFS', kind: 'global', techniques: ['AVNO', 'AVNI', 'AVN2'] },
  { id: 'ecmwf', name: 'ECMWF', kind: 'global', techniques: ['EMX', 'EMXI', 'EMH', 'EMHI', 'ECM', 'ECMI'] },
  { id: 'hafsa', name: 'HAFS-A', kind: 'hurricane', techniques: ['HAFA', 'HFAI', 'HFA2'] },
  { id: 'hafsb', name: 'HAFS-B', kind: 'hurricane', techniques: ['HAFB', 'HFBI', 'HFB2'] },
  { id: 'ukmet', name: 'UKMET', kind: 'global', techniques: ['EGRR', 'UKMI', 'UKM2'] },
  { id: 'cmc', name: 'Canadian', kind: 'global', techniques: ['CMC', 'CMCI', 'CMC2'] },
];

function parseCoordinate(value) {
  const match = value.trim().match(/^(\d+)([NSEW])$/i);
  if (!match) return null;

  const magnitude = Number(match[1]) / 10;
  if (!Number.isFinite(magnitude)) return null;
  return match[2].toUpperCase() === 'S' || match[2].toUpperCase() === 'W' ? -magnitude : magnitude;
}

function parseCycle(value) {
  if (!/^\d{10}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month, day, hour));
  return Number.isNaN(date.getTime()) ? null : date;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseAtcfRecords(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      const fields = line.split(',').map((field) => field.trim());
      const initializedAt = parseCycle(fields[2] ?? '');
      const technique = fields[4] ?? '';
      const tauHours = Number(fields[5]);
      const latitude = parseCoordinate(fields[6] ?? '');
      const longitude = parseCoordinate(fields[7] ?? '');

      if (!initializedAt || !technique || !Number.isFinite(tauHours) || latitude === null || longitude === null) {
        return [];
      }

      return [{
        technique,
        initializedAt: initializedAt.toISOString(),
        tauHours,
        latitude,
        longitude,
        intensityKt: numberOrNull(fields[8]),
        pressureMb: numberOrNull(fields[9]),
      }];
    });
}

function latestTrack(records, techniques) {
  const candidates = records.filter(
    (record) => techniques.includes(record.technique) && record.tauHours >= 0 && record.tauHours <= 120,
  );
  if (candidates.length === 0) return null;

  const latestInitialization = candidates.reduce(
    (latest, record) => (record.initializedAt > latest ? record.initializedAt : latest),
    candidates[0].initializedAt,
  );
  const latestCandidates = candidates.filter((record) => record.initializedAt === latestInitialization);
  const technique = techniques.find((candidate) => latestCandidates.some((record) => record.technique === candidate));
  if (!technique) return null;

  const byTau = new Map();
  latestCandidates
    .filter((record) => record.technique === technique)
    .sort((a, b) => a.tauHours - b.tauHours)
    .forEach((record) => {
      if (!byTau.has(record.tauHours)) byTau.set(record.tauHours, record);
    });

  return {
    initializedAt: latestInitialization,
    points: [...byTau.values()].map(({ technique: _technique, initializedAt, ...point }) => ({
      ...point,
      validAt: new Date(new Date(initializedAt).getTime() + point.tauHours * 3_600_000).toISOString(),
    })),
  };
}

export function parseAtcfGuidance(text) {
  const records = parseAtcfRecords(text);
  const official = latestTrack(records, ['OFCL']);
  const guidance = guidanceGroups.flatMap((group) => {
    const track = latestTrack(records, group.techniques);
    return track && track.points.length >= 2
      ? [{ id: group.id, name: group.name, kind: group.kind, ...track }]
      : [];
  });

  return {
    forecast: official?.points ?? [],
    guidance: guidance.slice(0, 6),
  };
}
