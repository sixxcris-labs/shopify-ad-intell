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
  Tabs,
  DataTable,
  Spinner,
  Box,
  ProgressBar,
} from "@shopify/polaris";
import { api } from "@/lib/apiClient";

export default function ReportsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [creativeReport, setCreativeReport] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sum, creative, bench] = await Promise.all([
        api.getSummary(),
        api.getCreativeReport(),
        api.getBenchmarks(),
      ]);
      setSummary(sum);
      setCreativeReport(creative);
      setBenchmarks(bench);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "summary", content: "Summary" },
    { id: "creative", content: "Creative Performance" },
    { id: "benchmarks", content: "Benchmarks" },
  ];

  const handleExport = async (type: string) => {
    try {
      const result = await api.exportReport({
        type,
        format: "csv",
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      }) as { downloadUrl: string };
      window.open(result.downloadUrl, "_blank");
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  if (loading) {
    return (
      <Page title="Reports">
        <Box padding="800">
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Reports"
      subtitle="Performance insights and benchmarks"
      secondaryActions={[
        { content: "Export CSV", onAction: () => handleExport("summary") },
      ]}
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        {selectedTab === 0 && summary && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Weekly Summary</Text>
                  <InlineStack gap="400">
                    {summary.kpis?.map((kpi: any) => (
                      <BlockStack key={kpi.label} gap="100">
                        <Text variant="bodySm" tone="subdued" as="p">{kpi.label}</Text>
                        <Text variant="headingLg" as="p">{kpi.value}</Text>
                        {kpi.change !== undefined && (
                          <Badge tone={kpi.trend === "up" ? "success" : "critical"}>
                            {kpi.change > 0 ? "+" : ""}{kpi.change}%
                          </Badge>
                        )}
                      </BlockStack>
                    ))}
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Top Campaigns</Text>
                  {summary.topCampaigns?.map((c: any) => (
                    <InlineStack key={c.id} align="space-between">
                      <Text as="span">{c.name}</Text>
                      <InlineStack gap="200">
                        <Badge tone="success">ROAS {c.roas}</Badge>
                        <Text as="span">${c.profit}</Text>
                      </InlineStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Needs Attention</Text>
                  {summary.bottomCampaigns?.map((c: any) => (
                    <InlineStack key={c.id} align="space-between">
                      <Text as="span">{c.name}</Text>
                      <InlineStack gap="200">
                        <Badge tone="critical">ROAS {c.roas}</Badge>
                        <Text as="span">${c.profit}</Text>
                      </InlineStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}

        {selectedTab === 1 && creativeReport && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Top Performers</Text>
                  <DataTable
                    columnContentTypes={["text", "text", "numeric", "numeric", "numeric"]}
                    headings={["Name", "Format", "ROAS", "Spend", "Revenue"]}
                    rows={creativeReport.winners?.map((w: any) => [
                      w.name,
                      w.format,
                      w.roas.toFixed(2),
                      `$${w.spend}`,
                      `$${w.revenue}`,
                    ]) || []}
                  />
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Fatigued Creatives</Text>
                  {creativeReport.fatigued?.map((f: any) => (
                    <InlineStack key={f.id} align="space-between">
                      <Text as="span">{f.name}</Text>
                      <InlineStack gap="200">
                        <Text variant="bodySm" tone="subdued" as="span">
                          {f.daysSinceCreation} days old
                        </Text>
                        <ProgressBar progress={f.fatigueScore} tone="critical" size="small" />
                      </InlineStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}

        {selectedTab === 2 && benchmarks && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Industry Benchmarks: {benchmarks.industry} - {benchmarks.vertical}
                  </Text>
                  <BlockStack gap="300">
                    {Object.entries(benchmarks.metrics || {}).map(([key, data]: [string, any]) => (
                      <InlineStack key={key} align="space-between">
                        <Text as="span" fontWeight="semibold">{key.toUpperCase()}</Text>
                        <InlineStack gap="400">
                          <Text as="span">Your: {data.value}</Text>
                          <Text as="span" tone="subdued">Benchmark: {data.benchmark}</Text>
                          <Badge tone={data.percentile > 50 ? "success" : "warning"}>
                            {data.percentile}th percentile
                          </Badge>
                        </InlineStack>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
      </Tabs>
    </Page>
  );
}
