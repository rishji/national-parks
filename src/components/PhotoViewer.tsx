import { useRef } from "react";
import { photoUrls } from "../lib/assets";

export function PhotoViewer(props: { park: string; files: string[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const { park, files, index, onIndex, onClose } = props;
  const startX = useRef<number | null>(null);
  const go = (d: number) => onIndex((index + d + files.length) % files.length);
  const label = `Photo ${index + 1} of ${files.length}`;
  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current !== null && Math.abs(e.clientX - startX.current) > 40) go(e.clientX < startX.current ? 1 : -1);
        startX.current = null;
      }}
    >
      <img src={photoUrls(park, files[index])!.full} alt={label} />
      {files.length > 1 && (
        <>
          <button type="button" className="viewer-prev" aria-label="Previous photo" onClick={() => go(-1)}>‹</button>
          <button type="button" className="viewer-next" aria-label="Next photo" onClick={() => go(1)}>›</button>
        </>
      )}
      <button type="button" className="viewer-close" aria-label="Close photo" onClick={onClose}>✕</button>
    </div>
  );
}
