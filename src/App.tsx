import { useCallback, useMemo, useState } from "react";
import parksJson from "./data/parks.json";
import { visits } from "./data/visits";
import type { Park } from "./data/types";
import { computeStats, visitedIds, type Filter } from "./lib/stats";
import { useHashSelection } from "./lib/useHashSelection";
import { Header } from "./components/Header";
import { Controls, type View } from "./components/Controls";
import { MapView } from "./components/MapView";
import { GridView } from "./components/GridView";
import { Timeline } from "./components/Timeline";
import { ParkPanel } from "./components/ParkPanel";

const parks = parksJson as Park[]; // sorted by name
const ids = new Set(parks.map((p) => p.id));

export default function App() {
  const visited = useMemo(() => visitedIds(visits), []);
  const stats = useMemo(() => computeStats(parks, visits), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("map");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedId, select] = useHashSelection(ids);
  const idx = parks.findIndex((p) => p.id === selectedId);
  const step = (d: number) => select(parks[(idx + d + parks.length) % parks.length].id);
  const close = useCallback(() => select(null), [select]);

  return (
    <>
      <Header stats={stats} />
      <main className="page">
        <Controls filter={filter} onFilter={setFilter} view={view} onView={setView}
          counts={{ all: parks.length, visited: visited.size, not: parks.length - visited.size }} />
        {view === "map" ? (
          <MapView parks={parks} visited={visited} filter={filter} selectedId={selectedId} onSelect={select}
            hoveredId={hovered} onHover={setHovered} />
        ) : (
          <GridView parks={parks} visits={visits} visited={visited} filter={filter} onSelect={select} />
        )}
        <Timeline parks={parks} visits={visits} onSelect={select} />
      </main>
      <footer className="foot">
        Park facts: NPS &amp; Wikipedia. Hero photos: public domain (NPS). Made by <a href="https://rishimohnot.com">Rishi Mohnot</a>.
      </footer>
      {idx >= 0 && <ParkPanel park={parks[idx]} visits={visits} onClose={close} onPrev={() => step(-1)} onNext={() => step(1)} />}
    </>
  );
}
