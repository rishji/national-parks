const quote = (f: string) => JSON.stringify(f);

export function addPhotosToVisitsSource(src: string, park: string, visitNumber: number, files: string[]): string {
  // Visit objects contain no nested braces, so a flat {...} match is safe.
  const re = /\{[^{}]*?park:\s*"([^"]+)"[^{}]*?\}/g;
  let seen = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1] !== park || ++seen !== visitNumber) continue;
    const obj = m[0];
    let next: string;
    const arr = /photos:\s*\[([^\]]*)\]/.exec(obj);
    if (arr) {
      const existing = arr[1].split(",").map((s) => s.trim()).filter(Boolean);
      next = obj.replace(arr[0], `photos: [${[...existing, ...files.map(quote)].join(", ")}]`);
    } else {
      next = obj.replace(/\s*,?\s*\}$/, (end) =>
        end.includes("\n") ? `,\n    photos: [${files.map(quote).join(", ")}],\n  }` : `, photos: [${files.map(quote).join(", ")}] }`,
      );
    }
    return src.slice(0, m.index) + next + src.slice(m.index + obj.length);
  }
  throw new Error(`No visit #${visitNumber} for ${park}`);
}
