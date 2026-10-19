import { geoAlbersUsa, geoMercator, type GeoProjection } from "d3-geo";

export const MAP_W = 980;
export const MAP_H = 620;

// us-atlas states-albers-10m.json is pre-projected with exactly this projection.
const albers = geoAlbersUsa().scale(1300).translate([487.5, 305]) as unknown as GeoProjection;

export const INSETS = [
  { id: "american-samoa", x: 890, y: 392, w: 68, h: 56, label: "AM. SAMOA", bbox: [[-170.9, -14.42], [-169.38, -14.15]] },
  { id: "virgin-islands", x: 890, y: 472, w: 68, h: 56, label: "VIRGIN IS.", bbox: [[-64.81, 18.29], [-64.65, 18.38]] },
] as const;

const insetProj = Object.fromEntries(
  INSETS.map((i) => [
    i.id,
    geoMercator().fitExtent(
      [[i.x + 8, i.y + 8], [i.x + i.w - 8, i.y + i.h - 8]],
      { type: "MultiPoint", coordinates: i.bbox.map((c) => [...c]) },
    ),
  ]),
) as Record<string, GeoProjection>;

export const projectionFor = (parkId: string): GeoProjection => insetProj[parkId] ?? albers;

export function projectPark(p: { id: string; lon: number; lat: number }): [number, number] {
  const xy = projectionFor(p.id)([p.lon, p.lat]);
  if (!xy) throw new Error(`Cannot project ${p.id}`);
  return xy;
}
