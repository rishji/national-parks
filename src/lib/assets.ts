import type { IconKind, Park } from "../data/types";

const icons = import.meta.glob<string>("../assets/icons/*.svg", { eager: true, query: "?url", import: "default" });
const art = import.meta.glob<string>("../assets/art/*.webp", { eager: true, query: "?url", import: "default" });
const heroes = import.meta.glob<string>("../assets/hero/*.jpg", {
  eager: true, query: "?w=1200&format=webp", import: "default",
});
const thumbs = import.meta.glob<string>("../../photos/*/*.{jpg,jpeg,webp}", {
  eager: true, query: "?w=480&format=webp", import: "default",
});
const fulls = import.meta.glob<string>("../../photos/*/*.{jpg,jpeg,webp}", {
  eager: true, query: "?w=2000&format=webp", import: "default",
});

const iconUrl = (kind: IconKind) => icons[`../assets/icons/${kind}.svg`];

export function artUrl(park: Pick<Park, "id" | "kind">): { src: string; custom: boolean } {
  const custom = art[`../assets/art/${park.id}.webp`];
  return custom ? { src: custom, custom: true } : { src: iconUrl(park.kind), custom: false };
}

export const heroUrl = (id: string): string | undefined => heroes[`../assets/hero/${id}.jpg`];

export function photoUrls(park: string, file: string) {
  const key = `../../photos/${park}/${file}`;
  return thumbs[key] && fulls[key] ? { thumb: thumbs[key], full: fulls[key] } : undefined;
}
