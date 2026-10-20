// npm run art:sheet -- <sheet-image> → slices an 8×8 sheet of circular badges (parks in parks.json order,
// left-to-right, top-to-bottom; extra cells ignored) into src/assets/art/<id>.webp.
import sharp from "sharp";
import parks from "../src/data/parks.json";
import { findRuns } from "./lib/sheetGrid";

const file = process.argv[2];
if (!file) throw new Error("usage: npm run art:sheet -- <sheet-image>");
const ids = (parks as { id: string }[]).map((p) => p.id);

const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
// Background is a flat cream; a pixel is "ink" if it differs clearly from the top-left corner colour.
const bg = [data[0], data[1], data[2]];
const ink = (x: number, y: number) => {
  const i = (y * W + x) * 3;
  return Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 60;
};
const cols = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) n += +ink(x, y); return n; });
const rows = Array.from({ length: H }, (_, y) => { let n = 0; for (let x = 0; x < W; x++) n += +ink(x, y); return n; });
const minLen = Math.round(W / 16);
const xs = findRuns(cols, H * 0.05, minLen);
const ys = findRuns(rows, W * 0.05, minLen);
if (xs.length !== 8 || ys.length !== 8) throw new Error(`expected an 8×8 grid, found ${xs.length} columns × ${ys.length} rows`);

let n = 0;
for (const [y0, y1] of ys)
  for (const [x0, x1] of xs) {
    const id = ids[n++];
    if (!id) break;
    const size = Math.max(x1 - x0, y1 - y0);
    const left = Math.max(0, Math.round((x0 + x1 - size) / 2));
    const top = Math.max(0, Math.round((y0 + y1 - size) / 2));
    await sharp(file)
      .extract({ left, top, width: Math.min(size, W - left), height: Math.min(size, H - top) })
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 90 })
      .toFile(`src/assets/art/${id}.webp`);
  }
console.log(`wrote ${Math.min(n, ids.length)} badges to src/assets/art/`);
