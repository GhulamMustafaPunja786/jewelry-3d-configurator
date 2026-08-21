export type PricingLine = {
  key: string;
  label: string;
  amount: number;
  meta?: Record<string, string | number | boolean | null>;
};

export type PricingBreakdown = {
  currency: string;
  metalCost: number;
  stoneCost: number;
  laborCost: number;
  makingCharge: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  lines: PricingLine[];
};

export type PricingInput = {
  metalPricePerGram: number;
  metalWeightGrams: number;
  stonePricePerCarat: number;
  stoneCarats: number;
  laborFixed?: number;
  makingChargePercent?: number;
  taxRate?: number;
  currency?: string;
  extras?: PricingLine[];
};
