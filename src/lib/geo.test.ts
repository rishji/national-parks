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

test("every park has a non-empty footprint; Sequoia and Kings Canyon each get their own", () => {
  for (const p of parks) {
    const f = footprints.find((x) => x.parkIds.includes(p.id));
    expect(f, p.id).toBeDefined();
    expect(f!.d.length).toBeGreaterThan(10);
  }
  expect(footprints.find((f) => f.npsCode === "SEQU")!.parkIds).toEqual(["sequoia"]);
  expect(footprints.find((f) => f.npsCode === "KICA")!.parkIds).toEqual(["kings-canyon"]);
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

test("footprints are wound correctly: each centroid sits near its park's anchor", () => {
  for (const f of footprints) {
    for (const id of f.parkIds) {
      const [ax, ay] = anchors.get(id)!;
      expect(Math.hypot(f.cx - ax, f.cy - ay), `${f.npsCode} centroid far from ${id}`).toBeLessThan(40);
    }
  }
});
