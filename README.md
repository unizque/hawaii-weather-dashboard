# Pacific Signal

Pacific Signal is a Hawaiʻi-first weather and tropical-cyclone dashboard with an original **Pacific Broadcast Modern** interface. It combines the clarity of an operational weather desk with restrained cues from classic broadcast graphics.

> **Educational project:** Pacific Signal is not an official warning service. During hazardous weather, follow guidance from the National Weather Service, local authorities, and emergency management.

## Capabilities

- Live point forecasts and latest observations for Kauaʻi, Oʻahu, Molokaʻi, Maui, and Hawaiʻi Island
- Statewide NWS watches, warnings, and advisories with full in-app details and official product links
- Dedicated tropical weather center with official forecast cones, forecast points, coastal warnings, and advisory links
- Selected ATCF model-guidance tracks, clearly separated from the official NHC/CPHC forecast
- Smooth two-hour NWS Hawaiʻi rain-radar loops with incoming frames preloaded before display
- NOAA GOES East/West GeoColor satellite loops for tropical systems across the open Pacific
- NHC-style tropical symbols and D/S/H/M intensity markers along the official forecast track
- Friendly island and Pacific map extents with independent radar, alert, cone, warning, satellite, and guidance controls
- Responsive layouts for desktop, tablet, and mobile
- Automated verification and GitHub Pages deployment

## Architecture

```text
Browser
  ├─ NWS API (forecast, observations, alerts)
  ├─ NHC CurrentStorms.json (live when CORS permits)
  ├─ NWS Hawaiʻi radar WMS (island map; loaded only when selected)
  ├─ NOAA NESDIS GOES ImageServer (tropical map; loaded only when selected)
  └─ Bundled weather cache
       └─ GitHub Actions sync
            ├─ NHC cone / warning KMZ products
            └─ NHC ATCF public model guidance
```

GitHub Pages is a static host, so the application never embeds API secrets. Network access is isolated in typed modules under `src/services`; pure conversions and weather-domain logic live under `src/lib` with unit tests. The scheduled Pages build converts official NHC GIS products to lightweight GeoJSON and refreshes public NOAA products without committing generated data back into the repository.

Model guidance is sourced from NOAA's public ATCF A-decks. It is intentionally hidden by default, limited to selected operational aids, and labeled as guidance rather than an official forecast.

## Local development

Requirements: Node.js 24 and npm.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run check
npm run test
npm run build
```

To refresh the bundled NHC cache:

```bash
npm run sync:data
```

The sync script retains the previous cache when an upstream product is temporarily unavailable.

## Data sources

- [National Weather Service API](https://www.weather.gov/documentation/services-web-api)
- [NWS Honolulu Forecast Office](https://www.weather.gov/hfo/)
- [National Hurricane Center](https://www.nhc.noaa.gov/)
- [NHC GIS products](https://www.nhc.noaa.gov/gis/)
- [NHC ATCF data](https://ftp.nhc.noaa.gov/atcf/README)
- [NWS RIDGE2 radar services](https://www.weather.gov/radarfaq/)
- [NOAA NESDIS satellite maps](https://satellitemaps.nesdis.noaa.gov/arcgis/rest/services)
- [GOES-West imagery](https://www.star.nesdis.noaa.gov/GOES/conus.php?sat=G18)
- [OpenStreetMap](https://www.openstreetmap.org/copyright) map tiles and contributors

All displayed timestamps are converted to Hawaiʻi Standard Time where appropriate. The interface shows useful update times and only raises a data notice when observations are delayed.

## Performance approach

- Radar imagery is off by default and requested only when a visitor enables it.
- Radar and satellite history are sampled to at most 13 frames over two hours.
- Animation keeps the displayed frame in place while the next frame loads, then crossfades between two buffers to prevent blank flashes.
- Hawaiʻi reflectivity stays on the island map; open-ocean tropical tracking uses the merged NOAA GOES East/West satellite service instead of implying local Doppler coverage.
- The tropical workspace is code-split from the island overview.
- Map vectors use Leaflet's canvas renderer and model guidance is capped to selected tracks and five forecast days.
- Tile buffers and animations are intentionally conservative for mobile hardware.
- No client-side charting or GIS parsing libraries are shipped to visitors; NHC KMZ conversion happens during deployment.

## Deployment

The Pages workflow runs after a push to `main`, on manual dispatch, and hourly at minute 17. Before deployment it refreshes the weather cache, runs the test suite, creates a production build, and publishes `dist/` using GitHub's official Pages actions.

The public URL is:

`https://unizque.github.io/hawaii-weather-dashboard/`

## License

MIT
