import type { computeStats } from "../lib/stats";
import { formatCompact } from "../lib/stats";
import { formatVisitDates } from "../lib/dates";
import "../styles/header.css";

export function Header({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const pct = (stats.visitedCount / stats.total) * 100;
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <div className="hdr-title">
          <div className="hdr-kicker">A bucket list, {stats.total} parks long</div>
          <h1>Rishi's National Parks</h1>
          <p>Every U.S. national park, one trip at a time. Click a park to see what makes it special — and when I was there.</p>
        </div>
        <div className="hdr-progress">
          <div className="hdr-count">
            <span className="hdr-num">{stats.visitedCount}</span>
            <span className="hdr-of">/ {stats.total} parks</span>
          </div>
          <div className="trail" role="img" aria-label={`Progress: ${stats.visitedCount} of ${stats.total} parks, ${Math.round(pct)} percent`}>
            <div className="trail-path" />
            <div className="trail-done" style={{ width: `${pct}%` }} />
            <svg className="trail-hiker" style={{ left: `calc(${pct}% - 13px)` }} width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="13" cy="13" r="11" fill="#1E2A2F" />
              <circle cx="13" cy="8.5" r="2.3" fill="#F2B33D" />
              <path d="M13 11 L13 16 M13 16 L10 20 M13 16 L16 20 M10 13 L16 13" stroke="#F2B33D" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <svg className="trail-flag" width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
              <path d="M4 24 V3" stroke="#F6EEDC" strokeWidth="2" />
              <path d="M5 4 H18 L14 8 L18 12 H5 Z" fill="#F6EEDC" />
            </svg>
          </div>
          <dl className="hdr-stats">
            <div><dt>states &amp; territories</dt><dd>{stats.statesCovered}<small> / {stats.statesTotal}</small></dd></div>
            <div><dt>acres explored</dt><dd>{formatCompact(stats.acresVisited)}</dd></div>
            <div><dt>most recent visit</dt><dd>{formatVisitDates(stats.latestVisit)}</dd></div>
          </dl>
        </div>
      </div>
      <svg className="hdr-ridges" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 160 V92 L90 52 L170 88 L260 30 L350 84 L430 60 L520 96 L610 40 L700 82 L790 50 L880 92 L980 34 L1070 78 L1160 46 L1250 90 L1340 58 L1440 84 V160 Z" fill="#6B4E8C" opacity=".55" />
        <path d="M0 160 V112 L120 76 L210 110 L320 66 L430 112 L540 82 L650 118 L760 72 L880 116 L1000 80 L1110 114 L1220 74 L1330 108 L1440 90 V160 Z" fill="#0F4C5C" />
        <path d="M0 160 V134 L60 120 L100 132 L130 108 L160 132 L240 124 L330 140 L420 118 L460 134 L560 126 L660 142 L720 116 L760 136 L880 130 L990 142 L1060 120 L1100 138 L1200 128 L1300 142 L1360 122 L1440 136 V160 Z" fill="#1F5A3D" />
        <path d="M0 160 V150 Q360 140 720 150 T1440 148 V160 Z" fill="#F6EEDC" />
      </svg>
    </header>
  );
}
