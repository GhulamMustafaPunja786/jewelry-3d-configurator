"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JewelryGenerationRequest } from "@/lib/ai/types";
import type { GenerationJobStatus } from "@/lib/ai/types";
import type { CustomerInfo } from "@/types/design";
import type { PricingBreakdown } from "@/types/pricing";

export type GeneratorStep =
  | "request"
  | "generating"
  | "review"
  | "quotation"
  | "submitted";

export type GeneratorVersion = {
  id: string;
  versionNumber: number;
  modelUrl: string | null;
  previewUrl: string | null;
  prompt: string;
  selected: boolean;
};

export type GeneratorState = {
  request: JewelryGenerationRequest;
  draftDesignId: string | null;
  internalDesignCuid: string | null;
  currentJobId: string | null;
  jobStatus: GenerationJobStatus | null;
  progressMessage: string | null;
  versions: GeneratorVersion[];
  selectedVersionId: string | null;
  pricing: PricingBreakdown | null;
  customer: CustomerInfo;
  step: GeneratorStep;
  emailWarning: boolean;
  setRequest: (partial: Partial<JewelryGenerationRequest>) => void;
  setJob: (payload: {
    jobId: string;
    status: GenerationJobStatus;
    progressMessage?: string | null;
    draftDesignId?: string | null;
    internalDesignCuid?: string | null;
  }) => void;
  setVersions: (versions: GeneratorVersion[]) => void;
  selectVersion: (versionId: string) => void;
  setPricing: (pricing: PricingBreakdown | null) => void;
  setCustomer: (customer: CustomerInfo) => void;
  setStep: (step: GeneratorStep) => void;
  setSubmitted: (designId: string, emailWarning: boolean) => void;
  reset: () => void;
  backToForm: () => void;
};

const defaultRequest: JewelryGenerationRequest = {
  jewelryType: "ring",
  description: "",
  style: "classic",
  metal: "yellow_gold",
  stone: "diamond",
  budget: "unspecified",
  additionalRequirements: "",
  referenceImageUrl: null,
};

const defaultCustomer: CustomerInfo = {
  name: "",
  email: "",
  phone: "",
  country: "",
  message: "",
};

export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set, get) => ({
      request: { ...defaultRequest },
      draftDesignId: null,
      internalDesignCuid: null,
      currentJobId: null,
      jobStatus: null,
      progressMessage: null,
      versions: [],
      selectedVersionId: null,
      pricing: null,
      customer: { ...defaultCustomer },
      step: "request",
      emailWarning: false,

      setRequest: (partial) =>
        set({
          request: { ...get().request, ...partial },
        }),

      setJob: ({
        jobId,
        status,
        progressMessage,
        draftDesignId,
        internalDesignCuid,
      }) =>
        set({
          currentJobId: jobId,
          jobStatus: status,
          progressMessage: progressMessage ?? get().progressMessage,
          draftDesignId:
            draftDesignId !== undefined ? draftDesignId : get().draftDesignId,
          internalDesignCuid:
            internalDesignCuid !== undefined
              ? internalDesignCuid
              : get().internalDesignCuid,
        }),

      setVersions: (versions) =>
        set({
          versions,
          selectedVersionId:
            versions.find((v) => v.selected)?.id ??
            versions[versions.length - 1]?.id ??
            null,
        }),

      selectVersion: (versionId) =>
        set({
          selectedVersionId: versionId,
          versions: get().versions.map((v) => ({
            ...v,
            selected: v.id === versionId,
          })),
        }),

      setPricing: (pricing) => set({ pricing }),

      setCustomer: (customer) => set({ customer }),

      setStep: (step) => set({ step }),

      setSubmitted: (designId, emailWarning) =>
        set({
          draftDesignId: designId,
          emailWarning,
          step: "submitted",
        }),

      reset: () =>
        set({
          request: { ...defaultRequest },
          draftDesignId: null,
          internalDesignCuid: null,
          currentJobId: null,
          jobStatus: null,
          progressMessage: null,
          versions: [],
          selectedVersionId: null,
          pricing: null,
          customer: { ...defaultCustomer },
          step: "request",
          emailWarning: false,
        }),

      backToForm: () =>
        set({
          step: "request",
          currentJobId: null,
          jobStatus: null,
          progressMessage: null,
        }),
    }),
    {
      name: "jewelry-ai-generator",
      partialize: (state) => ({
        request: state.request,
        draftDesignId: state.draftDesignId,
        internalDesignCuid: state.internalDesignCuid,
        // Do not persist in-flight jobs — avoids stale "Unknown job id" loops
        versions: state.versions,
        selectedVersionId: state.selectedVersionId,
        pricing: state.pricing,
        customer: state.customer,
        step:
          state.step === "generating"
            ? state.versions.length
              ? "review"
              : "request"
            : state.step,
        emailWarning: state.emailWarning,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.step === "generating") {
          state.step = state.versions.length ? "review" : "request";
          state.currentJobId = null;
          state.jobStatus = null;
          state.progressMessage = null;
        }
        // Recover stuck review with no versions
        if (state.step === "review" && state.versions.length === 0) {
          state.step = "request";
        }
      },
    },
  ),
);
