// Raw NPS boundaries → simplified, quantized lon/lat TopoJSON (one geometry per unit code).
import fs from "node:fs";
import { geoArea } from "d3-geo";
import { topology } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { FeatureCollection, Geometry, Position } from "geojson";

type Parks = Topology<{ parks: GeometryCollection<{ code: string }> }>;

const raw: FeatureCollection<Geometry, { UNIT_CODE: string }> = JSON.parse(
  fs.readFileSync("data/sources/nps-boundaries.geojson", "utf8"),
);

// ArcGIS emits RFC 7946 (counter-clockwise) rings for some units, and simplification can flip tiny islands;
// d3-geo needs clockwise exteriors, or a polygon reads as "the whole globe minus the park". Reverse any
// polygon whose spherical area exceeds a hemisphere.
const rewindPolygon = (rings: Position[][]) =>
  geoArea({ type: "Polygon", coordinates: rings }) > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings;
const rewind = (g: Geometry): Geometry =>
  g.type === "Polygon"
    ? { ...g, coordinates: rewindPolygon(g.coordinates) }
    : g.type === "MultiPolygon"
      ? { ...g, coordinates: g.coordinates.map(rewindPolygon) }
      : g.type === "GeometryCollection"
        ? { ...g, geometries: g.geometries.map(rewind) }
        : g;
const polygons = (g: Geometry): Position[][][] =>
  g.type === "Polygon"
    ? [g.coordinates]
    : g.type === "MultiPolygon"
      ? g.coordinates
      : g.type === "GeometryCollection"
        ? g.geometries.flatMap(polygons)
        : [];

// Merge multiple features per unit into one GeometryCollection keyed by code.
const byCode = new Map<string, Geometry[]>();
for (const f of raw.features) {
  if (!f.geometry) continue;
  byCode.set(f.properties.UNIT_CODE, [...(byCode.get(f.properties.UNIT_CODE) ?? []), rewind(f.geometry)]);
}
const fc: FeatureCollection = {
  type: "FeatureCollection",
  features: [...byCode].map(([code, geoms]) => ({
    type: "Feature",
    id: code,
    properties: { code },
    geometry: geoms.length === 1 ? geoms[0] : { type: "GeometryCollection", geometries: geoms },
  })),
};

const simplified = simplify(
  presimplify(topology({ parks: fc } as Record<string, FeatureCollection>, 1e6) as unknown as Parks),
  1e-7,
) as Parks; // ≈ 0.17 px² at scale 1300
// Decode, rewind again, drop slivers that quantization would collapse into degenerate (globe-sized) rings,
// and re-encode (quantized, not re-simplified). 1e-8 sr ≈ 0.4 km², far below a pixel at this map scale.
const MIN_SR = 1e-8;
const dropSlivers = (g: Geometry): Geometry => {
  const keep = polygons(rewind(g)).filter((p) => geoArea({ type: "Polygon", coordinates: p }) >= MIN_SR);
  return { type: "MultiPolygon", coordinates: keep };
};
const decoded = feature(simplified, simplified.objects.parks);
const cleaned: FeatureCollection = {
  ...decoded,
  features: decoded.features.map((f) => ({ ...f, geometry: dropSlivers(f.geometry) })),
};
const final = topology({ parks: cleaned } as Record<string, FeatureCollection>, 1e5) as unknown as Parks;

for (const f of feature(final, final.objects.parks).features) {
  const inverted = polygons(f.geometry).filter(
    (p) => geoArea({ type: "Polygon", coordinates: p }) > 2 * Math.PI,
  );
  if (inverted.length) throw new Error(`${f.id}: ${inverted.length} inverted polygon(s) after quantization`);
}
const out = JSON.stringify(final);
fs.writeFileSync("src/data/boundaries.json", out);
console.log(`boundaries.json: ${(out.length / 1024).toFixed(0)} KB, ${byCode.size} units`);
