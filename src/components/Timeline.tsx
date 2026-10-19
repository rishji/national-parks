import type { Park, Visit } from "../data/types";
import { formatVisitDates, sortVisitsChronological } from "../lib/dates";
import { ParkArt } from "./ParkArt";

export function Timeline({ parks, visits, onSelect }: { parks: Park[]; visits: Visit[]; onSelect: (id: string) => void }) {
  const byId = new Map(parks.map((p) => [p.id, p]));
  const { dated, undated } = sortVisitsChronological(visits);
  const item = (v: Visit, i: number) => {
    const p = byId.get(v.park)!;
    return (
      <li key={`${v.park}-${v.start ?? "tbd"}-${i}`}>
        <button type="button" onClick={() => onSelect(p.id)}>
          <ParkArt park={p} size={64} />
          <span className="tl-name">{p.name}</span>
          {v.start && <span className="tl-date">{formatVisitDates(v.start, v.end)}</span>}
        </button>
      </li>
    );
  };
  return (
    <section className="timeline" aria-labelledby="tl-h">
      <div className="tl-head">
        <h2 id="tl-h">The trail so far</h2>
        <span>Every trip, in order</span>
      </div>
      <div className="tl-box">
        {dated.length > 0 && <ol className="tl-row">{dated.map(item)}</ol>}
        {undated.length > 0 && (
          <div className="tl-group">
            <div className="tl-tbd"><span>Date TBD</span>{undated.length} {undated.length === 1 ? "visit" : "visits"} waiting on dates</div>
            <ul className="tl-row">{undated.map(item)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}
