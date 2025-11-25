import crypto from "crypto";
import { Router } from "express";
import { config } from "../config/env";
import { prisma } from "../db/client";
import { redis } from "../db/redis";
import { encrypt } from "../utils/crypto";

const router = Router();

/**
 * Start Shopify OAuth flow
 * Redirect user to Shopify authorization page
 */
router.get("/", async (req, res) => {
  const { shop } = req.query;

  if (!shop || typeof shop !== "string") {
    return res.status(400).json({
      error: { message: "Missing shop parameter" },
    });
  }

  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).json({
      error: { message: "Invalid shop domain" },
    });
  }

  const redirectUri = `${config.shopify.appUrl}/api/auth/shopify/callback`;
  const scopes = config.shopify.scopes;
  const nonce = generateNonce();

  await storeNonce(shop, nonce);

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${config.shopify.apiKey}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${nonce}`;

  return res.redirect(authUrl);
});

/**
 * OAuth callback - exchange code for access token
 */
router.get("/callback", async (req, res) => {
  const { shop, code, state } = req.query;

  if (
    !shop ||
    !code ||
    !state ||
    typeof shop !== "string" ||
    typeof code !== "string" ||
    typeof state !== "string"
  ) {
    return res.status(400).json({
      error: { message: "Missing required parameters" },
    });
  }

  if (!verifyHmac(req.query, config.shopify.apiSecret)) {
    return res.status(401).json({
      error: { message: "Invalid HMAC signature" },
    });
  }

  const stateValid = await consumeNonce(shop, state);

  if (!stateValid) {
    return res.status(401).json({
      error: { message: "Invalid or expired OAuth state" },
    });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.shopify.apiKey,
          client_secret: config.shopify.apiSecret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const { access_token } = await tokenResponse.json();

    if (!access_token) {
      throw new Error("Missing access token in OAuth response");
    }

    await prisma.tenant.upsert({
      where: { shopifyDomain: shop },
      create: {
        name: shop,
        shopifyDomain: shop,
        shopifyAccessToken: encrypt(access_token),
      },
      update: {
        shopifyAccessToken: encrypt(access_token),
        updatedAt: new Date(),
      },
    });

    await registerWebhooks(shop, access_token);

    // Redirect to app
    return res.redirect(`${config.shopify.appUrl}/?shop=${shop}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return res.status(500).json({
      error: { message: "Authentication failed" },
    });
  }
});

/**
 * Get current session/user info
 */
router.get("/me", (req, res) => {
  // TODO: Implement session validation
  // For now, return mock data
  res.json({
    data: {
      tenantId: "tenant_mock",
      userId: "user_mock",
      shop: "example.myshopify.com",
      email: "merchant@example.com",
      role: "owner",
    },
  });
});

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function verifyHmac(query: any, secret: string): boolean {
  const normalized = normalizeQuery(query);
  const hmac = normalized.hmac;

  if (!secret || !hmac) return false;

  const message = Object.keys(normalized)
    .filter((key) => key !== "hmac" && key !== "signature")
    .sort()
    .map((key) => `${key}=${normalized[key]}`)
    .join("&");

  const computed = crypto.createHmac("sha256", secret).update(message).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed));
  } catch {
    return false;
  }
}

function normalizeQuery(query: any): Record<string, string> {
  return Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value[0];
    } else if (typeof value === "string") {
      acc[key] = value;
    } else {
      acc[key] = String(value);
    }
    return acc;
  }, {});
}

async function registerWebhooks(shop: string, accessToken: string): Promise<void> {
  const baseAddress = config.shopify.appUrl.replace(/\/$/, "");
  const webhookEndpoint = `${baseAddress}/api/webhooks/shopify`;

  const topics = [
    { topic: "orders/create", address: `${webhookEndpoint}/orders-create` },
    { topic: "orders/paid", address: `${webhookEndpoint}/orders-paid` },
    { topic: "app/uninstalled", address: `${webhookEndpoint}/app-uninstalled` },
  ];

  await Promise.allSettled(
    topics.map(async ({ topic, address }) => {
      const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address,
            format: "json",
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.warn(`[Shopify] Failed to register webhook ${topic}: ${body}`);
      }
    })
  );
}

async function storeNonce(shop: string, nonce: string): Promise<void> {
  try {
    await redis.setex(getNonceKey(nonce), 300, shop);
  } catch (error) {
    console.warn("[Shopify OAuth] Failed to store nonce", error);
  }
}

async function consumeNonce(shop: string, nonce: string): Promise<boolean> {
  try {
    const key = getNonceKey(nonce);
    const storedShop = await redis.get(key);

    if (!storedShop || storedShop !== shop) {
      return false;
    }

    await redis.del(key);
    return true;
  } catch (error) {
    console.warn("[Shopify OAuth] Failed to verify nonce", error);
    return false;
  }
}

function getNonceKey(nonce: string): string {
  return `oauth:shopify:${nonce}`;
}

export default router;
