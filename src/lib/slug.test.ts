import { slugify } from "./slug";

test.each([
  ["Zion", "zion"],
  ["Haleakalā", "haleakala"],
  ["Hawaiʻi Volcanoes", "hawaii-volcanoes"],
  ["Wrangell–St. Elias", "wrangell-st-elias"],
  ["Black Canyon of the Gunnison", "black-canyon-of-the-gunnison"],
  ["Carlsbad Caverns *", "carlsbad-caverns"],
])("slugify(%s) = %s", (input, out) => expect(slugify(input)).toBe(out));
