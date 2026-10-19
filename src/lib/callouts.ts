/** tagW: width of the name tag drawn centered under the badge (omit when no tag is shown). */
export interface Anchor { id: string; ax: number; ay: number; tagW?: number }
/** tagHidden: the tag couldn't be placed without covering something, so it shows on hover/focus only. */
export interface Placed extends Anchor { x: number; y: number; leader: boolean; tagHidden?: boolean; tagPos?: TagPos }
export interface LayoutOpts { r: number; gap: number; width: number; height: number }
type Seg = [number, number, number, number];
type Box = [number, number, number, number]; // x0, y0, x1, y1

export type TagPos = "below" | "above" | "right" | "left";
export const TAG_GAP = 3; // px between badge bottom and tag top (matches .tag translateY)
export const TAG_H = 20; // rendered tag height incl. border

/** The name tag's rectangle for a placed badge, or null if it has no tag. */
export function tagBox(
  p: { x: number; y: number; tagW?: number; tagHidden?: boolean; tagPos?: TagPos },
  o: Pick<LayoutOpts, "r">,
): Box | null {
  if (!p.tagW || p.tagHidden) return null;
  const w = p.tagW, h = TAG_H, d = o.r + TAG_GAP;
  switch (p.tagPos ?? "below") {
    case "above": return [p.x - w / 2, p.y - d - h, p.x + w / 2, p.y - d];
    case "right": return [p.x + d, p.y - h / 2, p.x + d + w, p.y + h / 2];
    case "left": return [p.x - d - w, p.y - h / 2, p.x - d, p.y + h / 2];
    default: return [p.x - w / 2, p.y + d, p.x + w / 2, p.y + d + h];
  }
}
const circleBox = (p: Placed, r: number): Box => [p.x - r, p.y - r, p.x + r, p.y + r];

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
  const halfW = Math.max(o.r, (p.tagW ?? 0) / 2);
  const below = p.tagW ? o.r + TAG_GAP + TAG_H : o.r;
  p.x = Math.min(Math.max(p.x, halfW), o.width - halfW);
  p.y = Math.min(Math.max(p.y, o.r), o.height - below);
};

/** Push two badges apart along the axis of least overlap so boxes A (of a) and B (of b) stop intersecting. */
function separate(a: Placed, b: Placed, A: Box, B: Box, o: LayoutOpts): boolean {
  const pad = 1;
  const ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]) + pad;
  const oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]) + pad;
  if (ox <= pad || oy <= pad) return false;
  if (ox < oy) {
    const s = Math.sign((B[0] + B[2]) - (A[0] + A[2])) || (a.id < b.id ? 1 : -1);
    a.x -= (s * ox) / 2; b.x += (s * ox) / 2;
  } else {
    const s = Math.sign((B[1] + B[3]) - (A[1] + A[3])) || (a.id < b.id ? 1 : -1);
    a.y -= (s * oy) / 2; b.y += (s * oy) / 2;
  }
  clamp(a, o); clamp(b, o);
  return true;
}

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
        if (a.tagW || b.tagW) {
          const ta = tagBox(a, o), tb = tagBox(b, o);
          if (ta && separate(a, b, ta, circleBox(b, o.r), o)) moved = true;
          if (tb && separate(a, b, circleBox(a, o.r), tb, o)) moved = true;
          if (ta && tb && separate(a, b, tagBox(a, o)!, tagBox(b, o)!, o)) moved = true;
        }
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

const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Last resort for crowded maps: keep tags greedily (badges on their own spot first), trying each tag below, above,
 * right and left of its badge, and make tags that fit nowhere hover-only. */
function hideCollidingTags(ps: Placed[], o: LayoutOpts) {
  const kept: Box[] = [];
  const fits = (p: Placed, t: Box) =>
    t[0] >= 0 && t[1] >= 0 && t[2] <= o.width && t[3] <= o.height &&
    !kept.some((k) => overlaps(t, k)) && !ps.some((q) => q !== p && overlaps(t, circleBox(q, o.r)));
  const order = ps.filter((p) => p.tagW).sort((a, b) => Number(a.leader) - Number(b.leader) || a.id.localeCompare(b.id));
  for (const p of order) {
    const pos = (["below", "above", "right", "left"] as const).find((c) => fits(p, tagBox({ ...p, tagPos: c }, o)!));
    if (pos) { p.tagPos = pos; kept.push(tagBox(p, o)!); } else p.tagHidden = true;
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
  hideCollidingTags(out, o);
  return out;
}
