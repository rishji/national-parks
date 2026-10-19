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
