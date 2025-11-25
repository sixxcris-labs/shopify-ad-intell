import { Page, Layout, Card, Text, BlockStack, InlineGrid, Box, Badge, Banner } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

interface KPI {
  label: string;
  value: string;
  change?: number;
  trend?: "up" | "down" | "flat";
}

interface Recommendation {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
}

export default function Overview() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewData, recsData] = await Promise.all([
          api.getOverview(),
          api.getRecommendations(),
        ]);
        setKpis((overviewData as any).kpis || []);
        setRecommendations((recsData as any).recommendations || []);
      } catch (error) {
        console.error("Failed to load overview:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <Page title="Overview">
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 6 }} gap="400">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">{kpi.label}</Text>
                  <Text as="p" variant="headingLg">{kpi.value}</Text>
                  {kpi.change !== undefined && (
                    <Badge tone={kpi.trend === "up" ? "success" : kpi.trend === "down" ? "critical" : undefined}>
                      {kpi.change > 0 ? "+" : ""}{kpi.change}%
                    </Badge>
                  )}
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Today's Actions</Text>
              {recommendations.length === 0 ? (
                <Text as="p" tone="subdued">No actions needed right now</Text>
              ) : (
                recommendations.map((rec) => (
                  <Banner
                    key={rec.id}
                    title={rec.title}
                    tone={rec.priority === "high" ? "critical" : rec.priority === "medium" ? "warning" : "info"}
                  >
                    <p>{rec.description}</p>
                  </Banner>
                ))
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
