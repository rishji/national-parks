import type { Visit } from "../data/types";
import { formatVisitDates } from "../lib/dates";
import { photoUrls } from "../lib/assets";

export function VisitCard({ visit, n, onOpenPhoto }: { visit: Visit; n: number; onOpenPhoto: (files: string[], i: number) => void }) {
  const photos = (visit.photos ?? []).filter((f) => photoUrls(visit.park, f));
  return (
    <article className="visit">
      <div className="visit-top">
        <span className="visit-date" data-testid="visit-date">{formatVisitDates(visit.start, visit.end)}</span>
        <span className="visit-n">Trip {n}</span>
      </div>
      {visit.with && visit.with.length > 0 && (
        <div className="visit-with">
          <span>With</span>
          {visit.with.map((w) => <span key={w} className="chip chip-pine">{w}</span>)}
        </div>
      )}
      {visit.note && <p className="visit-note">{visit.note}</p>}
      {photos.length > 0 && (
        <div className="visit-photos">
          {photos.map((f, i) => (
            <button key={f} type="button" onClick={() => onOpenPhoto(photos, i)} aria-label={`Open photo ${i + 1} of ${photos.length}`}>
              <img src={photoUrls(visit.park, f)!.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
