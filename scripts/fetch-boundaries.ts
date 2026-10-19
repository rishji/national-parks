// Downloads generalized NPS boundaries for the 63 park unit codes → data/sources/nps-boundaries.geojson.
import fs from "node:fs";
import parks from "../src/data/parks.json";

const LAYER =
  process.env.NPS_BOUNDARY_LAYER ??
  "https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2";
// NPS publishes Sequoia & Kings Canyon as one website (SEKI) but two boundaries (SEQU, KICA).
const codes = [
  ...new Set(
    (parks as { npsCode: string }[]).flatMap((p) => (p.npsCode === "SEKI" ? ["SEQU", "KICA"] : [p.npsCode])),
  ),
];
const where = `UNIT_CODE IN (${codes.map((c) => `'${c}'`).join(",")})`;
const params = new URLSearchParams({
  where,
  outFields: "UNIT_CODE,UNIT_NAME",
  outSR: "4326",
  f: "geojson",
  maxAllowableOffset: "0.002",
  geometryPrecision: "4",
  returnGeometry: "true",
});
const res = await fetch(`${LAYER}/query`, { method: "POST", body: params });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const gj = await res.json();
const got = new Set(gj.features.map((f: { properties: { UNIT_CODE: string } }) => f.properties.UNIT_CODE));
const missing = codes.filter((c) => !got.has(c));
if (missing.length) throw new Error(`Missing boundaries for ${missing.join(", ")}`);
fs.writeFileSync("data/sources/nps-boundaries.geojson", JSON.stringify(gj));
console.log(`saved ${gj.features.length} features for ${codes.length} unit codes`);
