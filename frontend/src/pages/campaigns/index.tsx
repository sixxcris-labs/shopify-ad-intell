import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  useIndexResourceState,
  Filters,
  ChoiceList,
  Spinner,
  Box,
  InlineStack,
} from "@shopify/polaris";
import type { Campaign } from "@shopify-ad-intelligence/common";
import { api } from "@/lib/apiClient";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const status = statusFilter.length === 1 ? statusFilter[0] : undefined;
      const data = await api.getCampaigns({ status }) as { data: Campaign[] };
      setCampaigns(data.data || []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(campaigns);

  const rowMarkup = campaigns.map((campaign, index) => (
    <IndexTable.Row
      id={campaign.id}
      key={campaign.id}
      selected={selectedResources.includes(campaign.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {campaign.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={campaign.status === "active" ? "success" : "info"}>
          {campaign.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>${campaign.spend.toLocaleString()}</IndexTable.Cell>
      <IndexTable.Cell>${campaign.revenue.toLocaleString()}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={campaign.roas >= 2 ? "success" : campaign.roas >= 1 ? "warning" : "critical"}>
          {campaign.roas.toFixed(2)}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>${campaign.profit.toLocaleString()}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge>{campaign.automationLevel}</Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "Active", value: "active" },
            { label: "Paused", value: "paused" },
            { label: "Archived", value: "archived" },
          ]}
          selected={statusFilter}
          onChange={setStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  if (loading) {
    return (
      <Page title="Campaigns">
        <Box padding="800">
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Campaigns"
      subtitle="Manage your ad campaigns"
      primaryAction={{ content: "Refresh", onAction: fetchCampaigns }}
    >
      <Card padding="0">
        <Filters
          queryPlaceholder="Search campaigns"
          filters={filters}
          appliedFilters={[]}
          onQueryChange={() => {}}
          onQueryClear={() => {}}
          onClearAll={() => setStatusFilter([])}
        />
        <IndexTable
          resourceName={{ singular: "campaign", plural: "campaigns" }}
          itemCount={campaigns.length}
          selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Name" },
            { title: "Status" },
            { title: "Spend" },
            { title: "Revenue" },
            { title: "ROAS" },
            { title: "Profit" },
            { title: "Automation" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Page>
  );
}
