import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import statesTopo from "../data/states-albers-10m.json";

const states = statesTopo as unknown as Topology<{ states: GeometryCollection<{ name: string }> }>;
const SMALL: Record<string, string> = {
  Vermont: "VT", "New Hampshire": "NH", Massachusetts: "MA", "Rhode Island": "RI", Connecticut: "CT",
  "New Jersey": "NJ", Delaware: "DE", Maryland: "MD", "District of Columbia": "", "West Virginia": "W. VA",
};
const NUDGE: Record<string, [number, number]> = {
  Florida: [14, 10], Louisiana: [-10, 0], Michigan: [10, 18], Idaho: [0, 20], California: [-12, 10],
  Kentucky: [8, 2], Hawaii: [10, -24],
};
const path = geoPath();
export const stateLabels = feature(states, states.objects.states).features.flatMap((f) => {
  const name = (f.properties as { name: string }).name;
  const text = name in SMALL ? SMALL[name] : name.toUpperCase();
  if (!text) return [];
  const [x, y] = path.centroid(f);
  const [dx, dy] = NUDGE[name] ?? [0, 0];
  return [{ text, x: x + dx, y: y + dy }];
});
