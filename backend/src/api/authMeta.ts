import { Router } from "express";
import { config } from "../config/env";
import { prisma } from "../db/client";
import { encrypt } from "../utils/crypto";

const router = Router();
const GRAPH_VERSION = "v19.0";

router.get("/", (req, res) => {
  const { tenantId } = req.query;

  if (!tenantId || typeof tenantId !== "string") {
    return res.status(400).json({
      error: { message: "tenantId is required" },
    });
  }

  const state = Buffer.from(JSON.stringify({ tenantId })).toString("base64");
  const redirectUri = `${config.shopify.appUrl}/api/auth/meta/callback`;

  const authUrl = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  authUrl.searchParams.set("client_id", config.meta.appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "ads_management,ads_read,business_management");
  authUrl.searchParams.set("state", state);

  return res.redirect(authUrl.toString());
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== "string" || typeof state !== "string") {
    return res.status(400).json({
      error: { message: "Missing code or state" },
    });
  }

  let tenantId: string;

  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    tenantId = decoded.tenantId;
  } catch (error) {
    console.error("[Meta OAuth] Failed to parse state", error);
    return res.status(400).json({ error: { message: "Invalid state parameter" } });
  }

  if (!tenantId) {
    return res.status(400).json({ error: { message: "Missing tenantId in state" } });
  }

  const redirectUri = `${config.shopify.appUrl}/api/auth/meta/callback`;

  try {
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    const longLivedToken = await exchangeForLongLivedToken(tokenData.access_token);
    const accounts = await fetchMetaAdAccounts(longLivedToken);

    if (accounts.length === 0) {
      return res.redirect(`${config.shopify.appUrl}/settings?meta=no_accounts`);
    }

    const primaryAccount = accounts[0];

    await prisma.adAccount.upsert({
      where: {
        tenantId_provider_externalId: {
          tenantId,
          provider: "meta",
          externalId: primaryAccount.id,
        },
      },
      create: {
        tenantId,
        provider: "meta",
        externalId: primaryAccount.id,
        name: primaryAccount.name,
        accessToken: encrypt(longLivedToken),
        isDefault: true,
        status: "active",
      },
      update: {
        name: primaryAccount.name,
        accessToken: encrypt(longLivedToken),
        updatedAt: new Date(),
      },
    });

    return res.redirect(`${config.shopify.appUrl}/settings?meta=connected`);
  } catch (error) {
    console.error("[Meta OAuth] Callback error", error);
    return res.status(500).json({
      error: { message: "Meta authorization failed" },
    });
  }
});

async function exchangeCodeForToken(code: string, redirectUri: string) {
  const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", config.meta.appId);
  tokenUrl.searchParams.set("client_secret", config.meta.appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const response = await fetch(tokenUrl.toString());
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to fetch Meta token: ${JSON.stringify(data)}`);
  }

  return data as { access_token: string };
}

async function exchangeForLongLivedToken(shortLivedToken: string) {
  const longLivedUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", config.meta.appId);
  longLivedUrl.searchParams.set("client_secret", config.meta.appSecret);
  longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

  const response = await fetch(longLivedUrl.toString());
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to fetch long-lived token: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

async function fetchMetaAdAccounts(accessToken: string) {
  const accountsUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/adaccounts`);
  accountsUrl.searchParams.set("fields", "id,name");
  accountsUrl.searchParams.set("access_token", accessToken);

  const response = await fetch(accountsUrl.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to fetch Meta ad accounts: ${JSON.stringify(data)}`);
  }

  return (data.data || []) as { id: string; name: string }[];
}

export default router;

