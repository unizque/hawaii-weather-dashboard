# Pacific Signal

Pacific Signal is a Hawaiʻi-first weather and tropical-cyclone dashboard with an original **Pacific Broadcast Modern** interface. It combines the clarity of an operational weather desk with restrained cues from classic broadcast graphics.

> **Educational project:** Pacific Signal is not an official warning service. During hazardous weather, follow guidance from the National Weather Service, local authorities, and emergency management.

## First-build capabilities

- Live point forecasts and latest observations for Kauaʻi, Oʻahu, Molokaʻi, Maui, and Hawaiʻi Island
- Statewide NWS watches, warnings, advisories, and map geometry
- Current Central and Eastern Pacific tropical systems from the National Hurricane Center
- NDBC buoy observations refreshed during the GitHub Pages build
- Island and Pacific map extents with storm motion vectors
- Explicit Live, Cached, Preview, and Offline data states
- Responsive layouts for desktop, tablet, and mobile
- Automated verification and GitHub Pages deployment

## Architecture

```text
Browser
  ├─ NWS API (forecast, observations, alerts)
  ├─ NHC CurrentStorms.json (live when CORS permits)
  └─ Bundled weather cache
       └─ GitHub Actions sync (NHC + NDBC)
```

GitHub Pages is a static host, so the application never embeds API secrets. Network access is isolated in typed modules under `src/services`; pure conversions and weather-domain logic live under `src/lib` with unit tests. The scheduled Pages build refreshes public NOAA products without committing generated data back into the repository.

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

To refresh the bundled NHC and NDBC cache:

```bash
npm run sync:data
```

The sync script retains the previous cache when an upstream product is temporarily unavailable.

## Data sources

- [National Weather Service API](https://www.weather.gov/documentation/services-web-api)
- [NWS Honolulu Forecast Office](https://www.weather.gov/hfo/)
- [National Hurricane Center](https://www.nhc.noaa.gov/)
- [National Data Buoy Center](https://www.ndbc.noaa.gov/)
- [OpenStreetMap](https://www.openstreetmap.org/copyright) map tiles and contributors

All displayed timestamps are converted to Hawaiʻi Standard Time where appropriate. Source timestamps and feed state remain visible so stale or fallback data cannot be mistaken for a current observation.

## Deployment

The Pages workflow runs after a push to `main`, on manual dispatch, and hourly at minute 17. Before deployment it refreshes the weather cache, runs the test suite, creates a production build, and publishes `dist/` using GitHub's official Pages actions.

After merging the initial pull request, enable deployment in **Repository Settings → Pages → Build and deployment → GitHub Actions**. The expected URL is:

`https://unizque.github.io/hawaii-weather-dashboard/`

## License

MIT
