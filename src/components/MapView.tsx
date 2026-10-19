import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import "d3-transition";
import type { Park } from "../data/types";
import { anchors, bordersPath, footprints, nationPath } from "../lib/geo";
import { stateLabels } from "../lib/stateLabels";
import { INSETS, MAP_H, MAP_W } from "../lib/projection";
import { layoutBadges } from "../lib/callouts";
import { matchesFilter, type Filter } from "../lib/stats";
import { ParkArt } from "./ParkArt";
import "../styles/map.css";

interface Props {
  parks: Park[]; visited: Set<string>; filter: Filter; selectedId: string | null;
  onSelect: (id: string) => void; hoveredId: string | null; onHover: (id: string | null) => void;
}

export function MapView({ parks, visited, filter, selectedId, onSelect, hoveredId, onHover }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [width, setWidth] = useState(1216);
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const s = width / MAP_W;
  const height = MAP_H * s;
  const r = width < 640 ? 10 : 17;

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const measure = () => el.clientWidth > 0 && setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = select(svgRef.current!);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [MAP_W, MAP_H]])
      .on("zoom", (e) => setT(e.transform));
    svg.call(z);
    zoomRef.current = z;
    return () => { svg.on(".zoom", null); };
  }, []);

  const placed = useMemo(() => {
    const items = parks
      .map((p) => {
        const [x, y] = t.apply(anchors.get(p.id)!);
        return { id: p.id, ax: x * s, ay: y * s };
      })
      .filter((a) => a.ax >= 0 && a.ax <= width && a.ay >= 0 && a.ay <= height);
    return layoutBadges(items, { r, gap: 4, width, height });
  }, [parks, t, s, width, height, r]);

  const byId = useMemo(() => new Map(parks.map((p) => [p.id, p])), [parks]);
  const zoomBy = (k: number) => zoomRef.current && select(svgRef.current!).transition().duration(300).call(zoomRef.current.scaleBy, k);
  const reset = () => zoomRef.current && select(svgRef.current!).transition().duration(400).call(zoomRef.current.transform, zoomIdentity);
  const active = (ids: string[]) => ids.includes(hoveredId ?? "") || ids.includes(selectedId ?? "");

  return (
    <div className="map-frame">
      <div ref={wrapRef} className="map-wrap" style={{ height }}>
        <svg ref={svgRef} className="map-svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="presentation">
          <defs>
            <pattern id="waves" width="28" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 7 q7 -6 14 0 t14 0" fill="none" stroke="#2C6B7A" strokeWidth="1" />
            </pattern>
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
              <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.10 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <rect width={MAP_W} height={MAP_H} fill="var(--ocean)" />
          <rect width={MAP_W} height={MAP_H} fill="url(#waves)" opacity="0.55" />
          <g transform={t.toString()}>
            <path d={nationPath} fill="#0A3743" transform="translate(4 5)" />
            <path d={nationPath} fill="#EFDDB8" />
            <path d={nationPath} fill="#000" filter="url(#grain)" />
            <path d={bordersPath} fill="none" stroke="#B89A72" strokeWidth={0.7} strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
            <path d={nationPath} fill="none" stroke="var(--ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            {INSETS.map((i) => (
              <g key={i.id}>
                <rect x={i.x} y={i.y} width={i.w} height={i.h} rx={6} fill="var(--ocean)" stroke="var(--paper)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                <text x={i.x + i.w / 2} y={i.y + i.h + 11} className="inset-label" style={{ fontSize: 7 / t.k }}>{i.label}</text>
              </g>
            ))}
            <g className="state-labels" style={{ fontSize: 8.5 / t.k }}>
              {stateLabels.map((l) => <text key={l.text} x={l.x} y={l.y}>{l.text}</text>)}
            </g>
            {footprints.map((f) => {
              const on = active(f.parkIds);
              const dim = !f.parkIds.some((id) => matchesFilter(id, visited, filter));
              const handlers = {
                onMouseEnter: () => onHover(f.parkIds[0]), onMouseLeave: () => onHover(null),
                onClick: () => onSelect(f.parkIds[0]),
              };
              return f.tiny ? (
                <circle key={f.npsCode} cx={f.cx} cy={f.cy} r={3 / t.k} className={`fp ${on ? "on" : ""} ${dim ? "dim" : ""}`} {...handlers} />
              ) : (
                <path key={f.npsCode} d={f.d} className={`fp ${on ? "on" : ""} ${dim ? "dim" : ""}`} vectorEffect="non-scaling-stroke" {...handlers} />
              );
            })}
          </g>
        </svg>

        <svg className="leaders" width={width} height={height} aria-hidden="true">
          {placed.filter((p) => p.leader).map((p) => (
            <g key={p.id} className={active([p.id]) ? "on" : ""}>
              <line x1={p.ax} y1={p.ay} x2={p.x} y2={p.y} />
              <circle cx={p.ax} cy={p.ay} r={2.5} />
            </g>
          ))}
        </svg>

        <div className="badges">
          {placed.map((p, i) => {
            const park = byId.get(p.id)!;
            const v = visited.has(p.id);
            const cls = ["badge", v && "v", !matchesFilter(p.id, visited, filter) && "dim", active([p.id]) && "sel"].filter(Boolean).join(" ");
            return (
              <button key={p.id} type="button" className={cls} aria-label={`${park.name}, ${v ? "visited" : "not yet visited"}`}
                style={{ left: p.x, top: p.y, width: r * 2, height: r * 2, animationDelay: `${i * 12}ms` }}
                onClick={() => onSelect(p.id)} onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(p.id)} onBlur={() => onHover(null)}>
                <ParkArt park={park} size={r * 2} />
                {v && <span className="chk" aria-hidden="true">✓</span>}
                <span className="tag" aria-hidden="true">{park.name}</span>
              </button>
            );
          })}
        </div>

        <div className="zoom-btns">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.6)}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.6)}>−</button>
          <button type="button" aria-label="Reset zoom" onClick={reset}>⟲</button>
        </div>
      </div>
    </div>
  );
}
