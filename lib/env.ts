import { z } from "zod";

const optionalString = z.string().optional().default("");

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  ADMIN_EMAIL: z.string().default("admin@jewelry.local"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMeAdmin123!"),
  ADMIN_NAME: z.string().default("Studio Admin"),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Maison Atelier"),
  CURRENCY: z.string().default("USD"),
  TAX_RATE: z.coerce.number().min(0).max(1).default(0.08),
  UPLOAD_DIR: z.string().default("public/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
  EMAIL_PROVIDER: optionalString,
  EMAIL_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  OWNER_EMAIL: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalString,
  EMAIL_TO_ADMIN: optionalString,
  WHATSAPP_API_URL: optionalString,
  WHATSAPP_API_TOKEN: optionalString,
  WHATSAPP_FROM: optionalString,
  AI_PROVIDER: optionalString,
  AI_API_KEY: optionalString,
  AI_MODEL: optionalString,
  AI3D_PROVIDER: optionalString,
  AI3D_API_URL: optionalString,
  AI3D_TIMEOUT: z.coerce.number().optional().default(300_000),
  AI3D_MOCK_DELAY_MS: z.coerce.number().optional().default(2500),
  IMAGE_PROVIDER: optionalString,
  IMAGE_PROVIDER_URL: optionalString,
  FREEPIK_API_KEY: optionalString,
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }

  cached = parsed.data;
  return cached;
}

export function isEmailConfigured(): boolean {
  const env = getEnv();
  if (env.EMAIL_API_KEY && env.EMAIL_FROM) return true;
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export function isWhatsAppConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.WHATSAPP_API_URL && env.WHATSAPP_API_TOKEN);
}
