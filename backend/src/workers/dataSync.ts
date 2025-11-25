import { prisma } from "../db/client";
import { ShopifyService } from "../services/ShopifyService";
import { MetaAdsService } from "../services/MetaAdsService";
import { decrypt } from "../utils/crypto";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type TenantAdAccount = {
  id: string;
  externalId: string;
  provider: string;
  accessToken: string | null;
};

export async function syncTenantData(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { adAccounts: true },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  const now = new Date();
  const start = new Date(now.getTime() - ONE_DAY_MS);

  if (tenant.shopifyAccessToken) {
    await syncShopifyMetrics(tenant.shopifyDomain, tenant.shopifyAccessToken, tenantId, start, now);
  }

  const metaAccounts = tenant.adAccounts.filter(
    (account: TenantAdAccount) => account.provider === "meta"
  );

  for (const account of metaAccounts) {
    if (!account.accessToken) {
      continue;
    }

    await syncMetaAccount(account.externalId, account.id, tenantId, account.accessToken, start);
  }
}

async function syncShopifyMetrics(
  shopifyDomain: string,
  encryptedToken: string,
  tenantId: string,
  start: Date,
  end: Date
) {
  const service = new ShopifyService();
  service.init(shopifyDomain, decrypt(encryptedToken));

  const orders = await service.getOrders(start.toISOString(), end.toISOString());
  const metrics = service.calculateRevenueMetrics(orders);

  await prisma.metricsDaily.upsert({
    where: {
      tenantId_date_dimensionType_dimensionId: {
        tenantId,
        date: start,
        dimensionType: "account",
        dimensionId: tenantId,
      },
    },
    update: {
      revenue: metrics.totalRevenue,
      orders: metrics.orderCount,
      customers: metrics.uniqueCustomers,
    },
    create: {
      tenantId,
      date: start,
      dimensionType: "account",
      dimensionId: tenantId,
      revenue: metrics.totalRevenue,
      orders: metrics.orderCount,
      customers: metrics.uniqueCustomers,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    },
  });
}

async function syncMetaAccount(
  externalAccountId: string,
  adAccountId: string,
  tenantId: string,
  encryptedToken: string,
  date: Date
) {
  const meta = new MetaAdsService();
  meta.init(decrypt(encryptedToken), externalAccountId);

  const insights = await meta.getAccountInsights("yesterday");

  await prisma.metricsDaily.upsert({
    where: {
      tenantId_date_dimensionType_dimensionId: {
        tenantId,
        date,
        dimensionType: "adaccount",
        dimensionId: adAccountId,
      },
    },
    update: {
      spend: insights.spend,
      impressions: insights.impressions,
      clicks: insights.clicks,
      conversions: insights.conversions,
      revenue: insights.conversionValue,
    },
    create: {
      tenantId,
      date,
      dimensionType: "adaccount",
      dimensionId: adAccountId,
      spend: insights.spend,
      revenue: insights.conversionValue,
      impressions: insights.impressions,
      clicks: insights.clicks,
      conversions: insights.conversions,
      orders: 0,
      customers: 0,
    },
  });

  const campaigns = await meta.getCampaigns();

  for (const campaign of campaigns) {
    await prisma.campaign.upsert({
      where: {
        adAccountId_externalId: {
          adAccountId,
          externalId: campaign.id,
        },
      },
      update: {
        name: campaign.name,
        status: campaign.status.toLowerCase(),
        objective: campaign.objective,
      },
      create: {
        tenantId,
        adAccountId,
        externalId: campaign.id,
        name: campaign.name,
        status: campaign.status.toLowerCase(),
        objective: campaign.objective,
      },
    });
  }
}

export async function runDataSyncForAllTenants() {
  const tenants = await prisma.tenant.findMany({
    where: { shopifyAccessToken: { not: null } },
  });

  for (const tenant of tenants) {
    try {
      await syncTenantData(tenant.id);
      console.log(`[DataSync] Synced tenant ${tenant.name}`);
    } catch (error) {
      console.error(`[DataSync] Failed to sync tenant ${tenant.id}`, error);
    }
  }
}

