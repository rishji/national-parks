# National Parks Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `parks.rishimohnot.com` — a static, colorful map-first site tracking Rishi's visits to all 63 U.S. national parks.

**Architecture:** Vite + React + TypeScript static SPA. Park facts are compiled once (from Rishi's sheet + researched enrichment) into `src/data/parks.json`; park footprints are simplified lon/lat TopoJSON projected at runtime with `d3-geo`; visits live in a hand-edited `src/data/visits.ts`. A pure callout-layout module places badges in screen space per zoom level. Deployed to Cloudflare Pages.

**Tech Stack:** Node 22+, Vite 6, React 18.3, TypeScript 5.8, Vitest 3 + Testing Library + jsdom, d3-geo/d3-zoom/d3-selection 3, topojson-client/server/simplify 3, sharp, vite-imagetools 7, tsx, prettier, wrangler (global, already authed).

**Spec:** `docs/superpowers/specs/2026-10-19-national-parks-design.md` — read it before starting any task.
**Mockup:** https://claude.ai/artifact/8wKFZrc4sL7CP9bn3pCsPf (palette, badge styling, header, panel look).
**Already in the repo (copied from the brainstorming session):** `src/assets/icons/*.svg` (17 placeholder icons), `src/data/states-albers-10m.json` (us-atlas@3.0.1 states, pre-projected with `geoAlbersUsa().scale(1300).translate([487.5, 305])`), `data/sources/sheet.json` (Rishi's sheet rows incl. header; source: Google Sheet `1VZ71wra2M4h5DOHP_VnG8JOMffmSYb9pdhm20uOFTpU`), `docs/mockup/build-mock.mjs` (mockup generator; its `KIND` table is the initial icon assignment). Tasks that say "copy" these are already done — just verify they exist.

## Global Constraints

- Exactly **63** parks. Park ids are lowercase ASCII slugs with diacritics/ʻokina removed (`haleakala`, `hawaii-volcanoes`, `wrangell-st-elias`).
- Palette (verbatim): Paper `#F6EEDC`, Ink `#1E2A2F`, Ocean `#0F4C5C`, Sunset `#F26B38`, Canyon `#C8402E`, Pine `#1F5A3D`, Sky `#7FC8D9`, Gold `#F2B33D`, Blush `#F29C8F`, Dusk `#6B4E8C`. Small accent text uses `#A8321F`; never small Sunset/Gold text on Paper.
- Fonts: Zilla Slab (display, 500/600/700) + Figtree (body, 400–700) from Google Fonts. Light mode only.
- State is **not** shown in the park panel. State names + borders **are** shown on the map, light.
- Visited park panel order: header → **Your visits** → hero → description → highlights → stats → getting there.
- Undated visits display **"Date TBD"**. A park is visited iff it has ≥1 visit.
- All motion disabled under `prefers-reduced-motion: reduce`.
- Facts are written in our own words; no copied text/images from Earth Trekkers or other copyrighted sources. Hero photos must be public domain (NPS / PD-USGov).
- Visit photos are committed only as web-sized, metadata-stripped copies (max 2400px).
- Asset path change vs. spec (needed so Vite can detect which files exist): art lives in `src/assets/art/<id>.webp`, hero photos in `src/assets/hero/<id>.jpg`, icons in `src/assets/icons/<kind>.svg`. Visit photos stay in `photos/<park>/`.
- Leader lines are straight diagonal segments (anchor dot → badge edge); "angled" in the spec means diagonal, not elbowed.
- Network downloads and the production DNS change require Rishi's explicit OK at execution time (home policy).
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01CUHB2747SCuGUKRLL5N3Cp
  ```

## Review Focus

1. **A park with several visits, some undated** — expect dated visits newest-first, undated after them, in the panel; timeline puts undated in the "Date TBD" group. (Test: Task 2 `sortVisitsNewestFirst` + Task 9 panel test.)
2. **A stale or unknown `#hash` (e.g. `#foo`, or a renamed id)** — expect the map with no panel, no crash. (Test: Task 10 App test.)
3. **Bad visit data: end before start, malformed date, unknown park, listed photo file missing** — expect the test suite (and so CI) to fail with a message naming the visit. (Test: Task 3 data tests.)
4. **Zoomed in so some anchors are off-screen, or a narrow viewport** — expect off-screen badges hidden, no overlaps, nothing outside the frame. (Test: Task 6 layout tests at 1216px and 358px widths and with off-frame anchors.)
5. **Names with diacritics/ʻokina (Haleakalā, Hawaiʻi Volcanoes)** — expect correct display, ASCII ids, and alphabetical sort by display name. (Test: Task 2 `slugify`, Task 8 grid sort.)

---

## File Structure

```
national-parks/
  index.html                       # fonts, root
  package.json, tsconfig.json, vite.config.ts, .prettierrc, .gitignore
  AGENTS.md, CLAUDE.md (→ "See AGENTS.md")
  .github/workflows/ci.yml
  data/sources/
    sheet.json                     # Rishi's sheet (Sheets API JSON), committed
    enrichment.json                # researched facts for 63 parks, committed
    nps-boundaries.geojson         # raw download, gitignored
  scripts/
    build-parks.ts                 # sheet + enrichment → src/data/parks.json
    fetch-boundaries.ts            # NPS boundaries → data/sources/nps-boundaries.geojson
    build-geo.ts                   # raw boundaries → src/data/boundaries.json (simplified lon/lat TopoJSON)
    fetch-heroes.ts                # enrichment hero URLs → src/assets/hero/<id>.jpg
    photos-add.ts                  # resize+strip photos, register in visits.ts
    art-add.ts                     # generated art → src/assets/art/<id>.webp
    lib/visitsSource.ts            # pure source-editing for photos-add
  src/
    main.tsx, App.tsx, vite-env.d.ts
    data/types.ts, parks.json, boundaries.json, states-albers-10m.json, visits.ts
    lib/slug.ts, dates.ts, stats.ts, projection.ts, geo.ts, stateLabels.ts, callouts.ts, assets.ts, useHashSelection.ts
    components/Header.tsx, Controls.tsx, MapView.tsx, ParkPanel.tsx, VisitCard.tsx, PhotoViewer.tsx, GridView.tsx, Timeline.tsx, ParkArt.tsx
    styles/tokens.css, global.css
    assets/icons/*.svg, assets/art/, assets/hero/
  photos/<park>/                   # visit photos
  docs/art-prompts.md
  tests/ (colocated *.test.ts(x) next to sources instead — see each task)
```

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.prettierrc`, `.gitignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/styles/tokens.css`, `src/styles/global.css`, `src/test-setup.ts`, `src/App.test.tsx`, `AGENTS.md`, `CLAUDE.md`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `npm test`, `npm run build`, `npm run dev`; CSS custom properties `--paper --ink --ocean --sunset --canyon --pine --sky --gold --blush --dusk --accent-text --font-display --font-body`.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "national-parks",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "parks:build": "tsx scripts/build-parks.ts",
    "geo:fetch": "tsx scripts/fetch-boundaries.ts",
    "geo:build": "tsx scripts/build-geo.ts",
    "heroes:fetch": "tsx scripts/fetch-heroes.ts",
    "photos:add": "tsx scripts/photos-add.ts",
    "art:add": "tsx scripts/art-add.ts",
    "deploy": "npm run build && wrangler pages deploy dist --project-name national-parks"
  }
}
```

- [ ] **Step 2: Install dependencies** (package installs — ask Rishi once for approval of this step)

```bash
cd ~/Projects/national-parks
npm install react@18.3.1 react-dom@18.3.1 d3-geo@3 d3-zoom@3 d3-selection@3 d3-transition@3 topojson-client@3
npm install -D typescript@5.8 vite@6 @vitejs/plugin-react@4 vitest@3 jsdom@26 @testing-library/react@16 @testing-library/dom@10 @testing-library/jest-dom@6 @testing-library/user-event@14 @types/react@18 @types/react-dom@18 @types/d3-geo@3 @types/d3-zoom@3 @types/d3-selection@3 @types/d3-transition@3 @types/topojson-client@3 @types/topojson-server@3 @types/topojson-simplify@3 @types/topojson-specification@1 @types/geojson topojson-server@3 topojson-simplify@3 sharp@0.34 vite-imagetools@7 tsx@4 prettier@3 exifr@7 @types/node@22
```

- [ ] **Step 3: Config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom", "node"]
  },
  "include": ["src", "scripts"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";

export default defineConfig({
  base: "/",
  plugins: [react(), imagetools()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
  },
});
```

`.prettierrc`: `{ "printWidth": 110 }`

`.gitignore`:
```
node_modules
dist
data/sources/nps-boundaries.geojson
.DS_Store
.wrangler
```

`src/test-setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom lacks ResizeObserver
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
```

`src/vite-env.d.ts`: `/// <reference types="vite/client" />`

- [ ] **Step 4: index.html, tokens, global CSS, entry**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rishi's National Parks</title>
    <meta name="description" content="Tracking a bucket list: all 63 U.S. national parks." />
    <link rel="icon" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Zilla+Slab:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Copy the mockup's mountain icon as `public/favicon.svg`:
```bash
mkdir -p public && cp src/assets/icons/mountain.svg public/favicon.svg
```

`src/styles/tokens.css`:
```css
:root {
  --paper: #f6eedc;
  --paper-2: #efe3c8;
  --card: #fff8ea;
  --ink: #1e2a2f;
  --ink-soft: #4a5559;
  --ocean: #0f4c5c;
  --sunset: #f26b38;
  --canyon: #c8402e;
  --pine: #1f5a3d;
  --sky: #7fc8d9;
  --gold: #f2b33d;
  --blush: #f29c8f;
  --dusk: #6b4e8c;
  --sand: #e9d3a8;
  --accent-text: #a8321f;
  --font-display: "Zilla Slab", Georgia, serif;
  --font-body: Figtree, system-ui, sans-serif;
  --shadow-hard: 6px 6px 0 var(--ink);
  --radius: 16px;
}
```

`src/styles/global.css`:
```css
@import "./tokens.css";

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font-body); }
a { color: var(--accent-text); }
a:hover { color: #7e2414; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
h1, h2, h3 { font-family: var(--font-display); margin: 0; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (placeholder replaced in Task 10):
```tsx
export default function App() {
  return <h1>Rishi's National Parks</h1>;
}
```

- [ ] **Step 5: Smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the site title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Rishi's National Parks");
});
```

Run: `npm test` → Expected: 1 passed. Run: `npm run build` → Expected: `dist/index.html` produced, no TS errors.

- [ ] **Step 6: CI, AGENTS.md, CLAUDE.md**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: ["main"]
  pull_request:
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
```

`CLAUDE.md`: `See [AGENTS.md](AGENTS.md).`

`AGENTS.md`:
```markdown
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

## Adding a visit
Edit `src/data/visits.ts` — one object per trip: `{ park: "zion", start: "2021-05", with: ["Sam"], note: "…" }`.
Dates may be "YYYY", "YYYY-MM" or "YYYY-MM-DD"; omit `start` for "Date TBD". Then `npm run photos:add` for
photos, `npm test`, commit, push.

## Data rules
- `src/data/parks.json` is generated — edit `data/sources/enrichment.json` and rerun `npm run parks:build`.
- Facts in our own words; hero photos public domain only. Visit photos only via `photos:add` (strips EXIF/GPS).
- Missing art falls back to `src/assets/icons/<kind>.svg`.
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TS project with CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CUHB2747SCuGUKRLL5N3Cp"
```

---

### Task 2: Types, slug, and date helpers

**Files:**
- Create: `src/data/types.ts`, `src/lib/slug.ts`, `src/lib/dates.ts`
- Test: `src/lib/slug.test.ts`, `src/lib/dates.test.ts`

**Interfaces:**
- Produces:
  - `type IconKind`, `const ICON_KINDS: readonly IconKind[]` (17), `type Region`, `const REGIONS: readonly Region[]`
  - `interface Park`, `interface Visit`, `type PartialDate = string`
  - `slugify(name: string): string`
  - `parsePartialDate(s: string): { y: number; m?: number; d?: number }` (throws `Error("Invalid date: …")`)
  - `dateSortKey(s: string, edge: "start" | "end"): string` → `"YYYY-MM-DD"`
  - `formatVisitDates(start?: string, end?: string): string`
  - `sortVisitsNewestFirst(visits: Visit[]): Visit[]`
  - `sortVisitsChronological(visits: Visit[]): { dated: Visit[]; undated: Visit[] }`

- [ ] **Step 1: Write types**

`src/data/types.ts`:
```ts
export const ICON_KINDS = [
  "mountain", "volcano", "lake", "canyon", "arch", "cave", "forest", "sequoia", "glacier",
  "dunes", "coast", "swamp", "geyser", "island", "desert", "waterfall", "hoodoo",
] as const;
export type IconKind = (typeof ICON_KINDS)[number];

export const REGIONS = [
  "Alaska", "Pacific Northwest", "California & Nevada", "Southwest", "Rocky Mountains",
  "Great Plains", "Midwest", "South", "East", "Hawaiʻi & Pacific", "Caribbean",
] as const;
export type Region = (typeof REGIONS)[number];

/** "YYYY" | "YYYY-MM" | "YYYY-MM-DD" — validated by parsePartialDate and the data tests. */
export type PartialDate = string;

export interface Park {
  id: string;
  name: string;
  npsCode: string;
  lat: number;
  lon: number;
  states: string[];
  region: Region;
  established: string; // ISO YYYY-MM-DD
  acres: number;
  visitors: number;
  visitorsYear: number;
  sizeRank: number;
  visitorRank: number;
  description: string;
  highlights: string[];
  bestSeason: string;
  nearestAirport: string;
  npsUrl: string;
  kind: IconKind;
  heroPhoto: { credit: string; sourceUrl: string };
  sources: string[];
}

export interface Visit {
  park: string;
  start?: PartialDate;
  end?: PartialDate;
  with?: string[];
  note?: string;
  photos?: string[];
}
```

- [ ] **Step 2: Write failing tests**

`src/lib/slug.test.ts`:
```ts
import { slugify } from "./slug";

test.each([
  ["Zion", "zion"],
  ["Haleakalā", "haleakala"],
  ["Hawaiʻi Volcanoes", "hawaii-volcanoes"],
  ["Wrangell–St. Elias", "wrangell-st-elias"],
  ["Black Canyon of the Gunnison", "black-canyon-of-the-gunnison"],
  ["Carlsbad Caverns *", "carlsbad-caverns"],
])("slugify(%s) = %s", (input, out) => expect(slugify(input)).toBe(out));
```

`src/lib/dates.test.ts`:
```ts
import { dateSortKey, formatVisitDates, parsePartialDate, sortVisitsChronological, sortVisitsNewestFirst } from "./dates";

test("parsePartialDate accepts year, month, day", () => {
  expect(parsePartialDate("2021")).toEqual({ y: 2021 });
  expect(parsePartialDate("2021-05")).toEqual({ y: 2021, m: 5 });
  expect(parsePartialDate("2021-05-28")).toEqual({ y: 2021, m: 5, d: 28 });
});

test.each(["21", "2021-5", "2021-13", "2021-02-30", "May 2021", ""])("parsePartialDate rejects %s", (s) => {
  expect(() => parsePartialDate(s)).toThrow(/Invalid date/);
});

test("dateSortKey fills missing parts by edge", () => {
  expect(dateSortKey("2021", "start")).toBe("2021-01-01");
  expect(dateSortKey("2021", "end")).toBe("2021-12-31");
  expect(dateSortKey("2021-02", "end")).toBe("2021-02-28");
  expect(dateSortKey("2024-02", "end")).toBe("2024-02-29");
});

test.each([
  [undefined, undefined, "Date TBD"],
  ["2021", undefined, "2021"],
  ["2021-05", undefined, "May 2021"],
  ["2021-05-28", undefined, "May 28, 2021"],
  ["2021-05-28", "2021-05-30", "May 28–30, 2021"],
  ["2021-05-28", "2021-06-02", "May 28 – Jun 2, 2021"],
  ["2021-12-30", "2022-01-02", "Dec 30, 2021 – Jan 2, 2022"],
  ["2021-05", "2021-06", "May – Jun 2021"],
  ["2021-05-28", "2021-05-28", "May 28, 2021"],
])("formatVisitDates(%s, %s) = %s", (s, e, out) => expect(formatVisitDates(s, e)).toBe(out));

test("sortVisitsNewestFirst puts dated newest first and undated last, stable", () => {
  const v = [
    { park: "a" },
    { park: "b", start: "2019" },
    { park: "c", start: "2023-04" },
    { park: "d" },
    { park: "e", start: "2021-07-04" },
  ];
  expect(sortVisitsNewestFirst(v).map((x) => x.park)).toEqual(["c", "e", "b", "a", "d"]);
});

test("sortVisitsChronological splits undated out", () => {
  const v = [{ park: "a" }, { park: "b", start: "2023" }, { park: "c", start: "2019-02" }];
  const r = sortVisitsChronological(v);
  expect(r.dated.map((x) => x.park)).toEqual(["c", "b"]);
  expect(r.undated.map((x) => x.park)).toEqual(["a"]);
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/lib` → Expected: FAIL (modules not found).

- [ ] **Step 4: Implement**

`src/lib/slug.ts`:
```ts
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯʻ‘’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

`src/lib/dates.ts`:
```ts
import type { Visit } from "../data/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const pad = (n: number) => String(n).padStart(2, "0");

export function parsePartialDate(s: string): { y: number; m?: number; d?: number } {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s);
  if (!match) throw new Error(`Invalid date: "${s}"`);
  const y = +match[1];
  const m = match[2] ? +match[2] : undefined;
  const d = match[3] ? +match[3] : undefined;
  if (m !== undefined && (m < 1 || m > 12)) throw new Error(`Invalid date: "${s}"`);
  if (d !== undefined && (d < 1 || d > daysIn(y, m!))) throw new Error(`Invalid date: "${s}"`);
  return d !== undefined ? { y, m, d } : m !== undefined ? { y, m } : { y };
}

export function dateSortKey(s: string, edge: "start" | "end"): string {
  const { y, m, d } = parsePartialDate(s);
  const mm = m ?? (edge === "start" ? 1 : 12);
  const dd = d ?? (edge === "start" ? 1 : daysIn(y, mm));
  return `${y}-${pad(mm)}-${pad(dd)}`;
}

function fmt(s: string, withYear = true): string {
  const { y, m, d } = parsePartialDate(s);
  if (m === undefined) return String(y);
  if (d === undefined) return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
  return withYear ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}`;
}

export function formatVisitDates(start?: string, end?: string): string {
  if (!start) return "Date TBD";
  if (!end || end === start) return fmt(start);
  const a = parsePartialDate(start);
  const b = parsePartialDate(end);
  const sameYear = a.y === b.y;
  if (sameYear && a.d !== undefined && b.d !== undefined && a.m === b.m) {
    return `${MONTHS[a.m! - 1]} ${a.d}–${b.d}, ${a.y}`;
  }
  if (sameYear && a.m !== undefined && b.m !== undefined && a.d === undefined && b.d === undefined) {
    return `${MONTHS[a.m - 1]} – ${MONTHS[b.m - 1]} ${a.y}`;
  }
  if (sameYear && a.d !== undefined && b.d !== undefined) return `${fmt(start, false)} – ${fmt(end)}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function sortVisitsNewestFirst<T extends Visit>(visits: T[]): T[] {
  const dated = visits.filter((v) => v.start);
  const undated = visits.filter((v) => !v.start);
  dated.sort((x, y) => dateSortKey(y.start!, "start").localeCompare(dateSortKey(x.start!, "start")));
  return [...dated, ...undated];
}

export function sortVisitsChronological<T extends Visit>(visits: T[]): { dated: T[]; undated: T[] } {
  const dated = visits.filter((v) => v.start);
  dated.sort((x, y) => dateSortKey(x.start!, "start").localeCompare(dateSortKey(y.start!, "start")));
  return { dated, undated: visits.filter((v) => !v.start) };
}
```

- [ ] **Step 5: Run tests** — `npx vitest run src/lib` → Expected: all PASS.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: park/visit types, slugify, partial-date helpers"` (+ trailer lines).

---

### Task 3: Research + compile park facts, seed visits, data validation tests

This is the research-heavy task. It needs web access (WebSearch/WebFetch) and care.

**Files:**
- Create: `data/sources/sheet.json`, `data/sources/enrichment.json`, `scripts/build-parks.ts`, `src/data/parks.json` (generated), `src/data/visits.ts`, `src/data/data.test.ts`

**Interfaces:**
- Consumes: `Park`, `Visit`, `ICON_KINDS`, `REGIONS` (Task 2), `slugify`, `parsePartialDate`, `dateSortKey`.
- Produces: `src/data/parks.json` (`Park[]`, sorted by `name` with `localeCompare`), `src/data/visits.ts` exporting `export const visits: Visit[]`.

- [ ] **Step 1: Save the sheet seed**

```bash
mkdir -p data/sources
# already present — verify only
jq 'length' data/sources/sheet.json   # Expected: 64 (header + 63)
```

- [ ] **Step 2: Research and write `data/sources/enrichment.json`**

An array of 63 objects, one per park, shaped exactly:
```json
{
  "id": "zion",
  "name": "Zion",
  "npsCode": "ZION",
  "lat": 37.3,
  "lon": -113.05,
  "states": ["Utah"],
  "region": "Southwest",
  "established": "1919-11-19",
  "acres": 147242.66,
  "visitors": 4692417,
  "visitorsYear": 2022,
  "description": "2–3 sentences, own words.",
  "highlights": ["Angels Landing", "The Narrows", "Emerald Pools", "Canyon Overlook Trail"],
  "bestSeason": "Apr–May, Sep–Oct",
  "nearestAirport": "Las Vegas (LAS) · ~2.5 hr drive",
  "kind": "canyon",
  "hero": {
    "url": "https://upload.wikimedia.org/…/file.jpg",
    "credit": "NPS / Jane Doe",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:…"
  },
  "sources": ["https://www.nps.gov/zion/", "https://irma.nps.gov/Stats/…", "https://www.earthtrekkers.com/…"]
}
```

Research procedure (record every URL used in `sources`):
1. **Names, established dates, states, coords:** start from the sheet; cross-check against Wikipedia "List of national parks of the United States" and each park's nps.gov page. Strip footnote marks (`*`, `†`, `‡`, `[n]`). States list must include every state the park touches (e.g. Yellowstone: Wyoming, Montana, Idaho; Great Smoky: North Carolina, Tennessee; Death Valley: California, Nevada). Territories use "American Samoa" / "U.S. Virgin Islands".
2. **npsCode:** the 4-letter unit code from the nps.gov URL (e.g. `nps.gov/grca` → `GRCA`). Gateway Arch is `JEFF`; Sequoia and Kings Canyon both `SEKI`; New River Gorge `NERI`.
3. **Visitors:** latest full calendar year from NPS Visitor Use Statistics (irma.nps.gov/Stats, "Annual Park Recreation Visitation"). Use the same year for all parks; set `visitorsYear`.
4. **Acres:** gross area acres from the latest NPS Land Resource Division acreage report (or Wikipedia's table if it cites that report).
5. **Description:** 2–3 sentences in our own words (≤ 320 chars), grounded in NPS.
6. **Highlights:** 3–4 signature sights/hikes, cross-checked between NPS and earthtrekkers.com (where Earth Trekkers covers the park). Short names only.
7. **bestSeason:** short month ranges, e.g. `"Jun–Sep"`; cross-check NPS "Plan your visit/Weather" + Earth Trekkers.
8. **nearestAirport:** `"City (IATA) · ~N hr drive"` for the nearest commercial airport with regular service most visitors would use; boat/seaplane parks say so (`"Key West (EYW) · 2.25 hr ferry"`).
9. **kind:** one of the 17 `ICON_KINDS`; use the mockup's assignment (in `docs/mockup/build-mock.mjs`, `KIND` table) unless research shows a better fit.
10. **region:** one of `REGIONS`. Guide: AK → Alaska; WA/OR → Pacific Northwest; CA/NV → California & Nevada; AZ/NM/UT/TX(west) → Southwest; CO/WY/MT/ID → Rocky Mountains; ND/SD → Great Plains; MN/MI/IN/OH/MO → Midwest; AR/KY/TN/NC/SC/FL/VA/WV(choose South for south-of-Ohio) → South; ME and others north/east → East; HI/AS → Hawaiʻi & Pacific; VI → Caribbean. Big Bend/Guadalupe → Southwest.
11. **hero:** a public-domain photo on Wikimedia Commons whose license is "Public domain" with NPS/US-government authorship (template `PD-USGov-NPS` or `PD-USGov`). Prefer a wide, iconic landscape. `url` = direct `upload.wikimedia.org` file URL; `credit` = "NPS / <author>" (or "NPS" if none); `sourceUrl` = the Commons file page.

Discrepancies (sheet vs. sources): NPS wins; add the NPS URL to `sources`.

- [ ] **Step 3: Write failing data tests**

`src/data/data.test.ts`:
```ts
import fs from "node:fs";
import path from "node:path";
import parksJson from "./parks.json";
import { visits } from "./visits";
import { ICON_KINDS, REGIONS, type Park } from "./types";
import { dateSortKey, parsePartialDate } from "../lib/dates";
import { slugify } from "../lib/slug";

const parks = parksJson as Park[];
const ids = new Set(parks.map((p) => p.id));
const root = path.resolve(__dirname, "../..");

test("there are exactly 63 parks with unique ids", () => {
  expect(parks).toHaveLength(63);
  expect(ids.size).toBe(63);
});

test("ids are slugs of names and parks are sorted by name", () => {
  for (const p of parks) expect(p.id).toBe(slugify(p.name));
  const names = parks.map((p) => p.name);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

test.each(parks.map((p) => [p.id, p]))("%s has complete, sane facts", (_id, p) => {
  const park = p as Park;
  expect(park.name.length).toBeGreaterThan(1);
  expect(park.name).not.toMatch(/[*†‡[\]]/);
  expect(park.npsCode).toMatch(/^[A-Z]{4}$/);
  expect(park.npsUrl).toBe(`https://www.nps.gov/${park.npsCode.toLowerCase()}/`);
  expect(park.states.length).toBeGreaterThan(0);
  expect(REGIONS).toContain(park.region);
  expect(ICON_KINDS).toContain(park.kind);
  expect(park.established).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(park.acres).toBeGreaterThan(100);
  expect(park.visitors).toBeGreaterThan(1000);
  expect(park.description.length).toBeGreaterThan(80);
  expect(park.description.length).toBeLessThanOrEqual(320);
  expect(park.highlights.length).toBeGreaterThanOrEqual(3);
  expect(park.highlights.length).toBeLessThanOrEqual(4);
  expect(park.bestSeason).not.toBe("");
  expect(park.nearestAirport).toMatch(/\([A-Z]{3}\)/);
  expect(park.heroPhoto.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  expect(park.sources.length).toBeGreaterThan(0);
  expect(Math.abs(park.lat)).toBeLessThanOrEqual(90);
  expect(Math.abs(park.lon)).toBeLessThanOrEqual(180);
});

test("all parks share one visitorsYear", () => {
  expect(new Set(parks.map((p) => p.visitorsYear)).size).toBe(1);
});

test("ranks are permutations of 1..63 consistent with the numbers", () => {
  const sizeRanks = parks.map((p) => p.sizeRank).sort((a, b) => a - b);
  const visRanks = parks.map((p) => p.visitorRank).sort((a, b) => a - b);
  const oneTo63 = Array.from({ length: 63 }, (_, i) => i + 1);
  expect(sizeRanks).toEqual(oneTo63);
  expect(visRanks).toEqual(oneTo63);
  const bySize = [...parks].sort((a, b) => a.sizeRank - b.sizeRank);
  for (let i = 1; i < bySize.length; i++) expect(bySize[i - 1].acres).toBeGreaterThanOrEqual(bySize[i].acres);
});

describe("visits", () => {
  test.each(visits.map((v, i) => [i, v]))("visit #%i is valid", (_i, v) => {
    const visit = v as (typeof visits)[number];
    const label = JSON.stringify(visit);
    expect(ids.has(visit.park), `unknown park in ${label}`).toBe(true);
    if (visit.end) expect(visit.start, `end without start in ${label}`).toBeDefined();
    if (visit.start) parsePartialDate(visit.start);
    if (visit.end) {
      parsePartialDate(visit.end);
      expect(dateSortKey(visit.end, "end") >= dateSortKey(visit.start!, "start"), `end before start in ${label}`).toBe(true);
    }
    for (const name of visit.with ?? []) expect(name.trim()).not.toBe("");
    for (const f of visit.photos ?? []) {
      expect(fs.existsSync(path.join(root, "photos", visit.park, f)), `missing photo ${visit.park}/${f}`).toBe(true);
    }
  });

  test("the 14 parks from the sheet are seeded as visited", () => {
    const visited = new Set(visits.map((v) => v.park));
    for (const id of [
      "badlands", "bryce-canyon", "carlsbad-caverns", "congaree", "death-valley", "grand-canyon", "grand-teton",
      "guadalupe-mountains", "hawaii-volcanoes", "new-river-gorge", "pinnacles", "yellowstone", "yosemite", "zion",
    ]) expect(visited.has(id)).toBe(true);
  });
});
```

Run: `npx vitest run src/data` → Expected: FAIL (parks.json / visits.ts missing).

- [ ] **Step 4: Write `scripts/build-parks.ts`**

```ts
// Compiles data/sources/{sheet,enrichment}.json → src/data/parks.json. Enrichment is authoritative;
// the sheet is a cross-check (warnings only).
import fs from "node:fs";
import type { IconKind, Park, Region } from "../src/data/types";
import { slugify } from "../src/lib/slug";

interface Enrichment {
  id: string; name: string; npsCode: string; lat: number; lon: number; states: string[]; region: Region;
  established: string; acres: number; visitors: number; visitorsYear: number; description: string;
  highlights: string[]; bestSeason: string; nearestAirport: string; kind: IconKind;
  hero: { url: string; credit: string; sourceUrl: string }; sources: string[];
}

const sheet: string[][] = JSON.parse(fs.readFileSync("data/sources/sheet.json", "utf8")).slice(1);
const enrich: Enrichment[] = JSON.parse(fs.readFileSync("data/sources/enrichment.json", "utf8"));

const sheetById = new Map(sheet.map((r) => [slugify(r[0].replace(/[*†‡]/g, "")), r]));
const warn: string[] = [];
for (const e of enrich) {
  const r = sheetById.get(e.id);
  if (!r) { warn.push(`${e.id}: not in sheet`); continue; }
  const sheetAcres = +r[4].replace(/\[.*?\]/g, "").split(" ")[0].replace(/,/g, "");
  if (Math.abs(sheetAcres - e.acres) / e.acres > 0.05) warn.push(`${e.id}: acres sheet ${sheetAcres} vs ${e.acres}`);
  const sheetEst = new Date(r[3].replace(/\[.*?\]/g, "") + " UTC").toISOString().slice(0, 10);
  if (sheetEst !== e.established) warn.push(`${e.id}: established sheet ${sheetEst} vs ${e.established}`);
}
for (const id of sheetById.keys()) if (!enrich.some((e) => e.id === id)) warn.push(`${id}: missing from enrichment`);

const rank = (key: "acres" | "visitors") => {
  const order = [...enrich].sort((a, b) => b[key] - a[key]).map((e) => e.id);
  return (id: string) => order.indexOf(id) + 1;
};
const sizeRank = rank("acres");
const visitorRank = rank("visitors");

const parks: Park[] = enrich
  .map((e) => ({
    id: e.id, name: e.name, npsCode: e.npsCode, lat: e.lat, lon: e.lon, states: e.states, region: e.region,
    established: e.established, acres: e.acres, visitors: e.visitors, visitorsYear: e.visitorsYear,
    sizeRank: sizeRank(e.id), visitorRank: visitorRank(e.id), description: e.description,
    highlights: e.highlights, bestSeason: e.bestSeason, nearestAirport: e.nearestAirport,
    npsUrl: `https://www.nps.gov/${e.npsCode.toLowerCase()}/`, kind: e.kind,
    heroPhoto: { credit: e.hero.credit, sourceUrl: e.hero.sourceUrl }, sources: e.sources,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync("src/data/parks.json", JSON.stringify(parks, null, 2) + "\n");
console.log(`wrote ${parks.length} parks`);
if (warn.length) console.log("Cross-check notes (NPS-sourced values kept):\n  " + warn.join("\n  "));
```

Run: `npm run parks:build` → Expected: `wrote 63 parks` plus cross-check notes. Review every note: each must be explained by a newer/official source recorded in that park's `sources`; otherwise fix `enrichment.json`.

- [ ] **Step 5: Seed `src/data/visits.ts`**

```ts
import type { Visit } from "./types";

// One entry per trip. Dates: "YYYY" | "YYYY-MM" | "YYYY-MM-DD"; omit start for "Date TBD".
// Photos: add with `npm run photos:add -- <park> <visit-number> <files…>`.
export const visits: Visit[] = [
  { park: "badlands" },
  { park: "bryce-canyon" },
  { park: "carlsbad-caverns" },
  { park: "congaree" },
  { park: "death-valley" },
  { park: "grand-canyon" },
  { park: "grand-teton" },
  { park: "guadalupe-mountains" },
  { park: "hawaii-volcanoes" },
  { park: "new-river-gorge" },
  { park: "pinnacles" },
  { park: "yellowstone" },
  { park: "yosemite" },
  { park: "zion" },
];
```

- [ ] **Step 6: Run tests** — `npx vitest run src/data` → Expected: all PASS. Fix data (not tests) on failure.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: researched facts for 63 parks, seeded visits, data validation"` (+ trailer).

---

### Task 4: Stats and filtering logic

**Files:**
- Create: `src/lib/stats.ts`
- Test: `src/lib/stats.test.ts`

**Interfaces:**
- Consumes: `Park`, `Visit`, `dateSortKey`.
- Produces:
  - `type Filter = "all" | "visited" | "not"`
  - `visitedIds(visits: Visit[]): Set<string>`
  - `computeStats(parks: Park[], visits: Visit[]): { visitedCount: number; total: number; statesCovered: number; statesTotal: number; acresVisited: number; latestVisit?: string }`
  - `matchesFilter(id: string, visited: Set<string>, f: Filter): boolean`
  - `formatCompact(n: number): string` (e.g. `8865803 → "8.9M"`, `427562 → "428K"`, `950 → "950"`)
  - `formatInt(n: number): string` (`147242.66 → "147,243"`)

- [ ] **Step 1: Failing tests**

`src/lib/stats.test.ts`:
```ts
import type { Park } from "../data/types";
import { computeStats, formatCompact, formatInt, matchesFilter, visitedIds } from "./stats";

const park = (id: string, states: string[], acres: number) => ({ id, states, acres }) as Park;
const parks = [park("a", ["Utah"], 100), park("b", ["Utah", "Arizona"], 200), park("c", ["Maine"], 400)];

test("computeStats counts unique visited parks, states and acres", () => {
  const s = computeStats(parks, [{ park: "a", start: "2019" }, { park: "a", start: "2022-06" }, { park: "b" }]);
  expect(s).toEqual({
    visitedCount: 2, total: 3, statesCovered: 2, statesTotal: 3, acresVisited: 300, latestVisit: "2022-06",
  });
});

test("computeStats with no dated visits has no latestVisit", () => {
  expect(computeStats(parks, [{ park: "c" }]).latestVisit).toBeUndefined();
});

test("matchesFilter", () => {
  const v = visitedIds([{ park: "a" }]);
  expect(matchesFilter("a", v, "all")).toBe(true);
  expect(matchesFilter("a", v, "visited")).toBe(true);
  expect(matchesFilter("b", v, "visited")).toBe(false);
  expect(matchesFilter("b", v, "not")).toBe(true);
  expect(matchesFilter("a", v, "not")).toBe(false);
});

test.each([
  [8865803.97, "8.9M"], [12937633, "12.9M"], [427562, "428K"], [9457, "9.5K"], [950, "950"],
])("formatCompact(%d) = %s", (n, out) => expect(formatCompact(n)).toBe(out));

test("formatInt rounds and groups", () => expect(formatInt(147242.66)).toBe("147,243"));
```

Run: `npx vitest run src/lib/stats.test.ts` → FAIL.

- [ ] **Step 2: Implement** `src/lib/stats.ts`:
```ts
import type { Park, Visit } from "../data/types";
import { dateSortKey } from "./dates";

export type Filter = "all" | "visited" | "not";

export const visitedIds = (visits: Visit[]) => new Set(visits.map((v) => v.park));

export function computeStats(parks: Park[], visits: Visit[]) {
  const visited = visitedIds(visits);
  const vParks = parks.filter((p) => visited.has(p.id));
  const latest = visits
    .filter((v) => v.start)
    .sort((a, b) => dateSortKey(b.end ?? b.start!, "end").localeCompare(dateSortKey(a.end ?? a.start!, "end")))[0];
  return {
    visitedCount: vParks.length,
    total: parks.length,
    statesCovered: new Set(vParks.flatMap((p) => p.states)).size,
    statesTotal: new Set(parks.flatMap((p) => p.states)).size,
    acresVisited: vParks.reduce((s, p) => s + p.acres, 0),
    ...(latest ? { latestVisit: latest.end ?? latest.start } : {}),
  };
}

export function matchesFilter(id: string, visited: Set<string>, f: Filter): boolean {
  return f === "all" || (f === "visited") === visited.has(id);
}

export function formatCompact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e5) return `${Math.round(n / 1e3)}K`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

export const formatInt = (n: number) => Math.round(n).toLocaleString("en-US");
```

Note: `computeStats` test expects `latestVisit: "2022-06"` — the latest visit's `end ?? start`.

- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat: progress stats and filter logic`.

---

### Task 5: Map geography — projection, boundaries, state labels

**Files:**
- Create: `src/lib/projection.ts`, `scripts/fetch-boundaries.ts`, `scripts/build-geo.ts`, `src/data/boundaries.json` (generated), `src/data/states-albers-10m.json` (copied), `src/lib/geo.ts`, `src/lib/stateLabels.ts`
- Test: `src/lib/geo.test.ts`

**Interfaces:**
- Consumes: `parks.json` (`npsCode`, `lat`, `lon`, `id`).
- Produces:
  - `MAP_W = 980`, `MAP_H = 620`, `INSETS: { id: "american-samoa" | "virgin-islands"; x; y; w; h; label }[]`
  - `projectionFor(parkId: string): GeoProjection`, `projectPark(p: { id; lon; lat }): [number, number]` (throws if null)
  - `geo.ts`: `nationPath: string`, `bordersPath: string`, `footprints: Footprint[]` where `interface Footprint { npsCode: string; parkIds: string[]; d: string; tiny: boolean; cx: number; cy: number }`, `anchors: Map<string, [number, number]>` (park id → projected lat/lon)
  - `stateLabels: { text: string; x: number; y: number }[]`

- [ ] **Step 1: Projection**

`src/lib/projection.ts`:
```ts
import { geoAlbersUsa, geoMercator, type GeoProjection } from "d3-geo";

export const MAP_W = 980;
export const MAP_H = 620;

// us-atlas states-albers-10m.json is pre-projected with exactly this projection.
const albers = geoAlbersUsa().scale(1300).translate([487.5, 305]) as unknown as GeoProjection;

export const INSETS = [
  { id: "american-samoa", x: 890, y: 392, w: 68, h: 56, label: "AM. SAMOA", bbox: [[-170.9, -14.42], [-169.38, -14.15]] },
  { id: "virgin-islands", x: 890, y: 472, w: 68, h: 56, label: "VIRGIN IS.", bbox: [[-64.81, 18.29], [-64.65, 18.38]] },
] as const;

const insetProj = Object.fromEntries(
  INSETS.map((i) => [
    i.id,
    geoMercator().fitExtent(
      [[i.x + 8, i.y + 8], [i.x + i.w - 8, i.y + i.h - 8]],
      { type: "MultiPoint", coordinates: i.bbox.map((c) => [...c]) },
    ),
  ]),
) as Record<string, GeoProjection>;

export const projectionFor = (parkId: string): GeoProjection => insetProj[parkId] ?? albers;

export function projectPark(p: { id: string; lon: number; lat: number }): [number, number] {
  const xy = projectionFor(p.id)([p.lon, p.lat]);
  if (!xy) throw new Error(`Cannot project ${p.id}`);
  return xy;
}
```

- [ ] **Step 2: Find and smoke-test the NPS boundary source** (network — confirm with Rishi first)

Search for the NPS Land Resources Division boundary service (public ArcGIS FeatureServer, layer with `UNIT_CODE`/`UNIT_NAME`). Verify with ONE real query for Zion before writing the script:
```bash
curl -sS "<FeatureServer layer URL>/query?where=UNIT_CODE%3D'ZION'&outFields=UNIT_CODE,UNIT_NAME&returnGeometry=false&f=json" | jq '.features[0].attributes'
```
Expected: `{ "UNIT_CODE": "ZION", "UNIT_NAME": "Zion National Park" }`. Fallback if unavailable: the NPS "Administrative Boundaries of National Park System Units" GeoJSON on the NPS DataStore / data.gov (same attributes).

- [ ] **Step 3: `scripts/fetch-boundaries.ts`**

```ts
// Downloads generalized NPS boundaries for the 63 park unit codes → data/sources/nps-boundaries.geojson.
import fs from "node:fs";
import parks from "../src/data/parks.json";

const LAYER = process.env.NPS_BOUNDARY_LAYER ?? "<FeatureServer layer URL verified in Step 2>";
const codes = [...new Set((parks as { npsCode: string }[]).map((p) => p.npsCode))];
const where = `UNIT_CODE IN (${codes.map((c) => `'${c}'`).join(",")})`;
const params = new URLSearchParams({
  where, outFields: "UNIT_CODE,UNIT_NAME", outSR: "4326", f: "geojson",
  maxAllowableOffset: "0.002", geometryPrecision: "4", returnGeometry: "true",
});
const res = await fetch(`${LAYER}/query`, { method: "POST", body: params });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const gj = await res.json();
const got = new Set(gj.features.map((f: { properties: { UNIT_CODE: string } }) => f.properties.UNIT_CODE));
const missing = codes.filter((c) => !got.has(c));
if (missing.length) throw new Error(`Missing boundaries for ${missing.join(", ")}`);
fs.writeFileSync("data/sources/nps-boundaries.geojson", JSON.stringify(gj));
console.log(`saved ${gj.features.length} features for ${codes.length} unit codes`);
```

Replace the `LAYER` default with the verified URL. Run `npm run geo:fetch` → Expected: `saved N features for 62 unit codes` (62 because SEKI is shared). If the server caps record count, page with `resultOffset`.

- [ ] **Step 4: `scripts/build-geo.ts`**

```ts
// Raw NPS boundaries → simplified, quantized lon/lat TopoJSON (one geometry per unit code).
import fs from "node:fs";
import { topology } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";
import { quantize } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";

const raw: FeatureCollection<Geometry, { UNIT_CODE: string }> = JSON.parse(
  fs.readFileSync("data/sources/nps-boundaries.geojson", "utf8"),
);
// Merge multiple features per unit into one GeometryCollection keyed by code.
const byCode = new Map<string, Geometry[]>();
for (const f of raw.features) {
  if (!f.geometry) continue;
  byCode.set(f.properties.UNIT_CODE, [...(byCode.get(f.properties.UNIT_CODE) ?? []), f.geometry]);
}
const fc: FeatureCollection = {
  type: "FeatureCollection",
  features: [...byCode].map(([code, geoms]) => ({
    type: "Feature",
    id: code,
    properties: { code },
    geometry: geoms.length === 1 ? geoms[0] : { type: "GeometryCollection", geometries: geoms },
  })),
};
let topo = topology({ parks: fc }, 1e6);
topo = presimplify(topo);
topo = simplify(topo, 1e-7); // spherical triangle area ≈ 0.17 px² at scale 1300
topo = quantize(topo, 1e5);
const out = JSON.stringify(topo);
fs.writeFileSync("src/data/boundaries.json", out);
console.log(`boundaries.json: ${(out.length / 1024).toFixed(0)} KB, ${byCode.size} units`);
```

States file (already present):
```bash
ls src/data/states-albers-10m.json   # already present
```
Run `npm run geo:build` → Expected: ≤ 600 KB, 62 units. If larger, raise the simplify threshold to `3e-7`.

- [ ] **Step 5: Failing geo tests**

`src/lib/geo.test.ts`:
```ts
import parksJson from "../data/parks.json";
import type { Park } from "../data/types";
import { anchors, bordersPath, footprints, nationPath } from "./geo";
import { INSETS, MAP_H, MAP_W } from "./projection";
import { stateLabels } from "./stateLabels";

const parks = parksJson as Park[];

test("every park has an anchor inside the map", () => {
  for (const p of parks) {
    const a = anchors.get(p.id)!;
    expect(a, p.id).toBeDefined();
    expect(a[0]).toBeGreaterThanOrEqual(0);
    expect(a[0]).toBeLessThanOrEqual(MAP_W);
    expect(a[1]).toBeGreaterThanOrEqual(0);
    expect(a[1]).toBeLessThanOrEqual(MAP_H);
  }
});

test("territory anchors fall inside their inset boxes", () => {
  for (const i of INSETS) {
    const [x, y] = anchors.get(i.id)!;
    expect(x).toBeGreaterThan(i.x);
    expect(x).toBeLessThan(i.x + i.w);
    expect(y).toBeGreaterThan(i.y);
    expect(y).toBeLessThan(i.y + i.h);
  }
});

test("every park has a non-empty footprint; SEKI is shared", () => {
  for (const p of parks) {
    const f = footprints.find((x) => x.parkIds.includes(p.id));
    expect(f, p.id).toBeDefined();
    expect(f!.d.length).toBeGreaterThan(10);
  }
  expect(footprints.find((f) => f.npsCode === "SEKI")!.parkIds.sort()).toEqual(["kings-canyon", "sequoia"]);
  expect(footprints.find((f) => f.npsCode === "JEFF")!.tiny).toBe(true);
  expect(footprints.find((f) => f.npsCode === "WRST")!.tiny).toBe(false);
});

test("base map paths and state labels exist", () => {
  expect(nationPath.length).toBeGreaterThan(1000);
  expect(bordersPath.length).toBeGreaterThan(1000);
  expect(stateLabels.find((l) => l.text === "UTAH")).toBeDefined();
  expect(stateLabels.find((l) => l.text === "RI")).toBeDefined();
  expect(stateLabels.some((l) => l.text === "DISTRICT OF COLUMBIA")).toBe(false);
});
```

Run → FAIL.

- [ ] **Step 6: Implement `geo.ts` and `stateLabels.ts`**

`src/lib/geo.ts`:
```ts
import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature } from "geojson";
import statesTopo from "../data/states-albers-10m.json";
import parksTopo from "../data/boundaries.json";
import parksJson from "../data/parks.json";
import type { Park } from "../data/types";
import { projectPark, projectionFor } from "./projection";

const parks = parksJson as Park[];
const states = statesTopo as unknown as Topology<{ states: GeometryCollection; nation: GeometryCollection }>;
const units = parksTopo as unknown as Topology<{ parks: GeometryCollection<{ code: string }> }>;

const identity = geoPath();
export const nationPath = identity(feature(states, states.objects.nation))!;
export const bordersPath = identity(mesh(states, states.objects.states, (a, b) => a !== b))!;

export interface Footprint { npsCode: string; parkIds: string[]; d: string; tiny: boolean; cx: number; cy: number }

const TINY_AREA = 6; // viewBox units² below which we draw a marker instead
const unitFeatures = (feature(units, units.objects.parks) as unknown as { features: Feature[] }).features;

export const footprints: Footprint[] = unitFeatures.map((f) => {
  const code = (f.properties as { code: string }).code;
  const parkIds = parks.filter((p) => p.npsCode === code).map((p) => p.id);
  const path = geoPath(projectionFor(parkIds[0] ?? ""));
  const [cx, cy] = path.centroid(f);
  return { npsCode: code, parkIds, d: path(f) ?? "", tiny: path.area(f) < TINY_AREA, cx, cy };
});

export const anchors = new Map<string, [number, number]>(parks.map((p) => [p.id, projectPark(p)]));
```

`src/lib/stateLabels.ts`:
```ts
import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import statesTopo from "../data/states-albers-10m.json";

const states = statesTopo as unknown as Topology<{ states: GeometryCollection<{ name: string }> }>;
const SMALL: Record<string, string> = {
  Vermont: "VT", "New Hampshire": "NH", Massachusetts: "MA", "Rhode Island": "RI", Connecticut: "CT",
  "New Jersey": "NJ", Delaware: "DE", Maryland: "MD", "District of Columbia": "", "West Virginia": "W. VA",
};
const NUDGE: Record<string, [number, number]> = {
  Florida: [14, 10], Louisiana: [-10, 0], Michigan: [10, 18], Idaho: [0, 20], California: [-12, 10],
  Kentucky: [8, 2], Hawaii: [10, -24],
};
const path = geoPath();
export const stateLabels = feature(states, states.objects.states).features.flatMap((f) => {
  const name = (f.properties as { name: string }).name;
  const text = name in SMALL ? SMALL[name] : name.toUpperCase();
  if (!text) return [];
  const [x, y] = path.centroid(f);
  const [dx, dy] = NUDGE[name] ?? [0, 0];
  return [{ text, x: x + dx, y: y + dy }];
});
```

- [ ] **Step 7: Run tests** → PASS. **Step 8: Commit** `feat: map projection, NPS park footprints, state labels`.

---

### Task 6: Callout layout (badge placement + leader lines)

**Files:**
- Create: `src/lib/callouts.ts`
- Test: `src/lib/callouts.test.ts`

**Interfaces:**
- Consumes: `anchors` (Task 5), `MAP_W`, `MAP_H`.
- Produces:
  - `interface Anchor { id: string; ax: number; ay: number }`
  - `interface Placed extends Anchor { x: number; y: number; leader: boolean }`
  - `interface LayoutOpts { r: number; gap: number; width: number; height: number }`
  - `layoutBadges(items: Anchor[], o: LayoutOpts): Placed[]` — items must already be filtered to those inside the frame.
  - `segmentsCross(a: [number, number, number, number], b: [number, number, number, number]): boolean`

- [ ] **Step 1: Failing tests**

`src/lib/callouts.test.ts`:
```ts
import { anchors } from "./geo";
import { MAP_H, MAP_W } from "./projection";
import { layoutBadges, segmentsCross, type Anchor, type LayoutOpts, type Placed } from "./callouts";

function assertClean(placed: Placed[], o: LayoutOpts) {
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i];
    expect(p.x, p.id).toBeGreaterThanOrEqual(o.r - 0.01);
    expect(p.x, p.id).toBeLessThanOrEqual(o.width - o.r + 0.01);
    expect(p.y, p.id).toBeGreaterThanOrEqual(o.r - 0.01);
    expect(p.y, p.id).toBeLessThanOrEqual(o.height - o.r + 0.01);
    for (let j = i + 1; j < placed.length; j++) {
      const q = placed[j];
      expect(Math.hypot(p.x - q.x, p.y - q.y), `${p.id} overlaps ${q.id}`).toBeGreaterThanOrEqual(2 * o.r - 0.01);
      if (p.leader && q.leader) {
        expect(segmentsCross([p.ax, p.ay, p.x, p.y], [q.ax, q.ay, q.x, q.y]), `${p.id} × ${q.id}`).toBe(false);
      }
    }
  }
}

function realAnchors(width: number): { items: Anchor[]; o: LayoutOpts } {
  const s = width / MAP_W;
  const items = [...anchors].map(([id, [x, y]]) => ({ id, ax: x * s, ay: y * s }));
  return { items, o: { r: 0, gap: 4, width, height: MAP_H * s } };
}

test("a lone anchor keeps its spot with no leader", () => {
  const [p] = layoutBadges([{ id: "a", ax: 100, ay: 100 }], { r: 15, gap: 4, width: 400, height: 300 });
  expect([p.x, p.y, p.leader]).toEqual([100, 100, false]);
});

test("coincident anchors fan out with leaders", () => {
  const o = { r: 15, gap: 4, width: 400, height: 300 };
  const placed = layoutBadges(
    [{ id: "a", ax: 200, ay: 150 }, { id: "b", ax: 200, ay: 150 }, { id: "c", ax: 201, ay: 151 }],
    o,
  );
  expect(placed.every((p) => p.leader)).toBe(true);
  assertClean(placed, o);
});

test("clusters near the edge stay inside the frame", () => {
  const o = { r: 15, gap: 4, width: 300, height: 200 };
  const items = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, ax: 5 + i, ay: 5 + i }));
  assertClean(layoutBadges(items, o), o);
});

test("segmentsCross detects proper crossings only", () => {
  expect(segmentsCross([0, 0, 10, 10], [0, 10, 10, 0])).toBe(true);
  expect(segmentsCross([0, 0, 10, 0], [0, 5, 10, 5])).toBe(false);
  expect(segmentsCross([0, 0, 10, 10], [10, 10, 20, 0])).toBe(false); // shared endpoint
});

test.each([
  [1216, 17],
  [358, 10],
])("real park anchors at %ipx wide (r=%i) lay out cleanly", (width, r) => {
  const { items, o } = realAnchors(width);
  const opts = { ...o, r };
  assertClean(layoutBadges(items, opts), opts);
});

test("zoomed in: only in-frame anchors are laid out and fewer need leaders", () => {
  const width = 1216;
  const s = width / MAP_W;
  const k = 4;
  // zoom on Utah: translate so Zion is near the center
  const [zx, zy] = anchors.get("zion")!;
  const tx = width / 2 - zx * s * k;
  const ty = (MAP_H * s) / 2 - zy * s * k;
  const items = [...anchors]
    .map(([id, [x, y]]) => ({ id, ax: x * s * k + tx, ay: y * s * k + ty }))
    .filter((a) => a.ax >= 0 && a.ax <= width && a.ay >= 0 && a.ay <= MAP_H * s);
  const o = { r: 17, gap: 4, width, height: MAP_H * s };
  const placed = layoutBadges(items, o);
  assertClean(placed, o);
  expect(placed.length).toBeLessThan(63);
  const base = layoutBadges(realAnchors(width).items, o).filter((p) => p.leader).length;
  expect(placed.filter((p) => p.leader).length).toBeLessThan(base);
});
```

Run → FAIL.

- [ ] **Step 2: Implement** `src/lib/callouts.ts`:
```ts
export interface Anchor { id: string; ax: number; ay: number }
export interface Placed extends Anchor { x: number; y: number; leader: boolean }
export interface LayoutOpts { r: number; gap: number; width: number; height: number }
type Seg = [number, number, number, number];

const orient = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
  Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));

/** True only for a proper crossing (interiors intersect); touching endpoints don't count. */
export function segmentsCross([a, b, c, d]: Seg, [e, f, g, h]: Seg): boolean {
  const o1 = orient(a, b, c, d, e, f), o2 = orient(a, b, c, d, g, h);
  const o3 = orient(e, f, g, h, a, b), o4 = orient(e, f, g, h, c, d);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function clusters(items: Anchor[], minDist: number): Anchor[][] {
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (Math.hypot(items[i].ax - items[j].ax, items[i].ay - items[j].ay) < minDist) parent[find(i)] = find(j);
  const groups = new Map<number, Anchor[]>();
  items.forEach((a, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), a]));
  return [...groups.values()];
}

const clamp = (p: Placed, o: LayoutOpts) => {
  p.x = Math.min(Math.max(p.x, o.r), o.width - o.r);
  p.y = Math.min(Math.max(p.y, o.r), o.height - o.r);
};

function fan(c: Anchor[], o: LayoutOpts): Placed[] {
  const d = 2 * o.r + o.gap;
  const cx = c.reduce((s, a) => s + a.ax, 0) / c.length;
  const cy = c.reduce((s, a) => s + a.ay, 0) / c.length;
  const spread = Math.max(...c.map((a) => Math.hypot(a.ax - cx, a.ay - cy)));
  const ring = Math.max((c.length * d) / (2 * Math.PI) + o.gap, spread + o.r + o.gap);
  const angle = (a: Anchor) => Math.atan2(a.ay - cy, a.ax - cx);
  const sorted = [...c].sort((a, b) => angle(a) - angle(b) || a.id.localeCompare(b.id));
  const step = (2 * Math.PI) / c.length;
  let best: Placed[] = [];
  let bestCost = Infinity;
  for (let k = 0; k < 24; k++) {
    const off = angle(sorted[0]) + (k / 24) * step;
    const cand = sorted.map((a, i) => {
      const p = { ...a, x: cx + ring * Math.cos(off + i * step), y: cy + ring * Math.sin(off + i * step), leader: true };
      clamp(p, o);
      return p;
    });
    const cost = cand.reduce((s, p) => s + Math.hypot(p.x - p.ax, p.y - p.ay), 0);
    if (cost < bestCost) { bestCost = cost; best = cand; }
  }
  return best;
}

function relax(ps: Placed[], o: LayoutOpts) {
  const d = 2 * o.r + o.gap;
  for (let it = 0; it < 500; it++) {
    let moved = false;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist >= d) continue;
        if (dist < 1e-6) { dx = 1; dy = 0.5; dist = Math.hypot(dx, dy); }
        const push = (d - dist) / 2 + 0.05;
        a.x -= (dx / dist) * push; a.y -= (dy / dist) * push;
        b.x += (dx / dist) * push; b.y += (dy / dist) * push;
        clamp(a, o); clamp(b, o);
        moved = true;
      }
    if (!moved) return;
  }
}

/** 2-opt: swapping the badge slots of two crossing leaders always uncrosses them and shortens the total. */
function untangle(ps: Placed[]) {
  for (let pass = 0; pass < 200; pass++) {
    let swapped = false;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        if (segmentsCross([a.ax, a.ay, a.x, a.y], [b.ax, b.ay, b.x, b.y])) {
          [a.x, b.x] = [b.x, a.x];
          [a.y, b.y] = [b.y, a.y];
          swapped = true;
        }
      }
    if (!swapped) return;
  }
}

export function layoutBadges(items: Anchor[], o: LayoutOpts): Placed[] {
  const d = 2 * o.r + o.gap;
  const out: Placed[] = [];
  for (const c of clusters(items, d)) {
    if (c.length === 1) {
      const p = { ...c[0], x: c[0].ax, y: c[0].ay, leader: false };
      clamp(p, o);
      out.push(p);
    } else out.push(...fan(c, o));
  }
  for (let round = 0; round < 4; round++) { relax(out, o); untangle(out); }
  relax(out, o);
  for (const p of out) p.leader = Math.hypot(p.x - p.ax, p.y - p.ay) > o.r * 0.5;
  return out;
}
```

- [ ] **Step 3: Run** `npx vitest run src/lib/callouts.test.ts` → Expected: PASS. If the 358px case fails (overlap or crossing after the final relax), first increase the relax/untangle rounds to 8; if crossings persist, run `untangle` once more after the final `relax` and add a final `relax` guarded so it only moves non-crossing pairs — re-run until clean. Do not weaken the tests.

- [ ] **Step 4: Commit** `feat: callout layout with fanned clusters and non-crossing leaders`.

---

### Task 7: Placeholder icons, art/hero asset lookup, art + hero scripts, art prompts

**Files:**
- Create: `src/assets/icons/*.svg` (17), `src/assets/art/.gitkeep`, `src/assets/hero/` (fetched), `src/lib/assets.ts`, `src/components/ParkArt.tsx`, `scripts/art-add.ts`, `scripts/fetch-heroes.ts`, `docs/art-prompts.md`
- Test: `src/lib/assets.test.ts`

**Interfaces:**
- Consumes: `Park.kind`, `Park.id`.
- Produces:
  - `artUrl(park: Pick<Park, "id" | "kind">): { src: string; custom: boolean }`
  - `heroUrl(id: string): string | undefined`
  - `photoUrls(park: string, file: string): { thumb: string; full: string } | undefined`
  - `<ParkArt park size className? />` → `<img>` with `alt=""` (decorative; names are always adjacent)

- [ ] **Step 1: Copy icons**

```bash
mkdir -p src/assets/icons src/assets/art src/assets/hero photos && touch src/assets/art/.gitkeep photos/.gitkeep
# icons already present in src/assets/icons/
ls src/assets/icons | wc -l   # Expected: 17
```

- [ ] **Step 2: Failing test**

`src/lib/assets.test.ts`:
```ts
import { ICON_KINDS } from "../data/types";
import { artUrl, heroUrl } from "./assets";
import parksJson from "../data/parks.json";

test("every icon kind has an svg", () => {
  for (const kind of ICON_KINDS) expect(artUrl({ id: "no-such-park", kind }).src, kind).toMatch(/\.svg/);
});

test("art falls back to the icon when no custom art exists", () => {
  expect(artUrl({ id: "no-such-park", kind: "canyon" })).toMatchObject({ custom: false });
});

test("every park has a hero photo", () => {
  for (const p of parksJson) expect(heroUrl(p.id), p.id).toBeTruthy();
});
```

- [ ] **Step 3: Implement** `src/lib/assets.ts`:
```ts
import type { IconKind, Park } from "../data/types";

const icons = import.meta.glob<string>("../assets/icons/*.svg", { eager: true, query: "?url", import: "default" });
const art = import.meta.glob<string>("../assets/art/*.webp", { eager: true, query: "?url", import: "default" });
const heroes = import.meta.glob<string>("../assets/hero/*.jpg", {
  eager: true, query: "?w=1200&format=webp", import: "default",
});
const thumbs = import.meta.glob<string>("../../photos/*/*.{jpg,jpeg,webp}", {
  eager: true, query: "?w=480&format=webp", import: "default",
});
const fulls = import.meta.glob<string>("../../photos/*/*.{jpg,jpeg,webp}", {
  eager: true, query: "?w=2000&format=webp", import: "default",
});

const iconUrl = (kind: IconKind) => icons[`../assets/icons/${kind}.svg`];

export function artUrl(park: Pick<Park, "id" | "kind">): { src: string; custom: boolean } {
  const custom = art[`../assets/art/${park.id}.webp`];
  return custom ? { src: custom, custom: true } : { src: iconUrl(park.kind), custom: false };
}

export const heroUrl = (id: string): string | undefined => heroes[`../assets/hero/${id}.jpg`];

export function photoUrls(park: string, file: string) {
  const key = `../../photos/${park}/${file}`;
  return thumbs[key] && fulls[key] ? { thumb: thumbs[key], full: fulls[key] } : undefined;
}
```

`src/components/ParkArt.tsx`:
```tsx
import type { Park } from "../data/types";
import { artUrl } from "../lib/assets";

export function ParkArt({ park, size, className }: { park: Pick<Park, "id" | "kind">; size: number; className?: string }) {
  const { src } = artUrl(park);
  return <img src={src} alt="" width={size} height={size} className={className} draggable={false} />;
}
```

- [ ] **Step 4: `scripts/fetch-heroes.ts`** (network — confirm with Rishi)

```ts
// Downloads each park's public-domain hero photo → src/assets/hero/<id>.jpg (1600px wide, metadata stripped).
import fs from "node:fs";
import sharp from "sharp";

const enrich: { id: string; hero: { url: string } }[] = JSON.parse(fs.readFileSync("data/sources/enrichment.json", "utf8"));
const only = process.argv[2];
for (const e of enrich) {
  if (only && e.id !== only) continue;
  const out = `src/assets/hero/${e.id}.jpg`;
  if (fs.existsSync(out) && !only) continue;
  const res = await fetch(e.hero.url, { headers: { "User-Agent": "parks.rishimohnot.com build (rsmohnot@gmail.com)" } });
  if (!res.ok) { console.error(`${e.id}: HTTP ${res.status}`); process.exitCode = 1; continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log(`${e.id}: ok`);
  await new Promise((r) => setTimeout(r, 300));
}
```

Run `npm run heroes:fetch` → Expected: 63 `ok` lines. Spot-check 5 images visually (Read tool on the jpg). Replace any that are poor (wrong park, night-black, tiny) in enrichment and rerun with the id argument.

- [ ] **Step 5: `scripts/art-add.ts`**

```ts
// npm run art:add -- <park-id> <image-file> → src/assets/art/<id>.webp (512×512, center crop)
import fs from "node:fs";
import sharp from "sharp";
import parks from "../src/data/parks.json";

const [id, file] = process.argv.slice(2);
if (!id || !file) throw new Error("usage: npm run art:add -- <park-id> <image-file>");
if (!(parks as { id: string }[]).some((p) => p.id === id)) throw new Error(`unknown park id: ${id}`);
if (!fs.existsSync(file)) throw new Error(`no such file: ${file}`);
const out = `src/assets/art/${id}.webp`;
await sharp(file).rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 86 }).toFile(out);
console.log(`wrote ${out}`);
```

Verify manually: `npm run art:add -- zion src/assets/icons/canyon.svg && ls -la src/assets/art/zion.webp && rm src/assets/art/zion.webp`.

- [ ] **Step 6: `docs/art-prompts.md`**

Header with the shared style prompt (verbatim):
> Flat vintage WPA national-park screen-print illustration. Limited palette of 5–6 colors drawn from: cream #F6EEDC, ink #1E2A2F, deep teal #0F4C5C, sunset orange #F26B38, canyon red #C8402E, pine green #1F5A3D, sky blue #7FC8D9, gold #F2B33D, blush #F29C8F, dusk violet #6B4E8C. Bold simplified shapes, subtle paper grain, no text, no border, no people in the foreground. Single centered subject composed to read inside a circular crop. Square 1:1.

Then a table with all 63 parks: `| id | Park | Subject line |`, one evocative, specific subject per park (e.g. `zion | Zion | Angels Landing at sunset above the Virgin River`), derived from the park's highlights. Then usage: generate → `npm run art:add -- <id> <file>` → commit.

- [ ] **Step 7: Run tests** → PASS. **Step 8: Commit** `feat: placeholder icons, art/hero lookup, hero fetch, art tooling and prompts`.

---

### Task 8: Header, Controls, Grid view, Timeline

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Controls.tsx`, `src/components/GridView.tsx`, `src/components/Timeline.tsx`, `src/styles/header.css`, `src/styles/grid.css`
- Test: `src/components/GridView.test.tsx`, `src/components/Header.test.tsx`

**Interfaces:**
- Consumes: `computeStats`, `formatCompact`, `formatVisitDates`, `sortVisitsChronological`, `Filter`, `matchesFilter`, `ParkArt`, `dateSortKey`.
- Produces:
  - `<Header stats={ReturnType<typeof computeStats>} />`
  - `<Controls filter onFilter view onView counts={{ all, visited, not }} />` where `view: "map" | "grid"`
  - `<GridView parks visits visited filter onSelect />` with internal sort state `"name" | "visited" | "region" | "size"`
  - `<Timeline parks visits onSelect />`

- [ ] **Step 1: Failing tests**

`src/components/Header.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

test("shows count, total and stats; Date TBD when no dated visit", () => {
  render(<Header stats={{ visitedCount: 14, total: 63, statesCovered: 13, statesTotal: 32, acresVisited: 8865803 }} />);
  expect(screen.getByText("14")).toBeInTheDocument();
  expect(screen.getByText("/ 63 parks")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /14 of 63 parks/ })).toBeInTheDocument();
  expect(screen.getByText("8.9M")).toBeInTheDocument();
  expect(screen.getByText("Date TBD")).toBeInTheDocument();
});
```

`src/components/GridView.test.tsx`:
```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Park } from "../data/types";
import { GridView } from "./GridView";

vi.mock("../lib/assets", () => ({ artUrl: () => ({ src: "x.svg", custom: false }) }));

const mk = (id: string, name: string, acres: number, region: Park["region"]) =>
  ({ id, name, acres, region, kind: "mountain" }) as Park;
const parks = [mk("zion", "Zion", 147000, "Southwest"), mk("haleakala", "Haleakalā", 33000, "Hawaiʻi & Pacific"), mk("acadia", "Acadia", 49000, "East")];
const visits = [{ park: "zion", start: "2021-05" }, { park: "acadia" }];

const names = () =>
  within(screen.getByRole("list")).getAllByRole("button").map((b) => b.getAttribute("aria-label")!.split(",")[0]);

test("sorts by name (diacritics-aware) by default and by size", async () => {
  render(<GridView parks={parks} visits={visits} visited={new Set(["zion", "acadia"])} filter="all" onSelect={() => {}} />);
  expect(names()).toEqual(["Acadia", "Haleakalā", "Zion"]);
  await userEvent.selectOptions(screen.getByLabelText("Sort"), "size");
  expect(names()).toEqual(["Zion", "Acadia", "Haleakalā"]);
});

test("visited sort: dated newest first, undated visited next, unvisited last", async () => {
  render(<GridView parks={parks} visits={visits} visited={new Set(["zion", "acadia"])} filter="all" onSelect={() => {}} />);
  await userEvent.selectOptions(screen.getByLabelText("Sort"), "visited");
  expect(names()).toEqual(["Zion", "Acadia", "Haleakalā"]);
});

test("filter hides non-matching cards and clicking selects", async () => {
  const onSelect = vi.fn();
  render(<GridView parks={parks} visits={visits} visited={new Set(["zion", "acadia"])} filter="not" onSelect={onSelect} />);
  expect(names()).toEqual(["Haleakalā"]);
  await userEvent.click(screen.getByRole("button", { name: /Haleakalā/ }));
  expect(onSelect).toHaveBeenCalledWith("haleakala");
});
```

Run → FAIL.

- [ ] **Step 2: Implement Header**

`src/components/Header.tsx`:
```tsx
import type { computeStats } from "../lib/stats";
import { formatCompact } from "../lib/stats";
import { formatVisitDates } from "../lib/dates";
import "../styles/header.css";

export function Header({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const pct = (stats.visitedCount / stats.total) * 100;
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <div className="hdr-title">
          <div className="hdr-kicker">A bucket list, {stats.total} parks long</div>
          <h1>Rishi's National Parks</h1>
          <p>Every U.S. national park, one trip at a time. Click a park to see what makes it special — and when I was there.</p>
        </div>
        <div className="hdr-progress">
          <div className="hdr-count">
            <span className="hdr-num">{stats.visitedCount}</span>
            <span className="hdr-of">/ {stats.total} parks</span>
          </div>
          <div className="trail" role="img" aria-label={`Progress: ${stats.visitedCount} of ${stats.total} parks, ${Math.round(pct)} percent`}>
            <div className="trail-path" />
            <div className="trail-done" style={{ width: `${pct}%` }} />
            <svg className="trail-hiker" style={{ left: `calc(${pct}% - 13px)` }} width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="13" cy="13" r="11" fill="#1E2A2F" />
              <circle cx="13" cy="8.5" r="2.3" fill="#F2B33D" />
              <path d="M13 11 L13 16 M13 16 L10 20 M13 16 L16 20 M10 13 L16 13" stroke="#F2B33D" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <svg className="trail-flag" width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
              <path d="M4 24 V3" stroke="#F6EEDC" strokeWidth="2" />
              <path d="M5 4 H18 L14 8 L18 12 H5 Z" fill="#F6EEDC" />
            </svg>
          </div>
          <dl className="hdr-stats">
            <div><dt>states &amp; territories</dt><dd>{stats.statesCovered}<small> / {stats.statesTotal}</small></dd></div>
            <div><dt>acres explored</dt><dd>{formatCompact(stats.acresVisited)}</dd></div>
            <div><dt>most recent visit</dt><dd>{formatVisitDates(stats.latestVisit)}</dd></div>
          </dl>
        </div>
      </div>
      <svg className="hdr-ridges" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 160 V92 L90 52 L170 88 L260 30 L350 84 L430 60 L520 96 L610 40 L700 82 L790 50 L880 92 L980 34 L1070 78 L1160 46 L1250 90 L1340 58 L1440 84 V160 Z" fill="#6B4E8C" opacity=".55" />
        <path d="M0 160 V112 L120 76 L210 110 L320 66 L430 112 L540 82 L650 118 L760 72 L880 116 L1000 80 L1110 114 L1220 74 L1330 108 L1440 90 V160 Z" fill="#0F4C5C" />
        <path d="M0 160 V134 L60 120 L100 132 L130 108 L160 132 L240 124 L330 140 L420 118 L460 134 L560 126 L660 142 L720 116 L760 136 L880 130 L990 142 L1060 120 L1100 138 L1200 128 L1300 142 L1360 122 L1440 136 V160 Z" fill="#1F5A3D" />
        <path d="M0 160 V150 Q360 140 720 150 T1440 148 V160 Z" fill="#F6EEDC" />
      </svg>
    </header>
  );
}
```

Note the `<dl>` renders `dt` after `dd` visually via CSS order; DOM order dt→dd keeps it valid.

`src/styles/header.css`:
```css
.hdr { position: relative; overflow: hidden; color: var(--paper);
  background: linear-gradient(180deg, #2e2350 0%, var(--dusk) 34%, #d9677a 64%, var(--sunset) 84%, var(--gold) 100%); }
.hdr-inner { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 40px 32px 150px;
  display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 32px; }
.hdr-title { flex: 1 1 420px; display: flex; flex-direction: column; gap: 10px; }
.hdr-kicker { font: 700 13px/1 var(--font-body); letter-spacing: .22em; text-transform: uppercase; color: var(--gold); }
.hdr h1 { font: 700 clamp(40px, 6vw, 64px)/1 var(--font-display); }
.hdr-title p { margin: 6px 0 0; font-size: 18px; line-height: 1.5; max-width: 520px; color: #fbe9da; }
.hdr-progress { flex: 0 1 460px; display: flex; flex-direction: column; gap: 14px; }
.hdr-count { display: flex; align-items: baseline; gap: 10px; }
.hdr-num { font: 700 clamp(80px, 10vw, 112px)/.85 var(--font-display); text-shadow: 4px 4px 0 var(--ink); }
.hdr-of { font: 600 clamp(28px, 3vw, 40px)/1 var(--font-display); color: #fbe9da; }
.trail { position: relative; height: 26px; }
.trail-path { position: absolute; inset: 11px 0 auto; border-top: 3px dashed rgba(246, 238, 220, .55); }
.trail-done { position: absolute; left: 0; top: 9px; height: 7px; border-radius: 4px; background: var(--gold); box-shadow: 0 0 0 1.5px var(--ink); }
.trail-hiker { position: absolute; top: 0; }
.trail-flag { position: absolute; right: -4px; top: -6px; }
.hdr-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 4px 0 0; }
.hdr-stats div { display: flex; flex-direction: column-reverse; gap: 4px; }
.hdr-stats dt { font-size: 13px; color: #fbe9da; }
.hdr-stats dd { margin: 0; font: 700 26px/1 var(--font-display); }
.hdr-stats small { font-size: 16px; color: #fbe9da; }
.hdr-ridges { position: absolute; left: 0; bottom: -1px; width: 100%; height: 160px; display: block; }
```

- [ ] **Step 3: Implement Controls**

`src/components/Controls.tsx`:
```tsx
import type { Filter } from "../lib/stats";

export type View = "map" | "grid";

export function Controls(props: {
  filter: Filter; onFilter: (f: Filter) => void; view: View; onView: (v: View) => void;
  counts: { all: number; visited: number; not: number };
}) {
  const { filter, onFilter, view, onView, counts } = props;
  const seg = <T extends string>(value: T, current: T, set: (v: T) => void, label: string) => (
    <button type="button" className={value === current ? "on" : ""} aria-pressed={value === current} onClick={() => set(value)}>
      {label}
    </button>
  );
  return (
    <div className="controls">
      <div className="seg" role="group" aria-label="Filter parks">
        {seg<Filter>("all", filter, onFilter, `All ${counts.all}`)}
        {seg<Filter>("visited", filter, onFilter, `Visited ${counts.visited}`)}
        {seg<Filter>("not", filter, onFilter, `Not yet ${counts.not}`)}
      </div>
      <div className="controls-right">
        <div className="legend" aria-hidden="true">
          <span><i className="dot dot-v" />Visited</span>
          <span><i className="dot dot-n" />Not yet</span>
        </div>
        <div className="seg" role="group" aria-label="View">
          {seg<View>("map", view, onView, "Map")}
          {seg<View>("grid", view, onView, "Grid")}
        </div>
      </div>
    </div>
  );
}
```

Add to `src/styles/global.css`:
```css
.controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; }
.controls-right { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.seg { display: inline-flex; background: #eaddbf; border: 1.5px solid var(--ink); border-radius: 999px; padding: 3px; gap: 2px; }
.seg button { font-weight: 600; font-size: 14px; background: none; border: 0; border-radius: 999px; padding: 11px 16px; min-height: 44px; cursor: pointer; }
.seg button.on { background: var(--ink); color: var(--paper); }
.legend { display: flex; gap: 14px; font-size: 13px; font-weight: 600; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.dot { width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 1.5px var(--ink); }
.dot-v { background: var(--sunset); border: 2.5px solid var(--gold); }
.dot-n { background: #b9b2a3; border: 2.5px solid var(--paper); }
.page { max-width: 1280px; margin: 0 auto; padding: 8px 32px 56px; display: flex; flex-direction: column; gap: 22px; }
@media (max-width: 640px) { .page { padding: 8px 16px 40px; } .legend { display: none; } }
```

- [ ] **Step 4: Implement GridView**

`src/components/GridView.tsx`:
```tsx
import { useMemo, useState } from "react";
import type { Park, Visit } from "../data/types";
import { REGIONS } from "../data/types";
import { dateSortKey, formatVisitDates, sortVisitsNewestFirst } from "../lib/dates";
import { matchesFilter, type Filter } from "../lib/stats";
import { ParkArt } from "./ParkArt";
import "../styles/grid.css";

type Sort = "name" | "visited" | "region" | "size";

export function GridView(props: { parks: Park[]; visits: Visit[]; visited: Set<string>; filter: Filter; onSelect: (id: string) => void }) {
  const { parks, visits, visited, filter, onSelect } = props;
  const [sort, setSort] = useState<Sort>("name");
  const latest = useMemo(() => {
    const m = new Map<string, Visit>();
    for (const v of sortVisitsNewestFirst(visits)) if (!m.has(v.park)) m.set(v.park, v);
    return m;
  }, [visits]);

  const shown = useMemo(() => {
    const byName = (a: Park, b: Park) => a.name.localeCompare(b.name);
    const list = parks.filter((p) => matchesFilter(p.id, visited, filter));
    const visitKey = (p: Park) => {
      const v = latest.get(p.id);
      return v?.start ? `2${dateSortKey(v.start, "start")}` : v ? "1" : "0";
    };
    const cmp: Record<Sort, (a: Park, b: Park) => number> = {
      name: byName,
      size: (a, b) => b.acres - a.acres,
      region: (a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || byName(a, b),
      visited: (a, b) => visitKey(b).localeCompare(visitKey(a)) || byName(a, b),
    };
    return [...list].sort(cmp[sort]);
  }, [parks, visited, filter, sort, latest]);

  return (
    <section className="grid-wrap" aria-label="All parks">
      <label className="grid-sort">
        Sort
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="name">Name</option>
          <option value="visited">Date visited</option>
          <option value="region">Region</option>
          <option value="size">Size</option>
        </select>
      </label>
      <ul className="grid">
        {shown.map((p) => {
          const v = visited.has(p.id);
          return (
            <li key={p.id}>
              <button type="button" className={`card ${v ? "card-v" : ""}`} onClick={() => onSelect(p.id)} aria-label={`${p.name}${v ? ", visited" : ", not yet visited"}`}>
                <div className="card-art"><ParkArt park={p} size={104} /></div>
                <div className="card-body">
                  <span className="card-name">{p.name}</span>
                  <span>{v ? `✓ Visited · ${formatVisitDates(latest.get(p.id)?.start, latest.get(p.id)?.end)}` : "Not yet"}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

`src/styles/grid.css`:
```css
.grid-wrap { display: flex; flex-direction: column; gap: 14px; }
.grid-sort { align-self: flex-end; display: flex; gap: 8px; align-items: center; font-weight: 600; font-size: 14px; }
.grid-sort select { font: inherit; padding: 10px 12px; min-height: 44px; border: 1.5px solid var(--ink); border-radius: 10px; background: var(--card); }
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 18px; }
.card { width: 100%; text-align: left; padding: 0; cursor: pointer; display: flex; flex-direction: column; overflow: hidden;
  background: #efe7d6; border: 2px solid #8a8577; border-radius: var(--radius); transition: transform .15s; }
.card:hover { transform: translateY(-3px); }
.card-art { display: flex; justify-content: center; padding: 16px; background: #e2d8c2; border-bottom: 2px solid #8a8577; }
.card-art img { border-radius: 50%; border: 3.5px solid var(--paper); box-shadow: 0 0 0 2px #8a8577; filter: saturate(.18) brightness(1.08); opacity: .85; }
.card-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.card-name { font: 700 20px/1.1 var(--font-display); color: #3e4a4e; }
.card-body span:not(.card-name) { font-size: 13px; font-weight: 600; color: var(--ink-soft); }
.card-v { background: var(--card); border-color: var(--ink); box-shadow: 5px 5px 0 var(--sunset); }
.card-v .card-art { background: linear-gradient(180deg, #d9677a, var(--sunset)); border-color: var(--ink); }
.card-v .card-art img { border-color: var(--gold); box-shadow: 0 0 0 2px var(--ink); filter: none; opacity: 1; }
.card-v .card-name { color: var(--ink); }
.card-v .card-body span:not(.card-name) { color: var(--accent-text); font-weight: 700; }
```

- [ ] **Step 5: Implement Timeline**

`src/components/Timeline.tsx`:
```tsx
import type { Park, Visit } from "../data/types";
import { formatVisitDates, sortVisitsChronological } from "../lib/dates";
import { ParkArt } from "./ParkArt";

export function Timeline({ parks, visits, onSelect }: { parks: Park[]; visits: Visit[]; onSelect: (id: string) => void }) {
  const byId = new Map(parks.map((p) => [p.id, p]));
  const { dated, undated } = sortVisitsChronological(visits);
  const item = (v: Visit, i: number) => {
    const p = byId.get(v.park)!;
    return (
      <li key={`${v.park}-${v.start ?? "tbd"}-${i}`}>
        <button type="button" onClick={() => onSelect(p.id)}>
          <ParkArt park={p} size={64} />
          <span className="tl-name">{p.name}</span>
          {v.start && <span className="tl-date">{formatVisitDates(v.start, v.end)}</span>}
        </button>
      </li>
    );
  };
  return (
    <section className="timeline" aria-labelledby="tl-h">
      <div className="tl-head">
        <h2 id="tl-h">The trail so far</h2>
        <span>Every trip, in order</span>
      </div>
      <div className="tl-box">
        {dated.length > 0 && <ol className="tl-row">{dated.map(item)}</ol>}
        {undated.length > 0 && (
          <div className="tl-group">
            <div className="tl-tbd"><span>Date TBD</span>{undated.length} {undated.length === 1 ? "visit" : "visits"} waiting on dates</div>
            <ul className="tl-row">{undated.map(item)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}
```

Add to `src/styles/global.css`:
```css
.timeline { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; }
.tl-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tl-head h2 { font-size: 34px; }
.tl-head span { font-size: 14px; color: var(--ink-soft); }
.tl-box { border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-2); padding: 18px 18px 6px; display: flex; flex-direction: column; gap: 12px; }
.tl-tbd { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-soft); }
.tl-tbd span { font: 700 12px/1 var(--font-body); letter-spacing: .18em; text-transform: uppercase; background: var(--ink); color: var(--paper); border-radius: 999px; padding: 6px 10px; }
.tl-row { list-style: none; margin: 0; padding: 4px 2px 14px; display: flex; gap: 14px; overflow-x: auto; }
.tl-row button { width: 96px; background: none; border: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.tl-row img { border-radius: 50%; border: 3px solid var(--gold); box-shadow: 0 0 0 1.5px var(--ink); transition: transform .15s; }
.tl-row button:hover img { transform: scale(1.08); }
.tl-name { font-weight: 600; font-size: 13px; line-height: 1.2; text-align: center; }
.tl-date { font-size: 12px; color: var(--accent-text); font-weight: 600; }
```

- [ ] **Step 6: Run** `npx vitest run src/components` → PASS. **Step 7: Commit** `feat: header, controls, grid view and timeline`.

---

### Task 9: Park panel, visit cards, photo viewer

**Files:**
- Create: `src/components/ParkPanel.tsx`, `src/components/VisitCard.tsx`, `src/components/PhotoViewer.tsx`, `src/styles/panel.css`
- Test: `src/components/ParkPanel.test.tsx`

**Interfaces:**
- Consumes: `Park`, `Visit`, `sortVisitsNewestFirst`, `formatVisitDates`, `formatInt`, `formatCompact`, `heroUrl`, `photoUrls`, `ParkArt`.
- Produces: `<ParkPanel park visits onClose onPrev onNext />` (visits = all visits; panel filters by park). Escape closes the viewer if open, else the panel.

- [ ] **Step 1: Failing tests**

`src/components/ParkPanel.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Park } from "../data/types";
import { ParkPanel } from "./ParkPanel";

vi.mock("../lib/assets", () => ({
  artUrl: () => ({ src: "x.svg", custom: false }),
  heroUrl: () => "hero.webp",
  photoUrls: (_p: string, f: string) => ({ thumb: `t-${f}`, full: `f-${f}` }),
}));

const zion = {
  id: "zion", name: "Zion", npsCode: "ZION", kind: "canyon", established: "1919-11-19", acres: 147242.66,
  visitors: 4692417, visitorsYear: 2024, sizeRank: 36, visitorRank: 3, description: "Sandstone canyons and the Virgin River.",
  highlights: ["Angels Landing", "The Narrows", "Emerald Pools"], bestSeason: "Apr–May, Sep–Oct",
  nearestAirport: "Las Vegas (LAS) · ~2.5 hr drive", npsUrl: "https://www.nps.gov/zion/", states: ["Utah"],
  heroPhoto: { credit: "NPS / Someone", sourceUrl: "https://commons.wikimedia.org/wiki/File:x.jpg" },
} as unknown as Park;

const noop = () => {};

test("visited park: visits section comes before the description, newest first, TBD last", () => {
  const visits = [
    { park: "zion" },
    { park: "zion", start: "2019-04", with: ["Sam"], note: "Narrows", photos: ["a.jpg"] },
    { park: "zion", start: "2023-10-02", end: "2023-10-04" },
    { park: "acadia", start: "2020" },
  ];
  render(<ParkPanel park={zion} visits={visits} onClose={noop} onPrev={noop} onNext={noop} />);
  const yours = screen.getByRole("heading", { name: /Your visits/ });
  const desc = screen.getByText(/Sandstone canyons/);
  expect(yours.compareDocumentPosition(desc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const dates = screen.getAllByTestId("visit-date").map((n) => n.textContent);
  expect(dates).toEqual(["Oct 2–4, 2023", "Apr 2019", "Date TBD"]);
  expect(screen.getByText("Sam")).toBeInTheDocument();
  expect(screen.getByText("3 trips")).toBeInTheDocument();
  expect(screen.queryByText(/Utah/)).not.toBeInTheDocument();
});

test("unvisited park: no visits section, Not yet stamp", () => {
  render(<ParkPanel park={zion} visits={[]} onClose={noop} onPrev={noop} onNext={noop} />);
  expect(screen.queryByRole("heading", { name: /Your visits/ })).not.toBeInTheDocument();
  expect(screen.getByText("Not yet")).toBeInTheDocument();
});

test("photo opens viewer; Escape closes viewer first, then the panel", async () => {
  const onClose = vi.fn();
  render(<ParkPanel park={zion} visits={[{ park: "zion", photos: ["a.jpg", "b.jpg"] }]} onClose={onClose} onPrev={noop} onNext={noop} />);
  await userEvent.click(screen.getByRole("button", { name: "Open photo 1 of 2" }));
  expect(screen.getByRole("dialog", { name: /Photo 1 of 2/ })).toBeInTheDocument();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("dialog", { name: /Photo 2 of 2/ })).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: /Photo/ })).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledOnce();
});

test("a visit with no companions or photos renders without empty sections", () => {
  render(<ParkPanel park={zion} visits={[{ park: "zion" }]} onClose={noop} onPrev={noop} onNext={noop} />);
  expect(screen.queryByText("With")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Open photo/ })).not.toBeInTheDocument();
});
```

Run → FAIL.

- [ ] **Step 2: Implement VisitCard**

`src/components/VisitCard.tsx`:
```tsx
import type { Visit } from "../data/types";
import { formatVisitDates } from "../lib/dates";
import { photoUrls } from "../lib/assets";

export function VisitCard({ visit, n, onOpenPhoto }: { visit: Visit; n: number; onOpenPhoto: (files: string[], i: number) => void }) {
  const photos = (visit.photos ?? []).filter((f) => photoUrls(visit.park, f));
  return (
    <article className="visit">
      <div className="visit-top">
        <span className="visit-date" data-testid="visit-date">{formatVisitDates(visit.start, visit.end)}</span>
        <span className="visit-n">Trip {n}</span>
      </div>
      {visit.with && visit.with.length > 0 && (
        <div className="visit-with">
          <span>With</span>
          {visit.with.map((w) => <span key={w} className="chip chip-pine">{w}</span>)}
        </div>
      )}
      {visit.note && <p className="visit-note">{visit.note}</p>}
      {photos.length > 0 && (
        <div className="visit-photos">
          {photos.map((f, i) => (
            <button key={f} type="button" onClick={() => onOpenPhoto(photos, i)} aria-label={`Open photo ${i + 1} of ${photos.length}`}>
              <img src={photoUrls(visit.park, f)!.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Implement PhotoViewer**

`src/components/PhotoViewer.tsx`:
```tsx
import { useRef } from "react";
import { photoUrls } from "../lib/assets";

export function PhotoViewer(props: { park: string; files: string[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const { park, files, index, onIndex, onClose } = props;
  const startX = useRef<number | null>(null);
  const go = (d: number) => onIndex((index + d + files.length) % files.length);
  const label = `Photo ${index + 1} of ${files.length}`;
  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current !== null && Math.abs(e.clientX - startX.current) > 40) go(e.clientX < startX.current ? 1 : -1);
        startX.current = null;
      }}
    >
      <img src={photoUrls(park, files[index])!.full} alt={label} />
      {files.length > 1 && (
        <>
          <button type="button" className="viewer-prev" aria-label="Previous photo" onClick={() => go(-1)}>‹</button>
          <button type="button" className="viewer-next" aria-label="Next photo" onClick={() => go(1)}>›</button>
        </>
      )}
      <button type="button" className="viewer-close" aria-label="Close photo" onClick={onClose}>✕</button>
    </div>
  );
}
```

- [ ] **Step 4: Implement ParkPanel**

`src/components/ParkPanel.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import type { Park, Visit } from "../data/types";
import { sortVisitsNewestFirst } from "../lib/dates";
import { formatCompact, formatInt } from "../lib/stats";
import { heroUrl } from "../lib/assets";
import { ParkArt } from "./ParkArt";
import { VisitCard } from "./VisitCard";
import { PhotoViewer } from "./PhotoViewer";
import "../styles/panel.css";

const CHIP_COLORS = ["chip-gold", "chip-sky", "chip-blush", "chip-sand"];

export function ParkPanel(props: { park: Park; visits: Visit[]; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const { park, onClose, onPrev, onNext } = props;
  const mine = sortVisitsNewestFirst(props.visits.filter((v) => v.park === park.id));
  const visited = mine.length > 0;
  const [viewer, setViewer] = useState<{ files: string[]; index: number } | null>(null);
  const [prevPark, setPrevPark] = useState(park.id);
  if (prevPark !== park.id) { setPrevPark(park.id); setViewer(null); } // reset during render, not in an effect
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus(), [park.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer) {
        if (e.key === "Escape") setViewer(null);
        else if (e.key === "ArrowRight") setViewer({ ...viewer, index: (viewer.index + 1) % viewer.files.length });
        else if (e.key === "ArrowLeft") setViewer({ ...viewer, index: (viewer.index - 1 + viewer.files.length) % viewer.files.length });
        return;
      }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer, onClose]);

  const hero = heroUrl(park.id);
  return (
    <aside className="panel" aria-label={`${park.name} details`}>
      <div className="panel-hdr">
        <div className="panel-nav">
          <div>
            <button type="button" className="circ" aria-label="Previous park" onClick={onPrev}>‹</button>
            <button type="button" className="circ" aria-label="Next park" onClick={onNext}>›</button>
          </div>
          <button ref={closeRef} type="button" className="circ circ-ink" aria-label="Close panel" onClick={onClose}>✕</button>
        </div>
        <div className="panel-id">
          <ParkArt park={park} size={128} className={`panel-art ${visited ? "is-v" : ""}`} />
          <div className="panel-names">
            <h2>{park.name}</h2>
            <span>National Park · Est. {park.established.slice(0, 4)}</span>
            <span className={`stamp ${visited ? "stamp-v" : "stamp-n"}`}>{visited ? "✓ Visited" : "Not yet"}</span>
          </div>
        </div>
      </div>

      <div className="panel-body">
        {visited && (
          <section className="panel-sec">
            <h3>Your visits <small>{mine.length} {mine.length === 1 ? "trip" : "trips"}</small></h3>
            {mine.map((v, i) => (
              <VisitCard key={i} visit={v} n={mine.length - i} onOpenPhoto={(files, index) => setViewer({ files, index })} />
            ))}
          </section>
        )}

        <figure className="hero">
          {hero ? <img src={hero} alt={`${park.name} National Park`} /> : <div className="hero-fallback"><ParkArt park={park} size={96} /></div>}
          <figcaption>Photo: <a href={park.heroPhoto.sourceUrl}>{park.heroPhoto.credit}</a></figcaption>
        </figure>

        <p className="panel-desc">{park.description}</p>

        <section className="panel-sec">
          <h3>Highlights</h3>
          <div className="chips">
            {park.highlights.map((h, i) => <span key={h} className={`chip ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>{h}</span>)}
          </div>
        </section>

        <section className="tiles" aria-label="Park facts">
          <div className="tile"><span className="tile-k">Size</span><span className="tile-v">{formatInt(park.acres)} ac</span><span className="tile-r">#{park.sizeRank} of 63 by size</span></div>
          <div className="tile"><span className="tile-k">Visitors ({park.visitorsYear})</span><span className="tile-v">{formatCompact(park.visitors)}</span><span className="tile-r">#{park.visitorRank} most visited</span></div>
          <div className="tile"><span className="tile-k">Established</span><span className="tile-v">{park.established.slice(0, 4)}</span></div>
          <div className="tile"><span className="tile-k">Best season</span><span className="tile-v tile-v-sm">{park.bestSeason}</span></div>
        </section>

        <section className="panel-sec getting">
          <h3>Getting there</h3>
          <p>{park.nearestAirport}</p>
          <a href={park.npsUrl} target="_blank" rel="noreferrer">Plan a visit on nps.gov →</a>
        </section>
      </div>

      {viewer && (
        <PhotoViewer park={park.id} files={viewer.files} index={viewer.index}
          onIndex={(index) => setViewer({ ...viewer, index })} onClose={() => setViewer(null)} />
      )}
    </aside>
  );
}
```

`src/styles/panel.css`:
```css
.panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(440px, 100vw); z-index: 50; overflow-y: auto;
  background: var(--paper); border-left: 2px solid var(--ink); box-shadow: -8px 0 0 rgba(30, 42, 47, .15);
  animation: panel-in .35s cubic-bezier(.2, 1.3, .4, 1); }
@keyframes panel-in { from { transform: translateX(100%); } }
@media (max-width: 640px) {
  .panel { top: auto; height: 82vh; width: 100vw; border-left: 0; border-top: 2px solid var(--ink); border-radius: 20px 20px 0 0;
    animation-name: sheet-in; }
  @keyframes sheet-in { from { transform: translateY(100%); } }
}
.panel-hdr { background: linear-gradient(180deg, var(--dusk) 0%, #d9677a 55%, var(--sunset) 100%); padding: 16px 20px 22px;
  display: flex; flex-direction: column; gap: 14px; border-bottom: 2px solid var(--ink); }
.panel-nav { display: flex; justify-content: space-between; }
.panel-nav > div { display: flex; gap: 6px; }
.circ { width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--ink); background: var(--paper); font-weight: 700; font-size: 18px; cursor: pointer; }
.circ-ink { background: var(--ink); color: var(--paper); }
.panel-id { display: flex; gap: 18px; align-items: center; }
.panel-art { border-radius: 50%; border: 4px solid var(--paper); box-shadow: 0 0 0 2px var(--ink), 5px 5px 0 var(--ink); flex: 0 0 auto; }
.panel-art.is-v { border-color: var(--gold); }
.panel-names { display: flex; flex-direction: column; gap: 8px; color: var(--paper); }
.panel-names h2 { font-size: 46px; line-height: 1; text-shadow: 3px 3px 0 var(--ink); }
.panel-names > span:first-of-type { font-size: 14px; font-weight: 600; color: #fff3e6; }
.stamp { align-self: flex-start; border: 2px solid var(--ink); border-radius: 6px; padding: 5px 10px; font: 700 13px/1 var(--font-body);
  letter-spacing: .12em; text-transform: uppercase; transform: rotate(-3deg); }
.stamp-v { background: var(--gold); color: var(--ink); }
.stamp-n { background: var(--paper); color: var(--ink-soft); }
.panel-body { padding: 22px 20px 28px; display: flex; flex-direction: column; gap: 26px; }
.panel-sec { display: flex; flex-direction: column; gap: 12px; }
.panel-sec h3 { font-size: 22px; display: flex; align-items: baseline; gap: 8px; }
.panel-sec h3 small { font: 600 14px var(--font-body); color: var(--ink-soft); }
.visit { background: var(--card); border: 2px solid var(--ink); border-radius: 14px; box-shadow: 4px 4px 0 var(--sunset); padding: 16px;
  display: flex; flex-direction: column; gap: 12px; }
.visit-top { display: flex; justify-content: space-between; align-items: center; }
.visit-date { font: 700 18px/1 var(--font-display); }
.visit-n { font: 700 11px/1 var(--font-body); letter-spacing: .14em; text-transform: uppercase; color: var(--accent-text); }
.visit-with { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 13px; color: var(--ink-soft); }
.visit-note { margin: 0; font-size: 15px; line-height: 1.5; font-style: italic; }
.visit-photos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.visit-photos button { padding: 0; border: 2px solid var(--ink); border-radius: 10px; overflow: hidden; aspect-ratio: 1; cursor: zoom-in; background: var(--paper-2); }
.visit-photos img { width: 100%; height: 100%; object-fit: cover; display: block; }
.chip { border: 2px solid var(--ink); border-radius: 999px; padding: 8px 13px; font-size: 14px; font-weight: 600; color: var(--ink); }
.chip-pine { background: var(--pine); color: var(--paper); border: 0; padding: 6px 11px; font-size: 13px; }
.chip-gold { background: var(--gold); } .chip-sky { background: var(--sky); } .chip-blush { background: var(--blush); } .chip-sand { background: var(--sand); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.hero { margin: 0; display: flex; flex-direction: column; gap: 8px; }
.hero img, .hero-fallback { width: 100%; height: 220px; object-fit: cover; border-radius: 14px; border: 2px solid var(--ink); display: block; }
.hero-fallback { display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #d9677a, var(--sunset)); }
.hero figcaption { font-size: 11px; color: var(--ink-soft); }
.panel-desc { margin: 0; font-size: 16px; line-height: 1.6; }
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.tile { border: 2px solid var(--ink); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 5px; background: var(--card); }
.tile-k { font: 700 11px/1 var(--font-body); letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); }
.tile-v { font: 700 24px/1 var(--font-display); }
.tile-v-sm { font-size: 20px; line-height: 1.1; }
.tile-r { font-size: 13px; color: var(--accent-text); font-weight: 600; }
.getting { border-top: 2px dashed #9c8160; padding-top: 18px; }
.getting p { margin: 0; font-size: 15px; }
.getting a { font-weight: 700; }
.viewer { position: fixed; inset: 0; z-index: 100; background: rgba(15, 20, 24, .94); display: flex; align-items: center; justify-content: center; touch-action: pan-y; }
.viewer img { max-width: 92vw; max-height: 88vh; border-radius: 8px; }
.viewer button { position: absolute; width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--paper); background: rgba(30, 42, 47, .7); color: var(--paper); font-size: 22px; cursor: pointer; }
.viewer-prev { left: 16px; } .viewer-next { right: 16px; } .viewer-close { top: 16px; right: 16px; }
```

- [ ] **Step 5: Run** `npx vitest run src/components/ParkPanel.test.tsx` → PASS. **Step 6: Commit** `feat: park panel with visits-first layout and photo viewer`.

---

### Task 10: Map view and App wiring (hash routing, filter, hover linking)

**Files:**
- Create: `src/components/MapView.tsx`, `src/styles/map.css`, `src/lib/useHashSelection.ts`
- Modify: `src/App.tsx` (replace placeholder), `src/App.test.tsx` (replace)
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: everything above. `layoutBadges`, `anchors`, `footprints`, `nationPath`, `bordersPath`, `stateLabels`, `INSETS`, `MAP_W`, `MAP_H`.
- Produces: the full app. `useHashSelection(valid: Set<string>): [string | null, (id: string | null) => void]`.

- [ ] **Step 1: Failing App tests**

`src/App.test.tsx`:
```tsx
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

vi.mock("./lib/assets", () => ({
  artUrl: () => ({ src: "x.svg", custom: false }),
  heroUrl: () => "hero.webp",
  photoUrls: () => undefined,
}));

beforeEach(() => history.replaceState(null, "", "/"));

test("renders title, 63 park buttons on the map, and the progress count", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Rishi's National Parks");
  expect(screen.getAllByRole("button", { name: /, (visited|not yet visited)$/ })).toHaveLength(63);
  expect(screen.getByRole("img", { name: /of 63 parks/ })).toBeInTheDocument();
});

test("clicking a park opens its panel and sets the hash; Escape closes", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Zion, visited" }));
  expect(screen.getByRole("complementary", { name: "Zion details" })).toBeInTheDocument();
  expect(location.hash).toBe("#zion");
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("complementary", { name: /details/ })).not.toBeInTheDocument();
});

test("a deep link opens the panel; an unknown hash is ignored", () => {
  history.replaceState(null, "", "/#arches");
  const { unmount } = render(<App />);
  expect(screen.getByRole("complementary", { name: "Arches details" })).toBeInTheDocument();
  unmount();
  history.replaceState(null, "", "/#not-a-park");
  render(<App />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test("hashchange (browser back) closes the panel", async () => {
  history.replaceState(null, "", "/#zion");
  render(<App />);
  act(() => {
    history.replaceState(null, "", "/");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test("filter fades non-matching badges and grid toggle swaps the view", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /^Not yet/ }));
  expect(screen.getByRole("button", { name: "Zion, visited" })).toHaveClass("dim");
  await userEvent.click(screen.getByRole("button", { name: "Grid" }));
  expect(screen.getByLabelText("Sort")).toBeInTheDocument();
});

test("next/prev in the panel steps alphabetically", async () => {
  history.replaceState(null, "", "/#zion");
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Next park" }));
  expect(screen.getByRole("complementary", { name: "Acadia details" })).toBeInTheDocument();
});
```

Run → FAIL.

- [ ] **Step 2: Hash hook**

`src/lib/useHashSelection.ts`:
```ts
import { useCallback, useEffect, useState } from "react";

export function useHashSelection(valid: Set<string>): [string | null, (id: string | null) => void] {
  const read = useCallback(() => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    return valid.has(h) ? h : null;
  }, [valid]);
  const [id, setId] = useState<string | null>(read);
  useEffect(() => {
    const on = () => setId(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [read]);
  const select = useCallback((next: string | null) => {
    if (next) window.history.pushState(null, "", `#${next}`);
    else window.history.pushState(null, "", window.location.pathname + window.location.search);
    setId(next);
  }, []);
  return [id, select];
}
```

- [ ] **Step 3: MapView**

`src/components/MapView.tsx`:
```tsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import "d3-transition";
import type { Park } from "../data/types";
import { anchors, bordersPath, footprints, nationPath } from "../lib/geo";
import { stateLabels } from "../lib/stateLabels";
import { INSETS, MAP_H, MAP_W } from "../lib/projection";
import { layoutBadges } from "../lib/callouts";
import { matchesFilter, type Filter } from "../lib/stats";
import { ParkArt } from "./ParkArt";
import "../styles/map.css";

interface Props {
  parks: Park[]; visited: Set<string>; filter: Filter; selectedId: string | null;
  onSelect: (id: string) => void; hoveredId: string | null; onHover: (id: string | null) => void;
}

export function MapView({ parks, visited, filter, selectedId, onSelect, hoveredId, onHover }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [width, setWidth] = useState(1216);
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const s = width / MAP_W;
  const height = MAP_H * s;
  const r = width < 640 ? 10 : 17;

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const measure = () => el.clientWidth > 0 && setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = select(svgRef.current!);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [MAP_W, MAP_H]])
      .on("zoom", (e) => setT(e.transform));
    svg.call(z);
    zoomRef.current = z;
    return () => { svg.on(".zoom", null); };
  }, []);

  const placed = useMemo(() => {
    const items = parks
      .map((p) => {
        const [x, y] = t.apply(anchors.get(p.id)!);
        return { id: p.id, ax: x * s, ay: y * s };
      })
      .filter((a) => a.ax >= 0 && a.ax <= width && a.ay >= 0 && a.ay <= height);
    return layoutBadges(items, { r, gap: 4, width, height });
  }, [parks, t, s, width, height, r]);

  const byId = useMemo(() => new Map(parks.map((p) => [p.id, p])), [parks]);
  const zoomBy = (k: number) => zoomRef.current && select(svgRef.current!).transition().duration(300).call(zoomRef.current.scaleBy, k);
  const reset = () => zoomRef.current && select(svgRef.current!).transition().duration(400).call(zoomRef.current.transform, zoomIdentity);
  const active = (ids: string[]) => ids.includes(hoveredId ?? "") || ids.includes(selectedId ?? "");

  return (
    <div className="map-frame">
      <div ref={wrapRef} className="map-wrap" style={{ height }}>
        <svg ref={svgRef} className="map-svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="presentation">
          <defs>
            <pattern id="waves" width="28" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 7 q7 -6 14 0 t14 0" fill="none" stroke="#2C6B7A" strokeWidth="1" />
            </pattern>
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
              <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.10 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <rect width={MAP_W} height={MAP_H} fill="var(--ocean)" />
          <rect width={MAP_W} height={MAP_H} fill="url(#waves)" opacity="0.55" />
          <g transform={t.toString()}>
            <path d={nationPath} fill="#0A3743" transform="translate(4 5)" />
            <path d={nationPath} fill="#EFDDB8" />
            <path d={nationPath} fill="#000" filter="url(#grain)" />
            <path d={bordersPath} fill="none" stroke="#B89A72" strokeWidth={0.7} strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
            <path d={nationPath} fill="none" stroke="var(--ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            {INSETS.map((i) => (
              <g key={i.id}>
                <rect x={i.x} y={i.y} width={i.w} height={i.h} rx={6} fill="var(--ocean)" stroke="var(--paper)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                <text x={i.x + i.w / 2} y={i.y + i.h + 11} className="inset-label" style={{ fontSize: 7 / t.k }}>{i.label}</text>
              </g>
            ))}
            <g className="state-labels" style={{ fontSize: 8.5 / t.k }}>
              {stateLabels.map((l) => <text key={l.text} x={l.x} y={l.y}>{l.text}</text>)}
            </g>
            {footprints.map((f) => {
              const on = active(f.parkIds);
              const dim = !f.parkIds.some((id) => matchesFilter(id, visited, filter));
              const handlers = {
                onMouseEnter: () => onHover(f.parkIds[0]), onMouseLeave: () => onHover(null),
                onClick: () => onSelect(f.parkIds[0]),
              };
              return f.tiny ? (
                <circle key={f.npsCode} cx={f.cx} cy={f.cy} r={3 / t.k} className={`fp ${on ? "on" : ""} ${dim ? "dim" : ""}`} {...handlers} />
              ) : (
                <path key={f.npsCode} d={f.d} className={`fp ${on ? "on" : ""} ${dim ? "dim" : ""}`} vectorEffect="non-scaling-stroke" {...handlers} />
              );
            })}
          </g>
        </svg>

        <svg className="leaders" width={width} height={height} aria-hidden="true">
          {placed.filter((p) => p.leader).map((p) => (
            <g key={p.id} className={active([p.id]) ? "on" : ""}>
              <line x1={p.ax} y1={p.ay} x2={p.x} y2={p.y} />
              <circle cx={p.ax} cy={p.ay} r={2.5} />
            </g>
          ))}
        </svg>

        <div className="badges">
          {placed.map((p, i) => {
            const park = byId.get(p.id)!;
            const v = visited.has(p.id);
            const cls = ["badge", v && "v", !matchesFilter(p.id, visited, filter) && "dim", active([p.id]) && "sel"].filter(Boolean).join(" ");
            return (
              <button key={p.id} type="button" className={cls} aria-label={`${park.name}, ${v ? "visited" : "not yet visited"}`}
                style={{ left: p.x, top: p.y, width: r * 2, height: r * 2, animationDelay: `${i * 12}ms` }}
                onClick={() => onSelect(p.id)} onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(p.id)} onBlur={() => onHover(null)}>
                <ParkArt park={park} size={r * 2} />
                {v && <span className="chk" aria-hidden="true">✓</span>}
                <span className="tag" aria-hidden="true">{park.name}</span>
              </button>
            );
          })}
        </div>

        <div className="zoom-btns">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.6)}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.6)}>−</button>
          <button type="button" aria-label="Reset zoom" onClick={reset}>⟲</button>
        </div>
      </div>
    </div>
  );
}
```

`src/styles/map.css`:
```css
.map-frame { border: 2px solid var(--ink); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow-hard); background: var(--ocean); }
.map-wrap { position: relative; width: 100%; }
.map-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; touch-action: none; }
.map-svg:active { cursor: grabbing; }
.state-labels text { font-family: var(--font-body); font-weight: 600; letter-spacing: .18em; fill: #9c8160; text-anchor: middle; pointer-events: none; }
.inset-label { font-family: var(--font-body); font-weight: 700; letter-spacing: .14em; fill: var(--paper); text-anchor: middle; }
.fp { fill: rgba(31, 90, 61, .38); stroke: var(--pine); stroke-width: 1; cursor: pointer; transition: fill .15s, opacity .15s; }
.fp.on { fill: rgba(242, 179, 61, .75); stroke: var(--ink); }
.fp.dim { opacity: .25; }
.leaders { position: absolute; inset: 0; pointer-events: none; }
.leaders line { stroke: var(--ink); stroke-width: 1.3; opacity: .8; }
.leaders circle { fill: var(--ink); }
.leaders .on line { stroke: var(--gold); stroke-width: 2.5; opacity: 1; }
.leaders .on circle { fill: var(--gold); }
.badges { position: absolute; inset: 0; pointer-events: none; }
.badge { position: absolute; transform: translate(-50%, -50%); padding: 0; border: 0; background: none; cursor: pointer; pointer-events: auto;
  z-index: 2; transition: transform .18s ease, left .35s ease, top .35s ease; animation: pop .4s backwards; }
@keyframes pop { from { transform: translate(-50%, -50%) scale(0); } }
.badge img { display: block; width: 100%; height: 100%; border-radius: 50%; border: 2.5px solid var(--paper); box-shadow: 0 0 0 1.5px var(--ink);
  filter: saturate(.18) brightness(1.08); opacity: .82; transition: filter .18s, opacity .18s; }
.badge.v img { border-color: var(--gold); box-shadow: 0 0 0 1.5px var(--ink), 0 3px 6px rgba(10, 30, 36, .45); filter: none; opacity: 1; }
.chk { position: absolute; right: -12%; top: -12%; width: 44%; height: 44%; border-radius: 50%; background: var(--gold); border: 1.5px solid var(--ink);
  display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: var(--ink); }
.tag { position: absolute; left: 50%; top: 100%; transform: translate(-50%, 3px); white-space: nowrap; font: 700 10.5px/1 var(--font-body); color: var(--ink);
  background: var(--paper); border: 1.5px solid var(--ink); border-radius: 4px; padding: 3px 6px; opacity: 0; pointer-events: none; transition: opacity .15s; }
.badge.v .tag { opacity: 1; }
.badge:hover, .badge:focus-visible, .badge.sel { transform: translate(-50%, -50%) scale(1.45); z-index: 5; }
.badge:hover img, .badge:focus-visible img, .badge.sel img { filter: none; opacity: 1; }
.badge:hover .tag, .badge:focus-visible .tag, .badge.sel .tag { opacity: 1; background: var(--ink); color: var(--paper); }
.badge.dim { opacity: .18; }
.zoom-btns { position: absolute; left: 14px; top: 14px; display: flex; flex-direction: column; gap: 6px; z-index: 6; }
.zoom-btns button { width: 44px; height: 44px; border-radius: 10px; border: 2px solid var(--ink); background: var(--paper); font-weight: 700; font-size: 20px; cursor: pointer; }
@media (max-width: 640px) { .tag { display: none; } .badge.v .chk { display: none; } }
```

Visited name tags that collide: tags of visited badges render beneath their badge; in clusters they can overlap a neighbor. Mitigation already in layout: `gap` is 4px; additionally set `.badge.v .tag` z-index via `.badge.v { z-index: 3 }` so the tag sits over unvisited badges. Verify visually in Task 12; if tags still collide in the Southwest cluster at 1216px, increase `gap` for visited badges by passing `gap: 14` (tag height) — the layout test must still pass.

- [ ] **Step 4: App**

`src/App.tsx`:
```tsx
import { useCallback, useMemo, useState } from "react";
import parksJson from "./data/parks.json";
import { visits } from "./data/visits";
import type { Park } from "./data/types";
import { computeStats, visitedIds, type Filter } from "./lib/stats";
import { useHashSelection } from "./lib/useHashSelection";
import { Header } from "./components/Header";
import { Controls, type View } from "./components/Controls";
import { MapView } from "./components/MapView";
import { GridView } from "./components/GridView";
import { Timeline } from "./components/Timeline";
import { ParkPanel } from "./components/ParkPanel";

const parks = parksJson as Park[]; // sorted by name
const ids = new Set(parks.map((p) => p.id));

export default function App() {
  const visited = useMemo(() => visitedIds(visits), []);
  const stats = useMemo(() => computeStats(parks, visits), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("map");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedId, select] = useHashSelection(ids);
  const idx = parks.findIndex((p) => p.id === selectedId);
  const step = (d: number) => select(parks[(idx + d + parks.length) % parks.length].id);
  const close = useCallback(() => select(null), [select]);

  return (
    <>
      <Header stats={stats} />
      <main className="page">
        <Controls filter={filter} onFilter={setFilter} view={view} onView={setView}
          counts={{ all: parks.length, visited: visited.size, not: parks.length - visited.size }} />
        {view === "map" ? (
          <MapView parks={parks} visited={visited} filter={filter} selectedId={selectedId} onSelect={select}
            hoveredId={hovered} onHover={setHovered} />
        ) : (
          <GridView parks={parks} visits={visits} visited={visited} filter={filter} onSelect={select} />
        )}
        <Timeline parks={parks} visits={visits} onSelect={select} />
      </main>
      <footer className="foot">
        Park facts: NPS &amp; Wikipedia. Hero photos: public domain (NPS). Made by <a href="https://rishimohnot.com">Rishi Mohnot</a>.
      </footer>
      {idx >= 0 && <ParkPanel park={parks[idx]} visits={visits} onClose={close} onPrev={() => step(-1)} onNext={() => step(1)} />}
    </>
  );
}
```

Add to `global.css`: `.foot { max-width: 1280px; margin: 0 auto; padding: 0 32px 40px; font-size: 13px; color: var(--ink-soft); }`

- [ ] **Step 5: Run full suite** — `npm test` → Expected: all PASS. `npm run build` → no errors.

- [ ] **Step 6: Commit** `feat: interactive map with footprints, callouts, zoom; wire up app with hash routing`.

---

### Task 11: Visit-photo pipeline

**Files:**
- Create: `scripts/lib/visitsSource.ts`, `scripts/photos-add.ts`
- Test: `scripts/lib/visitsSource.test.ts`, `scripts/photos-add.test.ts`

**Interfaces:**
- Produces:
  - `addPhotosToVisitsSource(src: string, park: string, visitNumber: number, files: string[]): string` (visitNumber is 1-based among that park's entries in file order; throws `Error("No visit #N for park")`)
  - `processPhoto(input: string, outPath: string): Promise<void>` (resize ≤2400px, auto-rotate, strip metadata, JPEG q82)
  - CLI `npm run photos:add -- <park> <visit-number> <files…>` → writes `photos/<park>/<park>-<k>.jpg` (k continues after existing files), updates `visits.ts`, runs prettier on it.

- [ ] **Step 1: Failing tests**

`scripts/lib/visitsSource.test.ts`:
```ts
import { addPhotosToVisitsSource } from "./visitsSource";

const src = `export const visits: Visit[] = [
  { park: "zion" },
  { park: "arches", start: "2020" },
  {
    park: "zion",
    start: "2023-10",
    photos: ["zion-1.jpg"],
  },
];
`;

test("adds a photos array to a one-line visit", () => {
  const out = addPhotosToVisitsSource(src, "zion", 1, ["zion-2.jpg"]);
  expect(out).toContain(`{ park: "zion", photos: ["zion-2.jpg"] }`);
});

test("appends to an existing photos array on the Nth visit of a park", () => {
  const out = addPhotosToVisitsSource(src, "zion", 2, ["zion-2.jpg", "zion-3.jpg"]);
  expect(out).toContain(`photos: ["zion-1.jpg", "zion-2.jpg", "zion-3.jpg"]`);
  expect(out).toContain(`{ park: "zion" },`); // first visit untouched
});

test("throws for a missing visit", () => {
  expect(() => addPhotosToVisitsSource(src, "zion", 3, ["x.jpg"])).toThrow(/No visit #3 for zion/);
  expect(() => addPhotosToVisitsSource(src, "acadia", 1, ["x.jpg"])).toThrow(/No visit #1 for acadia/);
});
```

`scripts/photos-add.test.ts`:
```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import { processPhoto } from "./photos-add";

test("processPhoto shrinks to 2400px and strips GPS/EXIF", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "np-"));
  const input = path.join(dir, "in.jpg");
  await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#f26b38" } })
    .withExif({ IFD0: { Make: "TestCam" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "37/1 18/1 0/1" } })
    .jpeg()
    .toFile(input);
  expect((await exifr.parse(input))?.Make).toBe("TestCam");
  const out = path.join(dir, "out.jpg");
  await processPhoto(input, out);
  const meta = await sharp(out).metadata();
  expect(Math.max(meta.width!, meta.height!)).toBe(2400);
  expect(await exifr.parse(out)).toBeUndefined();
});
```

`scripts/photos-add.ts` must not run its CLI when imported by the test — guard with `if (import.meta.url === pathToFileURL(process.argv[1]).href)`.

Run → FAIL.

- [ ] **Step 2: Implement**

`scripts/lib/visitsSource.ts`:
```ts
const quote = (f: string) => JSON.stringify(f);

export function addPhotosToVisitsSource(src: string, park: string, visitNumber: number, files: string[]): string {
  // Visit objects contain no nested braces, so a flat {...} match is safe.
  const re = /\{[^{}]*?park:\s*"([^"]+)"[^{}]*?\}/g;
  let seen = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1] !== park || ++seen !== visitNumber) continue;
    const obj = m[0];
    let next: string;
    const arr = /photos:\s*\[([^\]]*)\]/.exec(obj);
    if (arr) {
      const existing = arr[1].split(",").map((s) => s.trim()).filter(Boolean);
      next = obj.replace(arr[0], `photos: [${[...existing, ...files.map(quote)].join(", ")}]`);
    } else {
      next = obj.replace(/\s*,?\s*\}$/, (end) =>
        end.includes("\n") ? `,\n    photos: [${files.map(quote).join(", ")}],\n  }` : `, photos: [${files.map(quote).join(", ")}] }`,
      );
    }
    return src.slice(0, m.index) + next + src.slice(m.index + obj.length);
  }
  throw new Error(`No visit #${visitNumber} for ${park}`);
}
```

`scripts/photos-add.ts`:
```ts
// npm run photos:add -- <park> <visit-number> <files…>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { addPhotosToVisitsSource } from "./lib/visitsSource";

export async function processPhoto(input: string, outPath: string): Promise<void> {
  // sharp drops all metadata (EXIF incl. GPS, XMP, IPTC) unless .withMetadata() is called.
  await sharp(input).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
}

async function main() {
  const [park, nStr, ...files] = process.argv.slice(2);
  const n = Number(nStr);
  if (!park || !Number.isInteger(n) || n < 1 || files.length === 0) {
    throw new Error("usage: npm run photos:add -- <park-id> <visit-number> <files…>");
  }
  const parks: { id: string }[] = JSON.parse(fs.readFileSync("src/data/parks.json", "utf8"));
  if (!parks.some((p) => p.id === park)) throw new Error(`unknown park id: ${park}`);
  const visitsPath = "src/data/visits.ts";
  const src = fs.readFileSync(visitsPath, "utf8");
  addPhotosToVisitsSource(src, park, n, ["probe"]); // fail fast before writing any photo

  const dir = path.join("photos", park);
  fs.mkdirSync(dir, { recursive: true });
  let k = fs.readdirSync(dir).filter((f) => f.startsWith(`${park}-`)).length;
  const names: string[] = [];
  for (const f of files) {
    const name = `${park}-${++k}.jpg`;
    await processPhoto(f, path.join(dir, name));
    names.push(name);
    console.log(`${f} → ${dir}/${name}`);
  }
  fs.writeFileSync(visitsPath, addPhotosToVisitsSource(src, park, n, names));
  execFileSync("npx", ["prettier", "--write", visitsPath], { stdio: "inherit" });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 3: Run** `npx vitest run scripts` → PASS.

- [ ] **Step 4: End-to-end check on a scratch copy** — create a 3000px test JPEG in the scratchpad with sharp (as in the test), run `npm run photos:add -- zion 1 <that file>`, confirm `photos/zion/zion-1.jpg` exists, `visits.ts` gained `photos: ["zion-1.jpg"]`, `npm test` passes, then revert: `git checkout src/data/visits.ts && rm photos/zion/zion-1.jpg` (show Rishi the `rm` before running it, per policy).

- [ ] **Step 5: Commit** `feat: photos:add pipeline (resize, strip EXIF/GPS, register in visits.ts)`.

---

### Task 12: Visual verification in the browser

**Files:** none new (fixes go where defects are).

- [ ] **Step 1:** `npm run build && npx vite preview --port 4173` (background). Per lesson `chrome-no-file-urls-serve-locally`, use the served URL.
- [ ] **Step 2:** In Claude-in-Chrome (new tab, `http://localhost:4173`), at 1440px wide, screenshot and check against the mockup: header gradient + ridges, 14/63, map with state names/borders, footprints visible (e.g. Wrangell–St. Elias, Death Valley, Everglades), Southwest/California clusters fanned with leader lines not crossing, AS/VI insets, timeline "Date TBD" group.
- [ ] **Step 3:** Interactions: hover a badge → footprint + leader turn gold; click Zion → panel, visits first; Escape closes; `#arches` deep link; zoom in on Utah → badges glide toward footprints and leaders shrink; filter "Not yet"; Grid sort options; keyboard Tab through badges + Enter.
- [ ] **Step 4:** Resize to 390px wide in a fresh tab (lesson `chrome-resize-window-needs-fresh-tab`): header wraps, map fits, panel is a bottom sheet, grid usable.
- [ ] **Step 5:** Check console for errors (`read_console_messages`, pattern `error|warn`).
- [ ] **Step 6:** Fix defects found (each with a regression test where it is logic), rerun `npm test`, commit `fix: …` per defect.

---

### Task 13: GitHub repo + Cloudflare Pages deploy + custom domain

**Files:** none (infra). Confirm each outward-facing step with Rishi before running it.

- [ ] **Step 1: Check CLI auth** — `gh auth status` and `wrangler whoami` (per lesson `use-whoami-not-grep-on-credentials-file`). Expected: logged in as rishji / Rishi's Cloudflare account.
- [ ] **Step 2: Create repo and push** (confirm: public or private?)
  ```bash
  gh repo create rishji/national-parks --public --source . --remote origin --push
  ```
  Per lesson `gh-repo-create-default-branch`: we are on `main`, so the default branch will be `main`. Verify: `gh repo view rishji/national-parks --json defaultBranchRef`.
- [ ] **Step 3: Create Pages project and first deploy**
  ```bash
  wrangler pages project create national-parks --production-branch main
  npm run deploy
  ```
  Expected: a `*.national-parks.pages.dev` URL that serves the site. Open it in Chrome and spot-check (map renders, a panel opens).
- [ ] **Step 4: Custom domain (production DNS change — get explicit OK first).** In the Cloudflare dashboard (Claude-in-Chrome): Workers & Pages → national-parks → Custom domains → Set up a custom domain → `parks.rishimohnot.com` → activate (Cloudflare creates the CNAME in the `rishimohnot.com` zone). Verify:
  ```bash
  dig +short parks.rishimohnot.com
  curl -sI https://parks.rishimohnot.com | head -3   # Expected: HTTP/2 200
  ```
- [ ] **Step 5: Push-to-deploy.** In the same dashboard page: Settings → Builds → Connect to Git → `rishji/national-parks`, branch `main`, build command `npm run build`, output `dist`, env `NODE_VERSION=22`. Verify by pushing a trivial commit (e.g. README) and watching a new deployment appear.
- [ ] **Step 6: Verify what the user sees** (lesson `verify-what-the-user-sees`): load `https://parks.rishimohnot.com` in Chrome, open a visited park, check hero image and fonts load, no console errors.
- [ ] **Step 7:** Add `README.md` (one paragraph + link to site + "how to add a visit" pointing at AGENTS.md). Commit and push.
