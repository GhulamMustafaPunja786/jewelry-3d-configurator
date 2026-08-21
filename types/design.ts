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
  | "NEW"
  | "IN_REVIEW"
  | "QUOTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

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
