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
