import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  Button,
  Filters,
  ChoiceList,
  Spinner,
  Box,
  Banner,
} from "@shopify/polaris";
import type { Alert } from "@shopify-ad-intelligence/common";
import { api } from "@/lib/apiClient";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>(["open"]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter.length === 1) params.status = statusFilter[0];
      if (severityFilter.length === 1) params.severity = severityFilter[0];
      const data = await api.getAlerts(params) as { data: Alert[] };
      setAlerts(data.data || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (alertId: string) => {
    try {
      await api.updateAlert(alertId, { status: "resolved" });
      fetchAlerts();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const handleSnooze = async (alertId: string) => {
    const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    try {
      await api.updateAlert(alertId, { snoozedUntil });
      fetchAlerts();
    } catch (err) {
      console.error("Failed to snooze alert:", err);
    }
  };

  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "Open", value: "open" },
            { label: "Snoozed", value: "snoozed" },
            { label: "Resolved", value: "resolved" },
          ]}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
      ),
      shortcut: true,
    },
    {
      key: "severity",
      label: "Severity",
      filter: (
        <ChoiceList
          title="Severity"
          titleHidden
          choices={[
            { label: "Critical", value: "critical" },
            { label: "High", value: "high" },
            { label: "Medium", value: "medium" },
            { label: "Low", value: "low" },
          ]}
          selected={severityFilter}
          onChange={setSeverityFilter}
        />
      ),
      shortcut: true,
    },
  ];

  const getSeverityTone = (severity: string) => {
    switch (severity) {
      case "critical": return "critical";
      case "high": return "critical";
      case "medium": return "warning";
      default: return "info";
    }
  };

  if (loading) {
    return (
      <Page title="Alerts">
        <Box padding="800">
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Alerts"
      subtitle="Action items requiring your attention"
    >
      <Card padding="0">
        <Filters
          queryPlaceholder="Search alerts"
          filters={filters}
          appliedFilters={[]}
          onQueryChange={() => {}}
          onQueryClear={() => {}}
          onClearAll={() => {
            setStatusFilter(["open"]);
            setSeverityFilter([]);
          }}
        />
        <ResourceList
          resourceName={{ singular: "alert", plural: "alerts" }}
          items={alerts}
          renderItem={(alert) => (
            <ResourceItem id={alert.id} accessibilityLabel={alert.title}>
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <InlineStack gap="200">
                    <Badge tone={getSeverityTone(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                      {alert.title}
                    </Text>
                  </InlineStack>
                  <Text variant="bodySm" as="p">{alert.message}</Text>
                  {alert.recommendation && (
                    <Text variant="bodySm" tone="subdued" as="p">
                      💡 {alert.recommendation}
                    </Text>
                  )}
                </BlockStack>
                <InlineStack gap="200">
                  {alert.status === "open" && (
                    <>
                      <Button size="slim" onClick={() => handleSnooze(alert.id)}>
                        Snooze
                      </Button>
                      <Button size="slim" variant="primary" onClick={() => handleResolve(alert.id)}>
                        Resolve
                      </Button>
                    </>
                  )}
                  {alert.status !== "open" && (
                    <Badge>{alert.status}</Badge>
                  )}
                </InlineStack>
              </InlineStack>
            </ResourceItem>
          )}
        />
      </Card>
    </Page>
  );
}
