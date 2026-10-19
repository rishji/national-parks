import { useCallback, useEffect, useState } from "react";

export function useHashSelection(valid: Set<string>): [string | null, (id: string | null) => void] {
  const read = useCallback(() => {
    let h: string;
    try {
      h = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return null; // malformed percent-encoding: treat like any unknown hash
    }
    return valid.has(h) ? h : null;
  }, [valid]);
  const [id, setId] = useState<string | null>(read);
  useEffect(() => {
    const on = () => setId(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [read]);
  const select = useCallback((next: string | null) => {
    if (next) window.history.pushState(null, "", `#${next}`);
    else window.history.pushState(null, "", window.location.pathname + window.location.search);
    setId(next);
  }, []);
  return [id, select];
}
