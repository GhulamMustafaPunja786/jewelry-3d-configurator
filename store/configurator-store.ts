"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { priceRingConfig } from "@/lib/pricing/engine";
import type { CustomerInfo, QuotationViewModel } from "@/types/design";
import type { JewelryCategory, RingConfig } from "@/types/jewelry";
import type { PricingBreakdown } from "@/types/pricing";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";

export type ConfiguratorStep =
  | "category"
  | "configure"
  | "quotation"
  | "customer"
  | "submitted";

type ConfiguratorState = {
  step: ConfiguratorStep;
  category: JewelryCategory | null;
  config: RingConfig;
  pricing: PricingBreakdown | null;
  customer: CustomerInfo;
  submittedDesignId: string | null;
  emailWarning: boolean;
  setStep: (step: ConfiguratorStep) => void;
  setCategory: (category: JewelryCategory) => void;
  updateConfig: (partial: Partial<RingConfig>) => void;
  recalculatePricing: () => void;
  setCustomer: (customer: CustomerInfo) => void;
  setSubmitted: (designId: string, emailWarning: boolean) => void;
  getQuotationView: () => QuotationViewModel;
  reset: () => void;
};

const defaultConfig: RingConfig = {
  category: "ring",
  modelSlug: "solitaire-classic",
  metalCode: "AU18Y",
  stoneCode: "DIA-RD-FG-VS",
  stoneCarats: 1,
  ringSize: 7,
  bandWidthMm: 2.2,
  engraving: "",
  finish: "polished",
};

const defaultCustomer: CustomerInfo = {
  name: "",
  email: "",
  phone: "",
  country: "",
  message: "",
};

export const useConfiguratorStore = create<ConfiguratorState>()(
  persist(
    (set, get) => ({
      step: "category",
      category: null,
      config: defaultConfig,
      pricing: null,
      customer: defaultCustomer,
      submittedDesignId: null,
      emailWarning: false,

      setStep: (step) => set({ step }),

      setCategory: (category) =>
        set({
          category,
          step: category === "ring" ? "configure" : "category",
          config:
            category === "ring"
              ? { ...defaultConfig }
              : get().config,
        }),

      updateConfig: (partial) => {
        const config = { ...get().config, ...partial, category: "ring" as const };
        const pricing = priceRingConfig(config);
        set({ config, pricing });
      },

      recalculatePricing: () => {
        const pricing = priceRingConfig(get().config);
        set({ pricing });
      },

      setCustomer: (customer) => set({ customer }),

      setSubmitted: (designId, emailWarning) =>
        set({
          submittedDesignId: designId,
          emailWarning,
          step: "submitted",
        }),

      getQuotationView: () => {
        const { config, pricing, customer, category } = get();
        return {
          category: category ?? "ring",
          config,
          pricing: pricing ?? priceRingConfig(config),
          customer,
          terms: QUOTATION_TERMS,
          validDays: QUOTATION_VALID_DAYS,
        };
      },

      reset: () =>
        set({
          step: "category",
          category: null,
          config: defaultConfig,
          pricing: null,
          customer: defaultCustomer,
          submittedDesignId: null,
          emailWarning: false,
        }),
    }),
    {
      name: "jewelry-configurator",
      partialize: (state) => ({
        step: state.step,
        category: state.category,
        config: state.config,
        pricing: state.pricing,
        customer: state.customer,
        submittedDesignId: state.submittedDesignId,
        emailWarning: state.emailWarning,
      }),
    },
  ),
);
