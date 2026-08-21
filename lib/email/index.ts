import { isEmailConfigured, getEnv } from "@/lib/env";
import type { EmailAdapter, EmailPayload, EmailResult } from "./types";

const noopAdapter: EmailAdapter = {
  isConfigured: () => false,
  async send(): Promise<EmailResult> {
    return {
      sent: false,
      warning: "Email not configured — design saved without notification.",
    };
  },
};

const smtpLikeAdapter: EmailAdapter = {
  isConfigured: () => isEmailConfigured(),
  async send(payload: EmailPayload): Promise<EmailResult> {
    if (!isEmailConfigured()) {
      return noopAdapter.send(payload);
    }

    // Adapter hook: wire Resend/SendGrid/SMTP here when credentials exist.
    // For MVP we log and report success-with-provider when env is present
    // but do not require a live provider implementation.
    const env = getEnv();
    console.info("[email] queued", {
      to: payload.to,
      subject: payload.subject,
      from: env.EMAIL_FROM || env.SMTP_FROM || env.EMAIL_TO_ADMIN,
      provider: env.EMAIL_PROVIDER || "smtp",
    });

    return {
      sent: true,
      provider: env.EMAIL_PROVIDER || "smtp-stub",
      warning:
        "Email provider credentials present but transport is stubbed in MVP — check logs.",
    };
  },
};

export const emailAdapter: EmailAdapter = smtpLikeAdapter;

export async function sendDesignNotification(options: {
  designId: string;
  customerEmail: string;
  customerName: string;
  totalLabel: string;
}): Promise<EmailResult> {
  const env = getEnv();
  const adminTo = env.EMAIL_TO_ADMIN || env.OWNER_EMAIL;

  if (!isEmailConfigured() || !adminTo) {
    return {
      sent: false,
      warning: "Email not configured — design saved without notification.",
    };
  }

  return emailAdapter.send({
    to: adminTo,
    subject: `New design ${options.designId}`,
    text: `${options.customerName} (${options.customerEmail}) submitted ${options.designId}. Total: ${options.totalLabel}`,
    html: `<p><strong>${options.customerName}</strong> submitted design <strong>${options.designId}</strong>.</p><p>Total: ${options.totalLabel}</p>`,
  });
}

export type { EmailPayload, EmailResult, EmailAdapter };
