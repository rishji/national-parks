import { addPhotosToVisitsSource } from "./visitsSource";

const src = `export const visits: Visit[] = [
  { park: "zion" },
  { park: "arches", start: "2020" },
  {
    park: "zion",
    start: "2023-10",
    photos: ["zion-1.jpg"],
  },
];
`;

test("adds a photos array to a one-line visit", () => {
  const out = addPhotosToVisitsSource(src, "zion", 1, ["zion-2.jpg"]);
  expect(out).toContain(`{ park: "zion", photos: ["zion-2.jpg"] }`);
});

test("appends to an existing photos array on the Nth visit of a park", () => {
  const out = addPhotosToVisitsSource(src, "zion", 2, ["zion-2.jpg", "zion-3.jpg"]);
  expect(out).toContain(`photos: ["zion-1.jpg", "zion-2.jpg", "zion-3.jpg"]`);
  expect(out).toContain(`{ park: "zion" },`); // first visit untouched
});

test("throws for a missing visit", () => {
  expect(() => addPhotosToVisitsSource(src, "zion", 3, ["x.jpg"])).toThrow(/No visit #3 for zion/);
  expect(() => addPhotosToVisitsSource(src, "acadia", 1, ["x.jpg"])).toThrow(/No visit #1 for acadia/);
});
