// npm run photos:add -- <park> <visit-number> <files…>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { addPhotosToVisitsSource } from "./lib/visitsSource";

export async function processPhoto(input: string, outPath: string): Promise<void> {
  // sharp drops all metadata (EXIF incl. GPS, XMP, IPTC) unless .withMetadata() is called.
  await sharp(input).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
}

async function main() {
  const [park, nStr, ...files] = process.argv.slice(2);
  const n = Number(nStr);
  if (!park || !Number.isInteger(n) || n < 1 || files.length === 0) {
    throw new Error("usage: npm run photos:add -- <park-id> <visit-number> <files…>");
  }
  const parks: { id: string }[] = JSON.parse(fs.readFileSync("src/data/parks.json", "utf8"));
  if (!parks.some((p) => p.id === park)) throw new Error(`unknown park id: ${park}`);
  const visitsPath = "src/data/visits.ts";
  const src = fs.readFileSync(visitsPath, "utf8");
  addPhotosToVisitsSource(src, park, n, ["probe"]); // fail fast before writing any photo

  const dir = path.join("photos", park);
  fs.mkdirSync(dir, { recursive: true });
  let k = fs.readdirSync(dir).filter((f) => f.startsWith(`${park}-`)).length;
  const names: string[] = [];
  for (const f of files) {
    const name = `${park}-${++k}.jpg`;
    await processPhoto(f, path.join(dir, name));
    names.push(name);
    console.log(`${f} → ${dir}/${name}`);
  }
  fs.writeFileSync(visitsPath, addPhotosToVisitsSource(src, park, n, names));
  // Run prettier's CLI through node directly: its bin isn't always marked executable after install.
  const prettier = createRequire(import.meta.url).resolve("prettier/bin/prettier.cjs");
  execFileSync(process.execPath, [prettier, "--write", visitsPath], { stdio: "inherit" });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
