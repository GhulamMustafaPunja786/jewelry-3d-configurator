import type { StoneOption } from "@/types/jewelry";

export const STONES: StoneOption[] = [
  {
    code: "DIA-RD-FG-VS",
    name: "Diamond Round",
    type: "diamond",
    shape: "round",
    colorHex: "#F5F7FF",
    transmission: 0.95,
    ior: 2.42,
    pricePerCarat: 4800,
  },
  {
    code: "DIA-OV-GH-SI1",
    name: "Diamond Oval",
    type: "diamond",
    shape: "oval",
    colorHex: "#EEF2FF",
    transmission: 0.94,
    ior: 2.42,
    pricePerCarat: 3600,
  },
  {
    code: "SAP-BL-OV",
    name: "Blue Sapphire",
    type: "sapphire",
    shape: "oval",
    colorHex: "#1E3A8A",
    transmission: 0.75,
    ior: 1.77,
    pricePerCarat: 1200,
  },
  {
    code: "EM-GR-CU",
    name: "Emerald Cushion",
    type: "emerald",
    shape: "cushion",
    colorHex: "#047857",
    transmission: 0.7,
    ior: 1.58,
    pricePerCarat: 1800,
  },
  {
    code: "RB-RD-VS",
    name: "Ruby Round",
    type: "ruby",
    shape: "round",
    colorHex: "#9F1239",
    transmission: 0.72,
    ior: 1.77,
    pricePerCarat: 2200,
  },
  {
    code: "MOIS-RD",
    name: "Moissanite Round",
    type: "moissanite",
    shape: "round",
    colorHex: "#F8FAFF",
    transmission: 0.96,
    ior: 2.65,
    pricePerCarat: 450,
  },
];

export function getStoneByCode(code: string): StoneOption | undefined {
  return STONES.find((s) => s.code === code);
}
