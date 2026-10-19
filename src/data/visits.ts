import type { Visit } from "./types";

// One entry per trip. Dates: "YYYY" | "YYYY-MM" | "YYYY-MM-DD"; omit start for "Date TBD".
// Photos: add with `npm run photos:add -- <park> <visit-number> <files…>`.
// Dates below were found by intersecting Google location history + photo GPS with NPS park boundaries
// and the location-history D1 store (2026-10-19), confirmed by Rishi. Grand Teton, Yellowstone and Zion predate both.
export const visits: Visit[] = [
  { park: "badlands", start: "2016-08-23", end: "2016-08-24", with: ["Ray Wu", "Zayra Milan"] },
  { park: "bryce-canyon", start: "2016-01-02" },
  { park: "carlsbad-caverns", start: "2024-03-17", with: ["Robert Slaughter"] },
  { park: "congaree", start: "2022-09-06", with: ["Prabha Mohnot", "Shantilal Mohnot", "Sheel Mohnot", "Sunil Shahlot", "Mohini Shahlot"] },
  { park: "death-valley", start: "2021-02-13", end: "2021-02-14", with: ["Aishwarya Agarwal"] },
  { park: "everglades", start: "2024-12-28", with: ["Prabha Mohnot", "Shantilal Mohnot", "Sheel Mohnot", "Amruta Godbole"] },
  { park: "grand-canyon", start: "2011-05-14" },
  { park: "grand-teton" },
  { park: "guadalupe-mountains", start: "2024-03-14", end: "2024-03-17", with: ["Robert Slaughter"] },
  { park: "hawaii-volcanoes", start: "2021-10-05", end: "2021-10-06", with: ["Prabha Mohnot", "Shantilal Mohnot"] },
  { park: "joshua-tree", start: "2026-03-28", end: "2026-03-29", with: ["Kabir Dos Santos", "Kabirfest Bachelor Boys"] },
  { park: "kenai-fjords", start: "2025-06-20", end: "2025-06-21", with: ["Esha Joshi"] },
  { park: "new-river-gorge", start: "2022-09-07", with: ["Prabha Mohnot", "Shantilal Mohnot", "Sheel Mohnot", "Sunil Shahlot", "Mohini Shahlot"] },
  { park: "north-cascades", start: "2026-08-15", end: "2026-08-16", with: ["Esha Joshi"] },
  { park: "olympic", start: "2026-07-24", end: "2026-07-26", with: ["Esha Joshi"] },
  { park: "pinnacles", start: "2016-04-17", with: ["Prabha Mohnot", "Shantilal Mohnot"] },
  { park: "white-sands", start: "2024-03-16", with: ["Robert Slaughter"] },
  { park: "yellowstone" },
  { park: "yosemite", start: "2019-08-18", end: "2019-08-19" },
  { park: "zion" },
];
