import { ICON_KINDS } from "../data/types";
import { artUrl, heroUrl } from "./assets";
import parksJson from "../data/parks.json";

test("every icon kind has an svg", () => {
  for (const kind of ICON_KINDS) expect(artUrl({ id: "no-such-park", kind }).src, kind).toMatch(/\.svg|^data:image\/svg\+xml/);
});

test("art falls back to the icon when no custom art exists", () => {
  expect(artUrl({ id: "no-such-park", kind: "canyon" })).toMatchObject({ custom: false });
});

test("every park has a hero photo", () => {
  for (const p of parksJson) expect(heroUrl(p.id), p.id).toBeTruthy();
});
