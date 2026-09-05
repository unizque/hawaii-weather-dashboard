# Repository guidance

## Product principles

- Keep the interface Hawaiʻi-first and surface freshness through useful timestamps or a single degraded-data notice, not repetitive feed badges.
- Never present simulated or fallback values as current observations.
- Preserve the original “Pacific Broadcast Modern” visual language; do not reproduce another weather brand’s protected marks or exact layouts.
- Treat NOAA/NWS/NHC products as authoritative, while retaining the educational-project disclaimer.
- Keep the official forecast visually dominant over model guidance. Model tracks must remain off by default and carry a plain-language disclaimer.
- Alert summaries must open the complete advisory in an accessible on-page dialog and retain a clear official NWS product link.

## Engineering conventions

- Keep network access behind typed modules in `src/services`.
- Keep unit conversion and presentation-independent transformations in `src/lib` with tests.
- Prefer small, accessible React components and semantic HTML.
- Keep optional heavy map layers lazy: radar must be off by default, and tropical-only UI should remain code-split.
- Radar and satellite animation may keep at most two imagery buffers: retain the displayed frame until the incoming frame is loaded, then crossfade and discard the old frame. Pause in hidden tabs and respect reduced-motion preferences.
- Keep Hawaiʻi reflectivity on the island overview. Tropical systems over the open Pacific must use NOAA GOES satellite imagery rather than implying coverage from a local Doppler station.
- Parse and reduce GIS products during the scheduled build rather than in the visitor's browser.
- Do not add client-side secrets. GitHub Pages is a public static host.
- Run `npm run check`, `npm run test`, and `npm run build` before proposing changes.
