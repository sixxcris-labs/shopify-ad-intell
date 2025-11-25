import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Spinner,
  Box,
  Tabs,
  MediaCard,
  EmptyState,
} from "@shopify/polaris";
import type { Competitor, CompetitorAd } from "@shopify-ad-intelligence/common";
import { api } from "@/lib/apiClient";

export default function CreativeIntelligencePage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorAds, setCompetitorAds] = useState<CompetitorAd[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [comps, trendsData] = await Promise.all([
        api.getCompetitors() as Promise<Competitor[]>,
        api.getTrends(),
      ]);
      setCompetitors(comps || []);
      setTrends(trendsData);

      if (comps && comps.length > 0) {
        const ads = await api.getCompetitorAds(comps[0].id) as CompetitorAd[];
        setCompetitorAds(ads || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "competitors", content: "Competitor Ads" },
    { id: "trends", content: "Creative Trends" },
  ];

  if (loading) {
    return (
      <Page title="Creative Intelligence">
        <Box padding="800">
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Creative Intelligence"
      subtitle="Learn from competitor ads and trends"
      primaryAction={{ content: "Add Competitor", onAction: () => {} }}
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        {selectedTab === 0 ? (
          <Layout>
            <Layout.Section>
              {competitorAds.length === 0 ? (
                <Card>
                  <EmptyState
                    heading="No competitor ads yet"
                    action={{ content: "Add Competitor", onAction: () => {} }}
                    image=""
                  >
                    <p>Add competitors to start tracking their ads.</p>
                  </EmptyState>
                </Card>
              ) : (
                <InlineStack gap="400" wrap>
                  {competitorAds.map((ad) => (
                    <Card key={ad.id}>
                      <BlockStack gap="200">
                        <Text variant="bodyMd" fontWeight="bold" as="p">
                          {ad.pageName}
                        </Text>
                        <Text variant="bodySm" as="p">{ad.headline}</Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {ad.bodyText?.slice(0, 100)}...
                        </Text>
                        <InlineStack gap="100">
                          {ad.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </InlineStack>
                        <Button size="slim">Use as Inspiration</Button>
                      </BlockStack>
                    </Card>
                  ))}
                </InlineStack>
              )}
            </Layout.Section>
          </Layout>
        ) : (
          <Layout>
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Top Hooks</Text>
                  {trends?.hooks?.map((h: any) => (
                    <InlineStack key={h.hook} align="space-between">
                      <Text as="span">{h.hook}</Text>
                      <Badge tone={h.trend === "up" ? "success" : undefined}>
                        {h.frequency}%
                      </Badge>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Top Formats</Text>
                  {trends?.formats?.map((f: any) => (
                    <InlineStack key={f.format} align="space-between">
                      <Text as="span">{f.format}</Text>
                      <Badge tone={f.trend === "up" ? "success" : undefined}>
                        {f.frequency}%
                      </Badge>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Top Angles</Text>
                  {trends?.angles?.map((a: any) => (
                    <InlineStack key={a.angle} align="space-between">
                      <Text as="span">{a.angle}</Text>
                      <Badge tone={a.trend === "up" ? "success" : undefined}>
                        {a.frequency}%
                      </Badge>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
      </Tabs>
    </Page>
  );
}
