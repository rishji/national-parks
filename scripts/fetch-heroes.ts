// Downloads each park's public-domain hero photo → src/assets/hero/<id>.jpg (1600px wide, metadata stripped).
import fs from "node:fs";
import sharp from "sharp";

const enrich: { id: string; hero: { url: string } }[] = JSON.parse(fs.readFileSync("data/sources/enrichment.json", "utf8"));
const only = process.argv[2];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Ask Commons for a 1600px rendition instead of the (often 20+ MB) original; originals get rate-limited.
const thumbUrl = (url: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${url.split("/").pop()}?width=1600`;

for (const e of enrich) {
  if (only && e.id !== only) continue;
  const out = `src/assets/hero/${e.id}.jpg`;
  if (fs.existsSync(out) && !only) continue;
  let res: Response | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(thumbUrl(e.hero.url), { headers: { "User-Agent": "parks.rishimohnot.com build (rsmohnot@gmail.com)" } });
    if (res.status !== 429) break;
    await sleep(1000 * (Number(res.headers.get("retry-after")) || 10 * (attempt + 1)));
  }
  if (!res?.ok) { console.error(`${e.id}: HTTP ${res?.status}`); process.exitCode = 1; continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log(`${e.id}: ok`);
  await sleep(1000);
}
