export type JewelryCategory =
  | "ring"
  | "necklace"
  | "bracelet"
  | "earrings"
  | "pendant";

export type MetalOption = {
  code: string;
  name: string;
  type: string;
  karat: number | null;
  color: string;
  colorHex: string;
  metalness: number;
  roughness: number;
  pricePerGram: number;
  density: number;
};

export type StoneOption = {
  code: string;
  name: string;
  type: string;
  shape: string;
  colorHex: string;
  transmission: number;
  ior: number;
  pricePerCarat: number;
};

export type JewelryModelOption = {
  slug: string;
  name: string;
  category: JewelryCategory;
  modelUrl: string | null;
  description: string;
  baseWeightGrams: number;
};

export type RingSize = number;

export type RingConfig = {
  category: "ring";
  modelSlug: string;
  metalCode: string;
  stoneCode: string;
  stoneCarats: number;
  ringSize: RingSize;
  bandWidthMm: number;
  engraving?: string;
  finish: "polished" | "matte" | "brushed";
};

export type CategoryAvailability = {
  id: JewelryCategory;
  label: string;
  description: string;
  available: boolean;
  href: string;
};
