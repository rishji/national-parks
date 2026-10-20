/** Spans [start, end) where profile[i] >= threshold, dropping spans shorter than minLen. */
export function findRuns(profile: number[], threshold: number, minLen: number): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  profile.forEach((v, i) => {
    if (v >= threshold && start < 0) start = i;
    if (v < threshold && start >= 0) {
      if (i - start >= minLen) runs.push([start, i]);
      start = -1;
    }
  });
  if (start >= 0 && profile.length - start >= minLen) runs.push([start, profile.length]);
  return runs;
}
