import { config } from "../config/env";

type NotificationChannel = "email" | "slack" | "discord";

export interface NotificationPayload {
  title: string;
  message: string;
  channels: NotificationChannel[];
  severity?: "low" | "medium" | "high" | "critical";
}

export class NotificationService {
  async send(tenantId: string, payload: NotificationPayload): Promise<void> {
    const deliveries: Promise<void>[] = [];

    for (const channel of payload.channels) {
      switch (channel) {
        case "email":
          deliveries.push(this.sendEmail(tenantId, payload));
          break;
        case "slack":
          deliveries.push(this.sendSlack(payload));
          break;
        case "discord":
          deliveries.push(this.sendDiscord(payload));
          break;
      }
    }

    await Promise.allSettled(deliveries);
  }

  private async sendEmail(tenantId: string, payload: NotificationPayload): Promise<void> {
    if (!config.notifications.sendgridApiKey) return;

    // TODO: read actual recipient list from tenant settings
    const defaultEmail = `${tenantId}@example.com`;

    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.notifications.sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: defaultEmail }] }],
        from: { email: "alerts@shopify-ad-intelligence.com" },
        subject: payload.title,
        content: [{ type: "text/plain", value: payload.message }],
      }),
    }).catch((error) => {
      console.warn("SendGrid notification failed", error);
    });
  }

  private async sendSlack(payload: NotificationPayload): Promise<void> {
    if (!config.notifications.slackWebhookUrl) return;

    const color = {
      low: "#36a64f",
      medium: "#ffcc00",
      high: "#ff6600",
      critical: "#ff0000",
    }[payload.severity || "medium"];

    await fetch(config.notifications.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: payload.title,
            text: payload.message,
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    }).catch((error) => {
      console.warn("Slack notification failed", error);
    });
  }

  private async sendDiscord(payload: NotificationPayload): Promise<void> {
    if (!config.notifications.discordWebhookUrl) return;

    await fetch(config.notifications.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: payload.title,
            description: payload.message,
            color: this.getDiscordColor(payload.severity),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }).catch((error) => {
      console.warn("Discord notification failed", error);
    });
  }

  private getDiscordColor(severity: NotificationPayload["severity"]): number {
    switch (severity) {
      case "low":
        return 0x2ecc71;
      case "high":
        return 0xe67e22;
      case "critical":
        return 0xe74c3c;
      default:
        return 0x5865f2;
    }
  }
}

