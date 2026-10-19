// Builds mockup assets: base map SVG (states, labels, leader lines), park positions JSON, placeholder icon SVGs.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const d3 = require("/Users/rishi/Projects/rishimohnot.com/node_modules/d3-geo");
const topo = require("/Users/rishi/Projects/where-ive-been/node_modules/topojson-client");

const [sheetPath, atlasPath, outDir] = process.argv.slice(2);
fs.mkdirSync(`${outDir}/icons`, { recursive: true });

const P = {
  cream: "#F6EEDC", ink: "#1E2A2F", teal: "#0F4C5C", orange: "#F26B38", red: "#C8402E",
  pine: "#1F5A3D", sky: "#7FC8D9", gold: "#F2B33D", pink: "#F29C8F", violet: "#6B4E8C", sand: "#E9D3A8",
};

// ---------- placeholder icons (64x64, full-bleed scenes for a circular crop) ----------
const ICONS = {
  mountain: `<rect width="64" height="64" fill="${P.sky}"/><circle cx="16" cy="18" r="6" fill="${P.gold}"/><polygon points="-4,58 22,22 44,58" fill="${P.teal}"/><polygon points="16,60 40,14 68,60" fill="${P.pine}"/><polygon points="40,14 33,28 37,26 40,30 44,25 47,28" fill="${P.cream}"/><rect y="52" width="64" height="12" fill="${P.ink}"/>`,
  volcano: `<rect width="64" height="64" fill="${P.pink}"/><circle cx="26" cy="12" r="5" fill="${P.cream}"/><circle cx="34" cy="9" r="6" fill="${P.cream}"/><circle cx="41" cy="13" r="4" fill="${P.cream}"/><polygon points="2,60 24,24 40,24 62,60" fill="${P.ink}"/><polygon points="24,24 40,24 36,30 33,27 30,31 27,27" fill="${P.orange}"/><path d="M31 28 L29 40 L33 46 L30 60 L36 60 L37 46 L34 40 Z" fill="${P.orange}"/>`,
  lake: `<rect width="64" height="64" fill="${P.sky}"/><polygon points="-4,40 14,20 30,40" fill="${P.teal}"/><polygon points="20,40 40,16 66,40" fill="${P.violet}"/><rect y="38" width="64" height="26" fill="${P.teal}"/><path d="M10 46h16M34 50h18M16 55h14" stroke="${P.cream}" stroke-width="2" stroke-linecap="round"/><polygon points="0,64 0,52 10,58 18,64" fill="${P.pine}"/>`,
  canyon: `<rect width="64" height="64" fill="${P.gold}"/><circle cx="46" cy="16" r="7" fill="${P.cream}"/><polygon points="-2,26 22,26 26,64 -2,64" fill="${P.red}"/><polygon points="66,30 42,30 38,64 66,64" fill="${P.red}"/><polygon points="-2,40 18,40 24,64 -2,64" fill="${P.orange}"/><polygon points="66,44 46,44 40,64 66,64" fill="${P.orange}"/><polygon points="26,64 30,52 34,52 38,64" fill="${P.teal}"/>`,
  arch: `<rect width="64" height="64" fill="${P.gold}"/><path fill-rule="evenodd" fill="${P.red}" d="M6 60 L10 26 Q32 8 54 26 L58 60 L46 60 L44 36 Q32 22 20 36 L18 60 Z"/><rect y="56" width="64" height="8" fill="${P.ink}"/>`,
  cave: `<rect width="64" height="64" fill="${P.violet}"/><path d="M0 64 L0 30 Q32 -6 64 30 L64 64 Z" fill="${P.ink}"/><polygon points="16,26 20,26 18,38" fill="${P.cream}"/><polygon points="26,18 31,18 28.5,34" fill="${P.cream}"/><polygon points="38,18 42,18 40,30" fill="${P.cream}"/><polygon points="46,24 50,24 48,36" fill="${P.cream}"/><polygon points="22,64 25,50 28,64" fill="${P.orange}"/><polygon points="36,64 40,46 44,64" fill="${P.orange}"/>`,
  forest: `<rect width="64" height="64" fill="${P.sky}"/><polygon points="-6,64 32,30 70,64" fill="${P.teal}"/><polygon points="14,58 22,22 30,58" fill="${P.pine}"/><polygon points="30,60 40,14 50,60" fill="${P.pine}"/><polygon points="44,62 52,30 60,62" fill="${P.ink}"/><polygon points="2,62 9,36 16,62" fill="${P.ink}"/><rect y="58" width="64" height="6" fill="${P.ink}"/>`,
  sequoia: `<rect width="64" height="64" fill="${P.gold}"/><rect x="27" y="24" width="10" height="40" fill="${P.red}"/><ellipse cx="32" cy="18" rx="16" ry="12" fill="${P.pine}"/><ellipse cx="22" cy="30" rx="9" ry="6" fill="${P.pine}"/><ellipse cx="43" cy="34" rx="9" ry="6" fill="${P.pine}"/><polygon points="2,64 8,40 14,64" fill="${P.teal}"/><polygon points="50,64 56,44 62,64" fill="${P.teal}"/>`,
  glacier: `<rect width="64" height="64" fill="${P.sky}"/><polygon points="-2,44 16,14 30,44" fill="${P.cream}"/><polygon points="20,44 42,8 66,44" fill="${P.cream}"/><polygon points="42,8 36,24 44,44 30,44" fill="#CDE7EE"/><rect y="42" width="64" height="22" fill="${P.teal}"/><polygon points="10,48 18,48 16,54 12,54" fill="${P.cream}"/><polygon points="40,52 50,52 48,58 42,58" fill="${P.cream}"/>`,
  dunes: `<rect width="64" height="64" fill="${P.pink}"/><circle cx="44" cy="18" r="8" fill="${P.cream}"/><path d="M-2 44 Q16 26 34 44 Z" fill="${P.gold}"/><path d="M14 64 Q38 30 66 52 L66 64 Z" fill="${P.orange}"/><path d="M-2 64 L-2 50 Q20 42 40 64 Z" fill="${P.sand}"/>`,
  coast: `<rect width="64" height="64" fill="${P.sky}"/><circle cx="18" cy="16" r="6" fill="${P.gold}"/><polygon points="36,64 40,26 52,22 66,30 66,64" fill="${P.pine}"/><polygon points="40,26 52,22 66,30 66,34 46,30" fill="${P.ink}"/><rect y="44" width="44" height="20" fill="${P.teal}"/><path d="M2 48 q4 -4 8 0 t8 0 t8 0 t8 0 M6 56 q4 -4 8 0 t8 0 t8 0" stroke="${P.cream}" stroke-width="2" fill="none"/>`,
  swamp: `<rect width="64" height="64" fill="${P.sand}"/><rect y="46" width="64" height="18" fill="${P.teal}"/><path d="M24 46 L26 20 L30 20 L32 46 Z" fill="${P.ink}"/><ellipse cx="28" cy="16" rx="14" ry="7" fill="${P.pine}"/><path d="M44 46 L45 30 L48 30 L49 46 Z" fill="${P.ink}"/><ellipse cx="47" cy="27" rx="9" ry="5" fill="${P.pine}"/><polygon points="14,46 15,40 16,46" fill="${P.ink}"/><polygon points="36,46 37,41 38,46" fill="${P.ink}"/><path d="M6 54h12M38 58h16" stroke="${P.cream}" stroke-width="2" stroke-linecap="round"/>`,
  geyser: `<rect width="64" height="64" fill="${P.sky}"/><path d="M26 52 Q24 30 28 16 Q32 4 36 16 Q40 30 38 52 Z" fill="${P.cream}"/><circle cx="24" cy="18" r="6" fill="${P.cream}"/><circle cx="40" cy="14" r="7" fill="${P.cream}"/><ellipse cx="32" cy="54" rx="22" ry="6" fill="${P.gold}"/><rect y="54" width="64" height="10" fill="${P.ink}"/><polygon points="0,54 8,38 16,54" fill="${P.pine}"/><polygon points="48,54 56,40 64,54" fill="${P.pine}"/>`,
  island: `<rect width="64" height="64" fill="${P.gold}"/><circle cx="32" cy="34" r="12" fill="${P.orange}"/><rect y="40" width="64" height="24" fill="${P.teal}"/><ellipse cx="32" cy="44" rx="20" ry="5" fill="${P.sand}"/><path d="M33 42 Q34 30 30 20" stroke="${P.ink}" stroke-width="3" fill="none"/><path d="M30 20 q-10 -2 -14 6 M30 20 q10 -4 14 4 M30 20 q-4 -8 -12 -8 M30 20 q6 -8 14 -6" stroke="${P.pine}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M6 54h10M40 56h16" stroke="${P.cream}" stroke-width="2" stroke-linecap="round"/>`,
  desert: `<rect width="64" height="64" fill="${P.pink}"/><circle cx="46" cy="18" r="9" fill="${P.gold}"/><rect y="52" width="64" height="12" fill="${P.orange}"/><path d="M28 56 V18 a4 4 0 0 1 8 0 V56 Z" fill="${P.pine}"/><path d="M28 40 H20 V28 a3 3 0 0 1 6 0 V34 H28 Z M36 34 H42 V24 a3 3 0 0 1 6 0 V40 H36 Z" fill="${P.pine}"/>`,
  waterfall: `<rect width="64" height="64" fill="${P.sky}"/><polygon points="-2,10 26,18 24,64 -2,64" fill="${P.pine}"/><polygon points="66,6 38,18 40,64 66,64" fill="${P.teal}"/><rect x="26" y="18" width="12" height="40" fill="${P.cream}"/><path d="M29 22v30M35 24v30" stroke="#CDE7EE" stroke-width="1.5"/><ellipse cx="32" cy="58" rx="14" ry="4" fill="${P.cream}"/><rect y="58" width="64" height="6" fill="${P.ink}"/>`,
  hoodoo: `<rect width="64" height="64" fill="${P.violet}"/><circle cx="48" cy="16" r="6" fill="${P.gold}"/><path d="M8 64 V36 h2 v-6 h-3 v-4 h8 v4 h-3 v6 h2 V64 Z" fill="${P.orange}"/><path d="M24 64 V24 h2 v-6 h-3 v-5 h10 v5 h-3 v6 h2 V64 Z" fill="${P.red}"/><path d="M42 64 V32 h2 v-5 h-3 v-4 h9 v4 h-3 v5 h2 V64 Z" fill="${P.orange}"/><rect y="58" width="64" height="6" fill="${P.ink}"/>`,
};
for (const [k, body] of Object.entries(ICONS)) {
  fs.writeFileSync(`${outDir}/icons/${k}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`);
}

const KIND = {
  acadia: "coast", "american-samoa": "island", arches: "arch", badlands: "hoodoo", "big-bend": "desert",
  biscayne: "island", "black-canyon-of-the-gunnison": "canyon", "bryce-canyon": "hoodoo", canyonlands: "canyon",
  "capitol-reef": "canyon", "carlsbad-caverns": "cave", "channel-islands": "island", congaree: "swamp",
  "crater-lake": "lake", "cuyahoga-valley": "waterfall", "death-valley": "dunes", denali: "mountain",
  "dry-tortugas": "island", everglades: "swamp", "gates-of-the-arctic": "mountain", "gateway-arch": "arch",
  glacier: "glacier", "glacier-bay": "glacier", "grand-canyon": "canyon", "grand-teton": "mountain",
  "great-basin": "mountain", "great-sand-dunes": "dunes", "great-smoky-mountains": "forest",
  "guadalupe-mountains": "mountain", haleakala: "volcano", "hawaii-volcanoes": "volcano", "hot-springs": "geyser",
  "indiana-dunes": "dunes", "isle-royale": "lake", "joshua-tree": "desert", katmai: "volcano",
  "kenai-fjords": "glacier", "kings-canyon": "sequoia", "kobuk-valley": "dunes", "lake-clark": "lake",
  "lassen-volcanic": "volcano", "mammoth-cave": "cave", "mesa-verde": "canyon", "mount-rainier": "volcano",
  "new-river-gorge": "waterfall", "north-cascades": "mountain", olympic: "forest", "petrified-forest": "desert",
  pinnacles: "hoodoo", redwood: "sequoia", "rocky-mountain": "mountain", saguaro: "desert", sequoia: "sequoia",
  shenandoah: "forest", "theodore-roosevelt": "hoodoo", "virgin-islands": "island", voyageurs: "lake",
  "white-sands": "dunes", "wind-cave": "cave", "wrangell-st-elias": "glacier", yellowstone: "geyser",
  yosemite: "waterfall", zion: "canyon",
};

// ---------- parks from the sheet ----------
const sheet = JSON.parse(fs.readFileSync(sheetPath, "utf8")).values.slice(1);
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯʻ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
const parks = sheet.map((r) => {
  const name = r[0].replace(/[*†‡]/g, "").trim();
  const [statesStr, coord] = r[2].split("\n");
  const m = coord.match(/([\d.]+)°([NS])\s+([\d.]+)°([EW])/);
  const lat = +m[1] * (m[2] === "S" ? -1 : 1), lon = +m[3] * (m[4] === "W" ? -1 : 1);
  const id = slug(name);
  let xy = proj([lon, lat]);
  if (id === "american-samoa") xy = [924, 420];
  if (id === "virgin-islands") xy = [924, 500];
  return {
    id, name, kind: KIND[id], visited: r[1] === "TRUE", lat, lon, states: statesStr.split(/,\s*/),
    acres: +r[4].replace(/\[.*?\]/g, "").split(" ")[0].replace(/,/g, ""), visitors: +r[5].replace(/,/g, ""),
    established: r[3].replace(/\[.*?\]/g, ""), ax: xy[0], ay: xy[1], x: xy[0], y: xy[1],
  };
});
const missing = parks.filter((p) => !p.kind).map((p) => p.id);
if (missing.length) throw new Error("no kind for " + missing);

// ---------- de-overlap badges (weak spring to anchor, hard repulsion) ----------
const R = 14.5;
for (let it = 0; it < 600; it++) {
  for (const p of parks) { p.x += (p.ax - p.x) * 0.02; p.y += (p.ay - p.y) * 0.02; }
  for (let i = 0; i < parks.length; i++) for (let j = i + 1; j < parks.length; j++) {
    const a = parks[i], b = parks[j];
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
    const min = 2 * R + 2;
    if (d < min) { const push = (min - d) / 2; dx /= d; dy /= d; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
  }
}

// ---------- base map SVG ----------
const us = JSON.parse(fs.readFileSync(atlasPath, "utf8"));
const path = d3.geoPath();
const round = (d) => d.replace(/(\d+\.\d)\d+/g, "$1");
const nation = round(path(topo.feature(us, us.objects.nation)));
const borders = round(path(topo.mesh(us, us.objects.states, (a, b) => a !== b)));
const SMALL = { Vermont: "VT", "New Hampshire": "NH", Massachusetts: "MA", "Rhode Island": "RI", Connecticut: "CT", "New Jersey": "NJ", Delaware: "DE", Maryland: "MD", "District of Columbia": "", "West Virginia": "W. VA" };
const NUDGE = { Florida: [14, 10], Louisiana: [-10, 0], Michigan: [10, 18], Idaho: [0, 20], California: [-12, 10], Kentucky: [8, 2], Hawaii: [10, -24] };
const labels = topo.feature(us, us.objects.states).features.map((f) => {
  const n = f.properties.name; let [x, y] = path.centroid(f);
  const d = NUDGE[n] || [0, 0]; x += d[0]; y += d[1];
  const t = n in SMALL ? SMALL[n] : n.toUpperCase();
  return t ? `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${t}</text>` : "";
}).join("");
const leaders = parks.filter((p) => Math.hypot(p.x - p.ax, p.y - p.ay) > 6)
  .map((p) => `<line x1="${p.ax.toFixed(1)}" y1="${p.ay.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`).join("");
const anchors = parks.map((p) => `<circle cx="${p.ax.toFixed(1)}" cy="${p.ay.toFixed(1)}" r="1.6"/>`).join("");
const insets = [[890, 392, 68, 56, "AM. SAMOA"], [890, 472, 68, 56, "VIRGIN IS."]]
  .map(([x, y, w, h, t]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text class="il" x="${x + w / 2}" y="${y + h + 11}">${t}</text>`).join("");

const W = 980, H = 620;
const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 ${W} ${H + 10}">
<defs><pattern id="waves" width="28" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 q7 -6 14 0 t14 0" fill="none" stroke="#2C6B7A" stroke-width="1"/></pattern>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
<rect x="-10" y="-10" width="${W}" height="${H + 10}" fill="#0F4C5C"/><rect x="-10" y="-10" width="${W}" height="${H + 10}" fill="url(#waves)" opacity="0.55"/>
<g transform="translate(4 5)"><path d="${nation}" fill="#0A3743"/></g>
<path d="${nation}" fill="#EFDDB8"/><path d="${nation}" fill="#000" filter="url(#grain)"/>
<path d="${borders}" fill="none" stroke="#B89A72" stroke-width="0.7" stroke-dasharray="2 1.5"/>
<path d="${nation}" fill="none" stroke="#1E2A2F" stroke-width="1.4"/>
<g fill="#EFDDB8" stroke="#1E2A2F" stroke-width="1.2">${insets}</g>
<g font-family="Figtree, sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.6" fill="#9C8160" text-anchor="middle">${labels}</g>
<g font-family="Figtree, sans-serif" font-size="7" font-weight="700" letter-spacing="1.2" fill="#F6EEDC" text-anchor="middle" class="il">${""}</g>
<g stroke="#1E2A2F" stroke-width="0.8" opacity="0.7">${leaders}</g><g fill="#1E2A2F">${anchors}</g>
</svg>`.replace(/<text class="il"/g, `<text font-family="Figtree, sans-serif" font-size="7" font-weight="700" letter-spacing="1.2" fill="#F6EEDC" stroke="none" text-anchor="middle"`);
fs.writeFileSync(`${outDir}/map.svg`, mapSvg);

// ---------- park data for the artboards ----------
const byAcres = [...parks].sort((a, b) => b.acres - a.acres).map((p) => p.id);
const byVis = [...parks].sort((a, b) => b.visitors - a.visitors).map((p) => p.id);
const out = parks.map((p) => ({
  id: p.id, name: p.name, kind: p.kind, v: p.visited,
  l: +((p.x + 10) / W * 100).toFixed(2), t: +((p.y + 10) / (H + 10) * 100).toFixed(2),
}));
fs.writeFileSync(`${outDir}/parks.json`, JSON.stringify(out));
const visited = parks.filter((p) => p.visited);
const stateSet = new Set(parks.flatMap((p) => p.states)), vStates = new Set(visited.flatMap((p) => p.states));
console.log(JSON.stringify({
  visited: visited.length, statesWithParks: stateSet.size, statesVisited: vStates.size,
  acresVisited: visited.reduce((s, p) => s + p.acres, 0),
  zion: { ...parks.find((p) => p.id === "zion"), sizeRank: byAcres.indexOf("zion") + 1, visitorRank: byVis.indexOf("zion") + 1 },
  mapBytes: mapSvg.length,
}, null, 1));
