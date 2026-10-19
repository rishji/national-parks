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
