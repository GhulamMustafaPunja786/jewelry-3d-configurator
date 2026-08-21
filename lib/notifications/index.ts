import { isWhatsAppConfigured, getEnv } from "@/lib/env";

export type WhatsAppResult = {
  sent: boolean;
  warning?: string;
};

export async function sendWhatsAppStub(message: string): Promise<WhatsAppResult> {
  if (!isWhatsAppConfigured()) {
    return {
      sent: false,
      warning: "WhatsApp not configured — skipped.",
    };
  }

  const env = getEnv();
  console.info("[whatsapp] stub send", {
    to: env.WHATSAPP_FROM,
    message: message.slice(0, 120),
  });

  return {
    sent: false,
    warning: "WhatsApp adapter is a stub — message logged only.",
  };
}
