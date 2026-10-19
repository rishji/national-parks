import type { Filter } from "../lib/stats";

export type View = "map" | "grid";

export function Controls(props: {
  filter: Filter; onFilter: (f: Filter) => void; view: View; onView: (v: View) => void;
  counts: { all: number; visited: number; not: number };
}) {
  const { filter, onFilter, view, onView, counts } = props;
  const seg = <T extends string>(value: T, current: T, set: (v: T) => void, label: string) => (
    <button type="button" className={value === current ? "on" : ""} aria-pressed={value === current} onClick={() => set(value)}>
      {label}
    </button>
  );
  return (
    <div className="controls">
      <div className="seg" role="group" aria-label="Filter parks">
        {seg<Filter>("all", filter, onFilter, `All ${counts.all}`)}
        {seg<Filter>("visited", filter, onFilter, `Visited ${counts.visited}`)}
        {seg<Filter>("not", filter, onFilter, `Not yet ${counts.not}`)}
      </div>
      <div className="controls-right">
        <div className="legend" aria-hidden="true">
          <span><i className="dot dot-v" />Visited</span>
          <span><i className="dot dot-n" />Not yet</span>
        </div>
        <div className="seg" role="group" aria-label="View">
          {seg<View>("map", view, onView, "Map")}
          {seg<View>("grid", view, onView, "Grid")}
        </div>
      </div>
    </div>
  );
}
