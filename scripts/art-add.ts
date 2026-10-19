// npm run art:add -- <park-id> <image-file> → src/assets/art/<id>.webp (512×512, center crop)
import fs from "node:fs";
import sharp from "sharp";
import parks from "../src/data/parks.json";

const [id, file] = process.argv.slice(2);
if (!id || !file) throw new Error("usage: npm run art:add -- <park-id> <image-file>");
if (!(parks as { id: string }[]).some((p) => p.id === id)) throw new Error(`unknown park id: ${id}`);
if (!fs.existsSync(file)) throw new Error(`no such file: ${file}`);
const out = `src/assets/art/${id}.webp`;
await sharp(file).rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 86 }).toFile(out);
console.log(`wrote ${out}`);
