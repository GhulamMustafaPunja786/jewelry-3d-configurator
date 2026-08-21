import type { MetalOption } from "@/types/jewelry";

export const METALS: MetalOption[] = [
  {
    code: "AU18Y",
    name: "18K Yellow Gold",
    type: "gold",
    karat: 18,
    color: "yellow",
    colorHex: "#D4AF37",
    metalness: 1,
    roughness: 0.22,
    pricePerGram: 72,
    density: 15.6,
  },
  {
    code: "AU18W",
    name: "18K White Gold",
    type: "gold",
    karat: 18,
    color: "white",
    colorHex: "#E8E6E3",
    metalness: 1,
    roughness: 0.2,
    pricePerGram: 74,
    density: 15.8,
  },
  {
    code: "AU18R",
    name: "18K Rose Gold",
    type: "gold",
    karat: 18,
    color: "rose",
    colorHex: "#B76E79",
    metalness: 1,
    roughness: 0.24,
    pricePerGram: 73,
    density: 15.5,
  },
  {
    code: "PT950",
    name: "Platinum 950",
    type: "platinum",
    karat: null,
    color: "platinum",
    colorHex: "#C0C0C0",
    metalness: 1,
    roughness: 0.28,
    pricePerGram: 42,
    density: 21.4,
  },
  {
    code: "AG925",
    name: "Sterling Silver",
    type: "silver",
    karat: null,
    color: "silver",
    colorHex: "#C0C0C8",
    metalness: 1,
    roughness: 0.3,
    pricePerGram: 1.2,
    density: 10.4,
  },
];

export function getMetalByCode(code: string): MetalOption | undefined {
  return METALS.find((m) => m.code === code);
}
