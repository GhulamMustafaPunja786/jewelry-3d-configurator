export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailResult = {
  sent: boolean;
  warning?: string;
  provider?: string;
};

export type EmailAdapter = {
  send: (payload: EmailPayload) => Promise<EmailResult>;
  isConfigured: () => boolean;
};
