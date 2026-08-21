import { roundMoney } from "@/lib/utils";
import type { JewelryGenerationRequest } from "@/lib/ai/types";
import type { PricingBreakdown, PricingLine } from "@/types/pricing";

const TYPE_BASE: Record<string, number> = {
  ring: 450,
  necklace: 650,
  chain: 380,
  pendant: 420,
  bracelet: 520,
  earrings: 400,
};

const METAL_ADD: Record<string, number> = {
  yellow_gold: 320,
  white_gold: 340,
  rose_gold: 330,
  platinum: 520,
  silver: 80,
  any: 250,
};

const STONE_ADD: Record<string, number> = {
  diamond: 900,
  ruby: 550,
  sapphire: 500,
  emerald: 580,
  any: 400,
};

const STYLE_COMPLEXITY: Record<string, number> = {
  classic: 80,
  luxury: 220,
  minimal: 40,
  modern: 100,
  vintage: 160,
  royal: 280,
  custom: 150,
};

const BUDGET_HINT: Record<string, number> = {
  under_500: 0.7,
  "500_1000": 0.9,
  "1000_2500": 1,
  "2500_5000": 1.25,
  "5000_plus": 1.55,
  unspecified: 1,
};

/**
 * Estimation-only pricing for AI jewelry requests.
 * Not manufacturing CAD cost — clearly labeled as estimated.
 */
export function estimateAiJewelryPrice(
  request: JewelryGenerationRequest,
  taxRate = Number(process.env.TAX_RATE || 0.08),
  currency = process.env.CURRENCY?.trim() || "USD",
): PricingBreakdown {
  const base = TYPE_BASE[request.jewelryType] ?? 450;
  const metal = METAL_ADD[request.metal ?? "any"] ?? 250;
  const stone = STONE_ADD[request.stone ?? "any"] ?? 400;
  const complexity = STYLE_COMPLEXITY[request.style ?? "classic"] ?? 80;
  const labor = 185;
  const descBoost = Math.min(180, Math.floor(request.description.length / 8));
  const extra = request.additionalRequirements?.trim() ? 60 : 0;

  let subtotal = base + metal + stone + complexity + labor + descBoost + extra;
  const budgetFactor = BUDGET_HINT[request.budget ?? "unspecified"] ?? 1;
  subtotal = roundMoney(subtotal * budgetFactor);
  const tax = roundMoney(subtotal * taxRate);
  const total = roundMoney(subtotal + tax);

  const lines: PricingLine[] = [
    { key: "base", label: `${request.jewelryType} base estimate`, amount: base },
    { key: "metal", label: "Requested metal category", amount: metal },
    { key: "stone", label: "Requested stone category", amount: stone },
    { key: "complexity", label: "Style / complexity", amount: complexity },
    { key: "labor", label: "Estimated atelier labor", amount: labor },
  ];
  if (descBoost) {
    lines.push({
      key: "detail",
      label: "Design detail allowance",
      amount: descBoost,
    });
  }
  if (extra) {
    lines.push({
      key: "extras",
      label: "Additional requirements",
      amount: extra,
    });
  }

  return {
    currency,
    metalCost: metal,
    stoneCost: stone,
    laborCost: labor,
    makingCharge: complexity,
    subtotal,
    taxRate,
    tax,
    total,
    lines,
  };
}
