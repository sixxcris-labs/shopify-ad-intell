import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4311"),
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be 32-byte hex string")
    .optional(),
  
  // Shopify
  SHOPIFY_API_KEY: z.string().default(""),
  SHOPIFY_API_SECRET: z.string().default(""),
  SHOPIFY_SCOPES: z.string().default("read_products,read_orders,read_customers"),
  SHOPIFY_APP_URL: z.string().default("http://localhost:4310"),
  
  // Meta/Facebook
  META_APP_ID: z.string().default(""),
  META_APP_SECRET: z.string().default(""),
  
  // Database
  DATABASE_URL: z.string().default("postgresql://localhost:5544/ad_intelligence"),
  REDIS_URL: z.string().default("redis://localhost:6385"),
  
  // LLM
  OPENAI_API_KEY: z.string().default(""),
  ANTHROPIC_API_KEY: z.string().default(""),
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  
  // Notifications
  SLACK_WEBHOOK_URL: z.string().default(""),
  DISCORD_WEBHOOK_URL: z.string().default(""),
  SENDGRID_API_KEY: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4311", 10),
  
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    apiSecret: process.env.SHOPIFY_API_SECRET || "",
    scopes: process.env.SHOPIFY_SCOPES || "read_products,read_orders,read_customers",
    appUrl: process.env.SHOPIFY_APP_URL || "http://localhost:4310",
  },
  
  meta: {
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
  },
  
  database: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5544/ad_intelligence",
  },
  
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6385",
  },
  
  llm: {
    provider: process.env.LLM_PROVIDER || "openai",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  },
  
  notifications: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
    sendgridApiKey: process.env.SENDGRID_API_KEY || "",
  },

  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || "",
  },
};
