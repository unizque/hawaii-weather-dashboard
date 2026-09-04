# Repository guidance

## Product principles

- Keep the interface Hawaiʻi-first and clearly distinguish live, cached, preview, and unavailable data.
- Never present simulated or fallback values as current observations.
- Preserve the original “Pacific Broadcast Modern” visual language; do not reproduce another weather brand’s protected marks or exact layouts.
- Treat NOAA/NWS/NHC products as authoritative, while retaining the educational-project disclaimer.

## Engineering conventions

- Keep network access behind typed modules in `src/services`.
- Keep unit conversion and presentation-independent transformations in `src/lib` with tests.
- Prefer small, accessible React components and semantic HTML.
- Do not add client-side secrets. GitHub Pages is a public static host.
- Run `npm run check`, `npm run test`, and `npm run build` before proposing changes.
