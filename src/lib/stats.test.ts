import type { Park } from "../data/types";
import { computeStats, formatCompact, formatInt, matchesFilter, visitedIds } from "./stats";

const park = (id: string, states: string[], acres: number) => ({ id, states, acres }) as Park;
const parks = [park("a", ["Utah"], 100), park("b", ["Utah", "Arizona"], 200), park("c", ["Maine"], 400)];

test("computeStats counts unique visited parks, states and acres", () => {
  const s = computeStats(parks, [{ park: "a", start: "2019" }, { park: "a", start: "2022-06" }, { park: "b" }]);
  expect(s).toEqual({
    visitedCount: 2, total: 3, statesCovered: 2, statesTotal: 3, acresVisited: 300, latestVisit: "2022-06",
  });
});

test("computeStats with no dated visits has no latestVisit", () => {
  expect(computeStats(parks, [{ park: "c" }]).latestVisit).toBeUndefined();
});

test("matchesFilter", () => {
  const v = visitedIds([{ park: "a" }]);
  expect(matchesFilter("a", v, "all")).toBe(true);
  expect(matchesFilter("a", v, "visited")).toBe(true);
  expect(matchesFilter("b", v, "visited")).toBe(false);
  expect(matchesFilter("b", v, "not")).toBe(true);
  expect(matchesFilter("a", v, "not")).toBe(false);
});

test.each([
  [8865803.97, "8.9M"], [12937633, "12.9M"], [427562, "428K"], [9457, "9.5K"], [950, "950"],
])("formatCompact(%d) = %s", (n, out) => expect(formatCompact(n)).toBe(out));

test("formatInt rounds and groups", () => expect(formatInt(147242.66)).toBe("147,243"));
