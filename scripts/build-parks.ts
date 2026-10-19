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
