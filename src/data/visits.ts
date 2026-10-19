import type { Visit } from "./types";

// One entry per trip. Dates: "YYYY" | "YYYY-MM" | "YYYY-MM-DD"; omit start for "Date TBD".
// Photos: add with `npm run photos:add -- <park> <visit-number> <files…>`.
// Dates below were found by intersecting Google location history + photo GPS with NPS park boundaries
// and the location-history D1 store (2026-10-19), confirmed by Rishi. Grand Teton, Yellowstone and Zion predate both.
export const visits: Visit[] = [
  {
    park: "badlands",
    start: "2016-08-23",
    end: "2016-08-24",
    with: ["Ray Wu", "Zayra Milan"],
    photos: ["badlands-1.jpg", "badlands-2.jpg", "badlands-3.jpg", "badlands-4.jpg", "badlands-5.jpg"],
  },
  {
    park: "bryce-canyon",
    start: "2016-01-02",
    photos: ["bryce-canyon-1.jpg", "bryce-canyon-2.jpg", "bryce-canyon-3.jpg", "bryce-canyon-4.jpg"],
  },
  {
    park: "bryce-canyon",
    start: "2009-06-19",
    end: "2009-06-21",
    with: ["Garrett Manhal", "Matt Graf", "Sophie Ryan"],
  },
  {
    park: "carlsbad-caverns",
    start: "2024-03-17",
    with: ["Robert Slaughter"],
    photos: [
      "carlsbad-caverns-1.jpg",
      "carlsbad-caverns-2.jpg",
      "carlsbad-caverns-3.jpg",
      "carlsbad-caverns-4.jpg",
    ],
  },
  {
    park: "congaree",
    start: "2022-09-06",
    with: ["Prabha Mohnot", "Shantilal Mohnot", "Sheel Mohnot", "Sunil Shahlot", "Mohini Shahlot"],
  },
  {
    park: "death-valley",
    start: "2021-02-13",
    end: "2021-02-14",
    with: ["Aishwarya Agarwal"],
    photos: [
      "death-valley-1.jpg",
      "death-valley-2.jpg",
      "death-valley-3.jpg",
      "death-valley-4.jpg",
      "death-valley-5.jpg",
    ],
  },
  {
    park: "everglades",
    start: "2024-12-28",
    with: ["Prabha Mohnot", "Shantilal Mohnot", "Sheel Mohnot", "Amruta Godbole"],
    photos: [
      "everglades-1.jpg",
      "everglades-2.jpg",
      "everglades-3.jpg",
      "everglades-4.jpg",
      "everglades-5.jpg",
    ],
  },
  {
    park: "grand-canyon",
    start: "2011-05-14",
    photos: [
      "grand-canyon-1.jpg",
      "grand-canyon-2.jpg",
      "grand-canyon-3.jpg",
      "grand-canyon-4.jpg",
      "grand-canyon-5.jpg",
    ],
  },
  { park: "grand-teton" },
  {
    park: "guadalupe-mountains",
    start: "2024-03-14",
    end: "2024-03-17",
    with: ["Robert Slaughter"],
    photos: ["guadalupe-mountains-1.jpg", "guadalupe-mountains-2.jpg", "guadalupe-mountains-3.jpg"],
  },
  {
    park: "hawaii-volcanoes",
    start: "2021-10-05",
    end: "2021-10-06",
    with: ["Prabha Mohnot", "Shantilal Mohnot"],
    photos: [
      "hawaii-volcanoes-1.jpg",
      "hawaii-volcanoes-2.jpg",
      "hawaii-volcanoes-3.jpg",
      "hawaii-volcanoes-4.jpg",
      "hawaii-volcanoes-5.jpg",
    ],
  },
  {
    park: "joshua-tree",
    start: "2026-03-28",
    end: "2026-03-29",
    with: ["Kabir Dos Santos", "Kabirfest Bachelor Boys"],
    photos: ["joshua-tree-1.jpg", "joshua-tree-2.jpg", "joshua-tree-3.jpg", "joshua-tree-4.jpg"],
  },
  {
    park: "kenai-fjords",
    start: "2025-06-20",
    end: "2025-06-21",
    with: ["Esha Joshi"],
    photos: ["kenai-fjords-1.jpg", "kenai-fjords-2.jpg", "kenai-fjords-3.jpg", "kenai-fjords-4.jpg"],
  },
  {
    park: "new-river-gorge",
    start: "2022-09-07",
    with: ["Prabha Mohnot", "Shantilal Mohnot", "Sheel Mohnot", "Sunil Shahlot", "Mohini Shahlot"],
    photos: [
      "new-river-gorge-1.jpg",
      "new-river-gorge-2.jpg",
      "new-river-gorge-3.jpg",
      "new-river-gorge-4.jpg",
      "new-river-gorge-5.jpg",
    ],
  },
  {
    park: "north-cascades",
    start: "2026-08-15",
    end: "2026-08-16",
    with: ["Esha Joshi"],
    photos: [
      "north-cascades-1.jpg",
      "north-cascades-2.jpg",
      "north-cascades-3.jpg",
      "north-cascades-4.jpg",
      "north-cascades-5.jpg",
    ],
  },
  {
    park: "olympic",
    start: "2026-07-24",
    end: "2026-07-26",
    with: ["Esha Joshi"],
    photos: ["olympic-1.jpg", "olympic-2.jpg", "olympic-3.jpg", "olympic-4.jpg", "olympic-5.jpg"],
  },
  {
    park: "pinnacles",
    start: "2016-04-17",
    with: ["Prabha Mohnot", "Shantilal Mohnot"],
    photos: ["pinnacles-1.jpg", "pinnacles-2.jpg", "pinnacles-3.jpg", "pinnacles-4.jpg"],
  },
  {
    park: "white-sands",
    start: "2024-03-16",
    with: ["Robert Slaughter"],
    photos: ["white-sands-1.jpg", "white-sands-2.jpg", "white-sands-3.jpg", "white-sands-4.jpg"],
  },
  { park: "yellowstone", start: "2009-07-17", end: "2009-07-19" },
  {
    park: "yosemite",
    start: "2019-08-18",
    end: "2019-08-19",
    with: ["Neeharika Bhartiya", "Vick Manocha", "Sheel Mohnot", "Amrit Dhir", "Neeraj Hablani"],
    photos: ["yosemite-1.jpg", "yosemite-2.jpg", "yosemite-3.jpg", "yosemite-4.jpg", "yosemite-5.jpg"],
  },
  {
    park: "zion",
    start: "2009-06-19",
    end: "2009-06-21",
    with: ["Garrett Manhal", "Matt Graf", "Sophie Ryan"],
    photos: ["zion-1.jpg", "zion-2.jpg", "zion-3.jpg", "zion-4.jpg", "zion-5.jpg"],
  },
];
