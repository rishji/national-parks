import type { Visit } from "../data/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const pad = (n: number) => String(n).padStart(2, "0");

export function parsePartialDate(s: string): { y: number; m?: number; d?: number } {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s);
  if (!match) throw new Error(`Invalid date: "${s}"`);
  const y = +match[1];
  const m = match[2] ? +match[2] : undefined;
  const d = match[3] ? +match[3] : undefined;
  if (m !== undefined && (m < 1 || m > 12)) throw new Error(`Invalid date: "${s}"`);
  if (d !== undefined && (d < 1 || d > daysIn(y, m!))) throw new Error(`Invalid date: "${s}"`);
  return d !== undefined ? { y, m, d } : m !== undefined ? { y, m } : { y };
}

export function dateSortKey(s: string, edge: "start" | "end"): string {
  const { y, m, d } = parsePartialDate(s);
  const mm = m ?? (edge === "start" ? 1 : 12);
  const dd = d ?? (edge === "start" ? 1 : daysIn(y, mm));
  return `${y}-${pad(mm)}-${pad(dd)}`;
}

function fmt(s: string, withYear = true): string {
  const { y, m, d } = parsePartialDate(s);
  if (m === undefined) return String(y);
  if (d === undefined) return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
  return withYear ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}`;
}

export function formatVisitDates(start?: string, end?: string): string {
  if (!start) return "Date TBD";
  if (!end || end === start) return fmt(start);
  const a = parsePartialDate(start);
  const b = parsePartialDate(end);
  const sameYear = a.y === b.y;
  if (sameYear && a.d !== undefined && b.d !== undefined && a.m === b.m) {
    return `${MONTHS[a.m! - 1]} ${a.d}–${b.d}, ${a.y}`;
  }
  if (sameYear && a.m !== undefined && b.m !== undefined && a.d === undefined && b.d === undefined) {
    return `${MONTHS[a.m - 1]} – ${MONTHS[b.m - 1]} ${a.y}`;
  }
  if (sameYear && a.d !== undefined && b.d !== undefined) return `${fmt(start, false)} – ${fmt(end)}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function sortVisitsNewestFirst<T extends Visit>(visits: T[]): T[] {
  const dated = visits.filter((v) => v.start);
  const undated = visits.filter((v) => !v.start);
  dated.sort((x, y) => dateSortKey(y.start!, "start").localeCompare(dateSortKey(x.start!, "start")));
  return [...dated, ...undated];
}

export function sortVisitsChronological<T extends Visit>(visits: T[]): { dated: T[]; undated: T[] } {
  const dated = visits.filter((v) => v.start);
  dated.sort((x, y) => dateSortKey(x.start!, "start").localeCompare(dateSortKey(y.start!, "start")));
  return { dated, undated: visits.filter((v) => !v.start) };
}
