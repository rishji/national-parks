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
