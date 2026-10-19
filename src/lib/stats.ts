import type { Park, Visit } from "../data/types";
import { dateSortKey } from "./dates";

export type Filter = "all" | "visited" | "not";

export const visitedIds = (visits: Visit[]) => new Set(visits.map((v) => v.park));

export function computeStats(parks: Park[], visits: Visit[]) {
  const visited = visitedIds(visits);
  const vParks = parks.filter((p) => visited.has(p.id));
  const latest = visits
    .filter((v) => v.start)
    .sort((a, b) => dateSortKey(b.end ?? b.start!, "end").localeCompare(dateSortKey(a.end ?? a.start!, "end")))[0];
  return {
    visitedCount: vParks.length,
    total: parks.length,
    statesCovered: new Set(vParks.flatMap((p) => p.states)).size,
    statesTotal: new Set(parks.flatMap((p) => p.states)).size,
    acresVisited: vParks.reduce((s, p) => s + p.acres, 0),
    ...(latest ? { latestVisit: latest.end ?? latest.start } : {}),
  };
}

export function matchesFilter(id: string, visited: Set<string>, f: Filter): boolean {
  return f === "all" || (f === "visited") === visited.has(id);
}

export function formatCompact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e5) return `${Math.round(n / 1e3)}K`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

export const formatInt = (n: number) => Math.round(n).toLocaleString("en-US");
