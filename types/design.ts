import type { RingConfig } from "./jewelry";
import type { PricingBreakdown } from "./pricing";

export type CustomerInfo = {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  message?: string;
};

export type DesignStatus =
  | "DRAFT"
  | "NEW"
  | "IN_REVIEW"
  | "UNDER_REVIEW"
  | "QUOTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

/** Friendly labels for admin / customer surfaces */
export const DESIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "DRAFT",
  NEW: "NEW",
  IN_REVIEW: "UNDER REVIEW",
  UNDER_REVIEW: "UNDER REVIEW",
  QUOTED: "QUOTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
};

export function formatDesignStatus(status: string): string {
  return DESIGN_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export type DesignSubmissionPayload = {
  config: RingConfig;
  customer: CustomerInfo;
  pricing: PricingBreakdown;
  previewDataUrl?: string;
  notes?: string;
};

export type DesignRecord = {
  id: string;
  designId: string;
  status: DesignStatus;
  jewelryType: string;
  config: RingConfig;
  pricing: PricingBreakdown;
  customer: CustomerInfo;
  previewPath: string | null;
  pdfPath: string | null;
  emailWarning: boolean;
  createdAt: string;
};

export type QuotationViewModel = {
  designId?: string;
  category: string;
  config: RingConfig;
  pricing: PricingBreakdown;
  customer?: Partial<CustomerInfo>;
  terms: string[];
  validDays: number;
};
