import { anchors } from "./geo";
import { MAP_H, MAP_W } from "./projection";
import { layoutBadges, segmentsCross, tagBox, type Anchor, type LayoutOpts, type Placed } from "./callouts";
import parksJson from "../data/parks.json";
import { visits } from "../data/visits";

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

type Box = [number, number, number, number];
const boxesOverlap = (a: Box, b: Box) => a[0] < b[2] - 0.01 && b[0] < a[2] - 0.01 && a[1] < b[3] - 0.01 && b[1] < a[3] - 0.01;
const circleBox = (p: Placed, r: number): Box => [p.x - r, p.y - r, p.x + r, p.y + r];

function assertTagsClean(placed: Placed[], o: LayoutOpts) {
  assertClean(placed, o);
  for (const p of placed) {
    const t = tagBox(p, o);
    if (!t) continue;
    expect(t[0], `${p.id} tag off left`).toBeGreaterThanOrEqual(-0.01);
    expect(t[2], `${p.id} tag off right`).toBeLessThanOrEqual(o.width + 0.01);
    expect(t[3], `${p.id} tag off bottom`).toBeLessThanOrEqual(o.height + 0.01);
    for (const q of placed) {
      if (q === p) continue;
      expect(boxesOverlap(t, circleBox(q, o.r)), `${p.id} tag covers ${q.id}`).toBe(false);
      const u = tagBox(q, o);
      if (u) expect(boxesOverlap(t, u), `${p.id} tag overlaps ${q.id} tag`).toBe(false);
    }
  }
}

const tagW = (name: string) => Math.ceil(name.length * 6.4 + 15);
const names = new Map(parksJson.map((p) => [p.id, p.name]));

function taggedLayout(visited: Set<string>) {
  const { items, o } = realAnchors(1216);
  const opts = { ...o, r: 17, gap: 6 };
  const tagged = items.map((a) => (visited.has(a.id) ? { ...a, tagW: tagW(names.get(a.id)!) } : a));
  return { placed: layoutBadges(tagged, opts), opts };
}

test("with today's visits every name tag is shown, inside the frame and clear of badges and tags", () => {
  const { placed, opts } = taggedLayout(new Set(visits.map((v) => v.park)));
  expect(placed.filter((p) => p.tagHidden).map((p) => p.id)).toEqual([]);
  assertTagsClean(placed, opts);
});

test("with every park visited, tags that can't fit become hover-only; the rest stay clean", () => {
  const { placed, opts } = taggedLayout(new Set(parksJson.map((p) => p.id)));
  assertTagsClean(placed, opts);
  expect(placed.filter((p) => !p.tagHidden).length).toBeGreaterThanOrEqual(Math.ceil(63 * 0.75));
});
