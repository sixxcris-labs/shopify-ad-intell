import { config } from "../config/env";

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
}

export interface MetaAdSet {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  targeting?: object;
  dailyBudget?: number;
}

export interface MetaAd {
  id: string;
  adSetId: string;
  name: string;
  status: string;
  creativeId?: string;
}

export interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversions: number;
  conversionValue: number;
  roas: number;
}

export class MetaAdsService {
  private accessToken: string = "";
  private adAccountId: string = "";
  private baseUrl = "https://graph.facebook.com/v19.0";

  /**
   * Initialize with access token and ad account
   */
  init(accessToken: string, adAccountId: string): void {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId.startsWith("act_")
      ? adAccountId
      : `act_${adAccountId}`;
  }

  /**
   * Make authenticated request to Meta API
   */
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: object
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("MetaAdsService not initialized - call init() first");
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Meta API error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get campaigns for ad account
   */
  async getCampaigns(): Promise<MetaCampaign[]> {
    const data = await this.request<{ data: any[] }>(
      `/${this.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget`
    );

    return data.data.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      dailyBudget: campaign.daily_budget
        ? parseInt(campaign.daily_budget) / 100
        : undefined,
      lifetimeBudget: campaign.lifetime_budget
        ? parseInt(campaign.lifetime_budget) / 100
        : undefined,
    }));
  }

  /**
   * Get ad sets for campaign
   */
  async getAdSets(campaignId?: string): Promise<MetaAdSet[]> {
    const endpoint = campaignId
      ? `/${campaignId}/adsets`
      : `/${this.adAccountId}/adsets`;

    const data = await this.request<{ data: any[] }>(
      `${endpoint}?fields=id,campaign_id,name,status,targeting,daily_budget`
    );

    return data.data.map((adSet) => ({
      id: adSet.id,
      campaignId: adSet.campaign_id,
      name: adSet.name,
      status: adSet.status,
      targeting: adSet.targeting,
      dailyBudget: adSet.daily_budget
        ? parseInt(adSet.daily_budget) / 100
        : undefined,
    }));
  }

  /**
   * Get ads for ad set
   */
  async getAds(adSetId?: string): Promise<MetaAd[]> {
    const endpoint = adSetId
      ? `/${adSetId}/ads`
      : `/${this.adAccountId}/ads`;

    const data = await this.request<{ data: any[] }>(
      `${endpoint}?fields=id,adset_id,name,status,creative`
    );

    return data.data.map((ad) => ({
      id: ad.id,
      adSetId: ad.adset_id,
      name: ad.name,
      status: ad.status,
      creativeId: ad.creative?.id,
    }));
  }

  /**
   * Get insights for entity
   */
  async getInsights(
    entityId: string,
    datePreset: string = "last_30d"
  ): Promise<MetaInsights> {
    const data = await this.request<{ data: any[] }>(
      `/${entityId}/insights?fields=spend,impressions,clicks,reach,frequency,cpm,cpc,ctr,actions,action_values&date_preset=${datePreset}`
    );

    const insight = data.data[0] || {};
    const conversions =
      insight.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
    const conversionValue =
      insight.action_values?.find((a: any) => a.action_type === "purchase")
        ?.value || 0;

    return {
      spend: parseFloat(insight.spend || 0),
      impressions: parseInt(insight.impressions || 0),
      clicks: parseInt(insight.clicks || 0),
      reach: parseInt(insight.reach || 0),
      frequency: parseFloat(insight.frequency || 0),
      cpm: parseFloat(insight.cpm || 0),
      cpc: parseFloat(insight.cpc || 0),
      ctr: parseFloat(insight.ctr || 0),
      conversions: parseInt(conversions),
      conversionValue: parseFloat(conversionValue),
      roas:
        parseFloat(insight.spend || 0) > 0
          ? parseFloat(conversionValue) / parseFloat(insight.spend)
          : 0,
    };
  }

  /**
   * Get account-level insights
   */
  async getAccountInsights(datePreset: string = "last_30d"): Promise<MetaInsights> {
    return this.getInsights(this.adAccountId, datePreset);
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED"
  ): Promise<void> {
    await this.request(`/${campaignId}`, "POST", { status });
  }

  /**
   * Update ad set budget
   */
  async updateAdSetBudget(adSetId: string, dailyBudget: number): Promise<void> {
    await this.request(`/${adSetId}`, "POST", {
      daily_budget: Math.round(dailyBudget * 100), // Convert to cents
    });
  }

  /**
   * Get Ad Library ads for competitor research
   */
  async searchAdLibrary(
    pageId: string,
    searchTerms?: string
  ): Promise<
    {
      id: string;
      pageId: string;
      pageName: string;
      bodyText?: string;
      linkUrl?: string;
    }[]
  > {
    // Ad Library API requires special access
    // This is a placeholder for when access is granted
    console.warn("Ad Library API requires special Meta approval");
    return [];
  }
}
