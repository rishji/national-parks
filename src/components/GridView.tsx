import { useMemo, useState } from "react";
import type { Park, Visit } from "../data/types";
import { REGIONS } from "../data/types";
import { dateSortKey, formatVisitDates, sortVisitsNewestFirst } from "../lib/dates";
import { matchesFilter, type Filter } from "../lib/stats";
import { ParkArt } from "./ParkArt";
import "../styles/grid.css";

type Sort = "name" | "visited" | "region" | "size";

export function GridView(props: { parks: Park[]; visits: Visit[]; visited: Set<string>; filter: Filter; onSelect: (id: string) => void }) {
  const { parks, visits, visited, filter, onSelect } = props;
  const [sort, setSort] = useState<Sort>("name");
  const latest = useMemo(() => {
    const m = new Map<string, Visit>();
    for (const v of sortVisitsNewestFirst(visits)) if (!m.has(v.park)) m.set(v.park, v);
    return m;
  }, [visits]);

  const shown = useMemo(() => {
    const byName = (a: Park, b: Park) => a.name.localeCompare(b.name);
    const list = parks.filter((p) => matchesFilter(p.id, visited, filter));
    const visitKey = (p: Park) => {
      const v = latest.get(p.id);
      return v?.start ? `2${dateSortKey(v.start, "start")}` : v ? "1" : "0";
    };
    const cmp: Record<Sort, (a: Park, b: Park) => number> = {
      name: byName,
      size: (a, b) => b.acres - a.acres,
      region: (a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || byName(a, b),
      visited: (a, b) => visitKey(b).localeCompare(visitKey(a)) || byName(a, b),
    };
    return [...list].sort(cmp[sort]);
  }, [parks, visited, filter, sort, latest]);

  return (
    <section className="grid-wrap" aria-label="All parks">
      <label className="grid-sort">
        Sort
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="name">Name</option>
          <option value="visited">Date visited</option>
          <option value="region">Region</option>
          <option value="size">Size</option>
        </select>
      </label>
      <ul className="grid">
        {shown.map((p) => {
          const v = visited.has(p.id);
          return (
            <li key={p.id}>
              <button type="button" className={`card ${v ? "card-v" : ""}`} onClick={() => onSelect(p.id)} aria-label={`${p.name}${v ? ", visited" : ", not yet visited"}`}>
                <div className="card-art"><ParkArt park={p} size={104} /></div>
                <div className="card-body">
                  <span className="card-name">{p.name}</span>
                  <span>{v ? `✓ Visited · ${formatVisitDates(latest.get(p.id)?.start, latest.get(p.id)?.end)}` : "Not yet"}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
