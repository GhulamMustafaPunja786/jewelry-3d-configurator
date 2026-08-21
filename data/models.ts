import type { JewelryModelOption } from "@/types/jewelry";

/**
 * Place production GLB assets under:
 *   public/models/rings/<slug>.glb
 * When missing, the viewer falls back to a procedural torus + gem.
 */
export const RING_MODELS: JewelryModelOption[] = [
  {
    slug: "solitaire-classic",
    name: "Classic Solitaire",
    category: "ring",
    modelUrl: "/models/rings/solitaire-classic.glb",
    description: "Timeless four-prong solitaire with a balanced shank.",
    baseWeightGrams: 4.2,
  },
  {
    slug: "halo-petite",
    name: "Petite Halo",
    category: "ring",
    modelUrl: "/models/rings/halo-petite.glb",
    description: "Delicate halo surround with a slender band.",
    baseWeightGrams: 5.1,
  },
  {
    slug: "east-west",
    name: "East-West Setting",
    category: "ring",
    modelUrl: "/models/rings/east-west.glb",
    description: "Modern horizontal stone orientation.",
    baseWeightGrams: 4.8,
  },
];

export function getModelBySlug(slug: string): JewelryModelOption | undefined {
  return RING_MODELS.find((m) => m.slug === slug);
}
