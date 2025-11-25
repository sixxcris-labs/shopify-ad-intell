import type { TrackingHealth, TrackingIssue } from "@shopify-ad-intelligence/common";

export interface PixelEvent {
  eventName: string;
  timestamp: string;
  source: "pixel" | "capi";
  deduped: boolean;
}

export class TrackingService {
  /**
   * Get current tracking health status
   */
  async getTrackingHealth(tenantId: string): Promise<TrackingHealth> {
    // TODO: Implement actual tracking health check via Meta API
    // This is a stub that returns mock data
    
    return {
      pixelStatus: "healthy",
      capiStatus: "healthy",
      eventMatchQuality: 8.5,
      dedupRate: 92,
      lastChecked: new Date().toISOString(),
      issues: [],
    };
  }

  /**
   * Diagnose tracking issues
   */
  async diagnoseIssues(tenantId: string): Promise<TrackingIssue[]> {
    const health = await this.getTrackingHealth(tenantId);
    const issues: TrackingIssue[] = [];

    // Check Pixel status
    if (health.pixelStatus !== "healthy") {
      issues.push({
        type: "pixel_degraded",
        severity: health.pixelStatus === "failing" ? "high" : "medium",
        message: `Pixel is ${health.pixelStatus}`,
        recommendation: "Check Pixel installation and verify events are firing",
      });
    }

    // Check CAPI status
    if (health.capiStatus === "not_configured") {
      issues.push({
        type: "capi_missing",
        severity: "medium",
        message: "Conversions API is not configured",
        recommendation: "Set up CAPI for improved tracking accuracy and iOS 14+ attribution",
      });
    } else if (health.capiStatus !== "healthy") {
      issues.push({
        type: "capi_degraded",
        severity: health.capiStatus === "failing" ? "high" : "medium",
        message: `CAPI is ${health.capiStatus}`,
        recommendation: "Check server-side event configuration",
      });
    }

    // Check Event Match Quality
    if (health.eventMatchQuality < 6) {
      issues.push({
        type: "low_emq",
        severity: "high",
        message: `Event Match Quality is ${health.eventMatchQuality}/10`,
        recommendation: "Improve customer data parameters (email, phone) in events",
      });
    } else if (health.eventMatchQuality < 8) {
      issues.push({
        type: "medium_emq",
        severity: "low",
        message: `Event Match Quality is ${health.eventMatchQuality}/10, could be improved`,
        recommendation: "Consider adding more customer data parameters",
      });
    }

    // Check Dedup rate
    if (health.dedupRate < 80) {
      issues.push({
        type: "low_dedup",
        severity: "medium",
        message: `Deduplication rate is ${health.dedupRate}%`,
        recommendation: "Ensure event_id is consistent between Pixel and CAPI events",
      });
    }

    return issues;
  }

  /**
   * Verify event firing
   */
  async verifyEvents(
    tenantId: string,
    eventNames: string[] = ["Purchase", "AddToCart", "ViewContent"]
  ): Promise<Record<string, { pixel: boolean; capi: boolean; lastSeen?: string }>> {
    // TODO: Implement actual verification via Meta API
    // This is a stub
    
    const result: Record<string, { pixel: boolean; capi: boolean; lastSeen?: string }> = {};
    
    for (const event of eventNames) {
      result[event] = {
        pixel: true,
        capi: true,
        lastSeen: new Date().toISOString(),
      };
    }
    
    return result;
  }

  /**
   * Get recommendations to improve tracking
   */
  getTrackingRecommendations(health: TrackingHealth): string[] {
    const recommendations: string[] = [];

    if (health.capiStatus === "not_configured") {
      recommendations.push(
        "Set up Conversions API (CAPI) for server-side event tracking. This improves attribution accuracy, especially for iOS 14+ users."
      );
    }

    if (health.eventMatchQuality < 8) {
      recommendations.push(
        "Improve Event Match Quality by ensuring customer email and phone are hashed and sent with events."
      );
    }

    if (health.dedupRate < 90) {
      recommendations.push(
        "Improve event deduplication by using consistent event_id values between browser and server events."
      );
    }

    if (health.pixelStatus !== "healthy") {
      recommendations.push(
        "Review Pixel installation. Use Meta Pixel Helper browser extension to diagnose issues."
      );
    }

    return recommendations;
  }
}
