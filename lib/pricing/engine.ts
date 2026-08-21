import { getMetalByCode } from "@/data/metals";
import { getModelBySlug } from "@/data/models";
import { getStoneByCode } from "@/data/stones";
import { roundMoney } from "@/lib/utils";
import type { RingConfig } from "@/types/jewelry";
import type { PricingBreakdown, PricingInput, PricingLine } from "@/types/pricing";

const DEFAULT_LABOR = 185;
const DEFAULT_MAKING_PERCENT = 0.12;
const DEFAULT_TAX_RATE = 0.08;

/** Approximate band metal weight from size + width + density factor. */
export function estimateRingMetalWeightGrams(
  ringSize: number,
  bandWidthMm: number,
  baseWeightGrams: number,
  density: number,
): number {
  const sizeFactor = 1 + (ringSize - 7) * 0.035;
  const widthFactor = bandWidthMm / 2.2;
  const densityFactor = density / 15.6;
  return roundMoney(baseWeightGrams * sizeFactor * widthFactor * densityFactor);
}

export function calculatePricing(input: PricingInput): PricingBreakdown {
  const currency = input.currency ?? "USD";
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const laborCost = input.laborFixed ?? DEFAULT_LABOR;
  const makingPercent = input.makingChargePercent ?? DEFAULT_MAKING_PERCENT;

  const metalCost = roundMoney(input.metalPricePerGram * input.metalWeightGrams);
  const stoneCost = roundMoney(input.stonePricePerCarat * input.stoneCarats);
  const makingCharge = roundMoney((metalCost + stoneCost) * makingPercent);

  const lines: PricingLine[] = [
    {
      key: "metal",
      label: "Metal",
      amount: metalCost,
      meta: {
        grams: input.metalWeightGrams,
        pricePerGram: input.metalPricePerGram,
      },
    },
    {
      key: "stone",
      label: "Center stone",
      amount: stoneCost,
      meta: {
        carats: input.stoneCarats,
        pricePerCarat: input.stonePricePerCarat,
      },
    },
    {
      key: "labor",
      label: "Craftsmanship & setting",
      amount: laborCost,
    },
    {
      key: "making",
      label: "Making charge",
      amount: makingCharge,
      meta: { percent: makingPercent },
    },
    ...(input.extras ?? []),
  ];

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
  const tax = roundMoney(subtotal * taxRate);
  const total = roundMoney(subtotal + tax);

  return {
    currency,
    metalCost,
    stoneCost,
    laborCost,
    makingCharge,
    subtotal,
    taxRate,
    tax,
    total,
    lines,
  };
}

export function priceRingConfig(
  config: RingConfig,
  options?: {
    laborFixed?: number;
    makingChargePercent?: number;
    taxRate?: number;
    currency?: string;
  },
): PricingBreakdown {
  const metal = getMetalByCode(config.metalCode);
  const stone = getStoneByCode(config.stoneCode);
  const model = getModelBySlug(config.modelSlug);

  if (!metal || !stone || !model) {
    console.warn("[pricing] falling back to defaults", {
      metalCode: config.metalCode,
      stoneCode: config.stoneCode,
      modelSlug: config.modelSlug,
    });
  }

  const resolvedMetal = metal ?? {
    pricePerGram: 65,
    density: 15.6,
  };
  const resolvedStone = stone ?? { pricePerCarat: 4200 };
  const resolvedModel = model ?? { baseWeightGrams: 4.2 };

  const metalWeightGrams = estimateRingMetalWeightGrams(
    config.ringSize,
    config.bandWidthMm,
    resolvedModel.baseWeightGrams,
    resolvedMetal.density,
  );

  const extras: PricingLine[] = [];
  if (config.engraving?.trim()) {
    extras.push({ key: "engraving", label: "Engraving", amount: 45 });
  }
  if (config.finish !== "polished") {
    extras.push({
      key: "finish",
      label: `${config.finish} finish`,
      amount: 35,
    });
  }

  return calculatePricing({
    metalPricePerGram: resolvedMetal.pricePerGram,
    metalWeightGrams,
    stonePricePerCarat: resolvedStone.pricePerCarat,
    stoneCarats: config.stoneCarats,
    laborFixed: options?.laborFixed,
    makingChargePercent: options?.makingChargePercent,
    taxRate: options?.taxRate ?? Number(process.env.TAX_RATE || DEFAULT_TAX_RATE),
    currency: options?.currency ?? (process.env.CURRENCY?.trim() || "USD"),
    extras,
  });
}
