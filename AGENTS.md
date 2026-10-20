# AGENTS.md — national-parks

Bucket-list tracker for all 63 U.S. national parks, live at https://parks.rishimohnot.com.
Vite + React + TS static site on Cloudflare Pages (project `national-parks`). Spec and plan in `docs/superpowers/`.
Follow the workspace policy in `/Users/rishi/Projects/AGENTS.md`.

## Commands
npm run dev | npm test | npm run build | npm run deploy
npm run parks:build      # data/sources/{sheet,enrichment}.json → src/data/parks.json
npm run geo:fetch        # NPS boundaries → data/sources/nps-boundaries.geojson (network)
npm run geo:build        # → src/data/boundaries.json
npm run heroes:fetch     # hero photos → src/assets/hero/ (network)
npm run photos:add -- <park-id> <visit-number> <files…>
npm run art:add -- <park-id> <image-file>
npm run art:sheet -- <sheet-image>   # 8x8 sheet of round badges in parks.json order -> all art at once

Local installs: this Mac has Homebrew libvips, which makes `sharp` try a source build. Run
`SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install` (or `npm ci`) to use sharp's prebuilt binary.

## Adding a visit
Edit `src/data/visits.ts` — one object per trip: `{ park: "zion", start: "2021-05", with: ["Sam"], note: "…" }`.
Dates may be "YYYY", "YYYY-MM" or "YYYY-MM-DD"; omit `start` for "Date TBD". Then `npm run photos:add` for
photos, `npm test`, commit, push.

## Data rules
- `src/data/parks.json` is generated — edit `data/sources/enrichment.json` and rerun `npm run parks:build`.
- Facts in our own words; hero photos public domain only. Visit photos only via `photos:add` (strips EXIF/GPS).
- Missing art falls back to `src/assets/icons/<kind>.svg`.
