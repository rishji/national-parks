import { useEffect, useRef, useState } from "react";
import type { Park, Visit } from "../data/types";
import { sortVisitsNewestFirst } from "../lib/dates";
import { formatCompact, formatInt } from "../lib/stats";
import { heroUrl } from "../lib/assets";
import { ParkArt } from "./ParkArt";
import { VisitCard } from "./VisitCard";
import { PhotoViewer } from "./PhotoViewer";
import "../styles/panel.css";

const CHIP_COLORS = ["chip-gold", "chip-sky", "chip-blush", "chip-sand"];

export function ParkPanel(props: { park: Park; visits: Visit[]; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const { park, onClose, onPrev, onNext } = props;
  const mine = sortVisitsNewestFirst(props.visits.filter((v) => v.park === park.id));
  const visited = mine.length > 0;
  const [viewer, setViewer] = useState<{ files: string[]; index: number } | null>(null);
  const [prevPark, setPrevPark] = useState(park.id);
  if (prevPark !== park.id) { setPrevPark(park.id); setViewer(null); } // reset during render, not in an effect
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus(), [park.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer) {
        if (e.key === "Escape") setViewer(null);
        else if (e.key === "ArrowRight") setViewer({ ...viewer, index: (viewer.index + 1) % viewer.files.length });
        else if (e.key === "ArrowLeft") setViewer({ ...viewer, index: (viewer.index - 1 + viewer.files.length) % viewer.files.length });
        return;
      }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer, onClose]);

  const hero = heroUrl(park.id);
  return (
    <aside className="panel" aria-label={`${park.name} details`}>
      <div className="panel-hdr">
        <div className="panel-nav">
          <div>
            <button type="button" className="circ" aria-label="Previous park" onClick={onPrev}>‹</button>
            <button type="button" className="circ" aria-label="Next park" onClick={onNext}>›</button>
          </div>
          <button ref={closeRef} type="button" className="circ circ-ink" aria-label="Close panel" onClick={onClose}>✕</button>
        </div>
        <div className="panel-id">
          <ParkArt park={park} size={128} className={`panel-art ${visited ? "is-v" : ""}`} />
          <div className="panel-names">
            <h2>{park.name}</h2>
            <span>National Park · Est. {park.established.slice(0, 4)}</span>
            <span className={`stamp ${visited ? "stamp-v" : "stamp-n"}`}>{visited ? "✓ Visited" : "Not yet"}</span>
          </div>
        </div>
      </div>

      <div className="panel-body">
        {visited && (
          <section className="panel-sec">
            <h3>Your visits <small>{mine.length} {mine.length === 1 ? "trip" : "trips"}</small></h3>
            {mine.map((v, i) => (
              <VisitCard key={i} visit={v} n={mine.length - i} onOpenPhoto={(files, index) => setViewer({ files, index })} />
            ))}
          </section>
        )}

        <figure className="hero">
          {hero ? <img src={hero} alt={`${park.name} National Park`} /> : <div className="hero-fallback"><ParkArt park={park} size={96} /></div>}
          <figcaption>Photo: <a href={park.heroPhoto.sourceUrl}>{park.heroPhoto.credit}</a></figcaption>
        </figure>

        <p className="panel-desc">{park.description}</p>

        <section className="panel-sec">
          <h3>Highlights</h3>
          <div className="chips">
            {park.highlights.map((h, i) => <span key={h} className={`chip ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>{h}</span>)}
          </div>
        </section>

        <section className="tiles" aria-label="Park facts">
          <div className="tile"><span className="tile-k">Size</span><span className="tile-v">{formatInt(park.acres)} ac</span><span className="tile-r">#{park.sizeRank} of 63 by size</span></div>
          <div className="tile"><span className="tile-k">Visitors ({park.visitorsYear})</span><span className="tile-v">{formatCompact(park.visitors)}</span><span className="tile-r">#{park.visitorRank} most visited</span></div>
          <div className="tile"><span className="tile-k">Established</span><span className="tile-v">{park.established.slice(0, 4)}</span></div>
          <div className="tile"><span className="tile-k">Best season</span><span className="tile-v tile-v-sm">{park.bestSeason}</span></div>
        </section>

        <section className="panel-sec getting">
          <h3>Getting there</h3>
          <p>{park.nearestAirport}</p>
          <a href={park.npsUrl} target="_blank" rel="noreferrer">Plan a visit on nps.gov →</a>
        </section>
      </div>

      {viewer && (
        <PhotoViewer park={park.id} files={viewer.files} index={viewer.index}
          onIndex={(index) => setViewer({ ...viewer, index })} onClose={() => setViewer(null)} />
      )}
    </aside>
  );
}
