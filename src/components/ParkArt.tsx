import type { Park } from "../data/types";
import { artUrl } from "../lib/assets";

export function ParkArt({ park, size, className }: { park: Pick<Park, "id" | "kind">; size: number; className?: string }) {
  const { src } = artUrl(park);
  return <img src={src} alt="" width={size} height={size} className={className} draggable={false} />;
}
