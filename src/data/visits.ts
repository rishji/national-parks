import type { Visit } from "./types";

// One entry per trip. Dates: "YYYY" | "YYYY-MM" | "YYYY-MM-DD"; omit start for "Date TBD".
// Photos: add with `npm run photos:add -- <park> <visit-number> <files…>`.
// Dates below were found by intersecting Google location history + photo GPS with NPS park boundaries
// (2026-10-19) and confirmed by Rishi. Grand Teton, Yellowstone and Zion predate the location history.
export const visits: Visit[] = [
  { park: "badlands", start: "2016-08-23", end: "2016-08-24" },
  { park: "bryce-canyon", start: "2016-01-02" },
  { park: "carlsbad-caverns", start: "2024-03-17" },
  { park: "congaree", start: "2022-09-06" },
  { park: "death-valley", start: "2021-02-13", end: "2021-02-14" },
  { park: "everglades", start: "2024-12-28" },
  { park: "grand-canyon", start: "2011-05-14" },
  { park: "grand-teton" },
  { park: "guadalupe-mountains", start: "2024-03-14", end: "2024-03-17" },
  { park: "hawaii-volcanoes", start: "2021-10-05", end: "2021-10-06" },
  { park: "joshua-tree", start: "2026-03-28", end: "2026-03-29" },
  { park: "kenai-fjords", start: "2025-06-20", end: "2025-06-21" },
  { park: "new-river-gorge", start: "2022-09-07" },
  { park: "pinnacles", start: "2016-04-17" },
  { park: "white-sands", start: "2024-03-16" },
  { park: "yellowstone" },
  { park: "yosemite", start: "2019-08-18", end: "2019-08-19" },
  { park: "zion" },
];
