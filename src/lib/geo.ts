import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature } from "geojson";
import statesTopo from "../data/states-albers-10m.json";
import parksTopo from "../data/boundaries.json";
import parksJson from "../data/parks.json";
import type { Park } from "../data/types";
import { projectPark, projectionFor } from "./projection";

const parks = parksJson as Park[];
const states = statesTopo as unknown as Topology<{ states: GeometryCollection; nation: GeometryCollection }>;
const units = parksTopo as unknown as Topology<{ parks: GeometryCollection<{ code: string }> }>;

const identity = geoPath();
export const nationPath = identity(feature(states, states.objects.nation))!;
export const bordersPath = identity(mesh(states, states.objects.states, (a, b) => a !== b))!;

export interface Footprint { npsCode: string; parkIds: string[]; d: string; tiny: boolean; cx: number; cy: number }

// Boundary unit codes that differ from the park's website code (SEKI covers both parks).
const BOUNDARY_PARK: Record<string, string> = { SEQU: "sequoia", KICA: "kings-canyon" };

const TINY_AREA = 6; // viewBox units² below which we draw a marker instead
const unitFeatures = (feature(units, units.objects.parks) as unknown as { features: Feature[] }).features;

export const footprints: Footprint[] = unitFeatures.map((f) => {
  const code = (f.properties as { code: string }).code;
  const parkIds = BOUNDARY_PARK[code] ? [BOUNDARY_PARK[code]] : parks.filter((p) => p.npsCode === code).map((p) => p.id);
  const path = geoPath(projectionFor(parkIds[0] ?? ""));
  const [cx, cy] = path.centroid(f);
  return { npsCode: code, parkIds, d: path(f) ?? "", tiny: path.area(f) < TINY_AREA, cx, cy };
});

export const anchors = new Map<string, [number, number]>(parks.map((p) => [p.id, projectPark(p)]));
