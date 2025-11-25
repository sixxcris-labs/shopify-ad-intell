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
  Modal,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Spinner,
  Box,
  Banner,
} from "@shopify/polaris";
import type { Rule } from "@shopify-ad-intelligence/common";
import { api } from "@/lib/apiClient";

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    scope: "campaign",
    automationMode: "suggestions_only",
  });

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getRules() as { data: Rule[] };
      setRules(data.data || []);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async () => {
    try {
      await api.createRule(newRule);
      setModalOpen(false);
      setNewRule({ name: "", scope: "campaign", automationMode: "suggestions_only" });
      fetchRules();
    } catch (err) {
      console.error("Failed to create rule:", err);
    }
  };

  const handleToggleRule = async (rule: Rule) => {
    try {
      await api.updateRule(rule.id, { active: !rule.active });
      fetchRules();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  if (loading) {
    return (
      <Page title="Rules">
        <Box padding="800">
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Rules"
      subtitle="Automate your ad management"
      primaryAction={{ content: "Create Rule", onAction: () => setModalOpen(true) }}
    >
      <Card>
        <ResourceList
          resourceName={{ singular: "rule", plural: "rules" }}
          items={rules}
          renderItem={(rule) => (
            <ResourceItem
              id={rule.id}
              accessibilityLabel={`View details for ${rule.name}`}
            >
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <InlineStack gap="200">
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                      {rule.name}
                    </Text>
                    <Badge tone={rule.active ? "success" : undefined}>
                      {rule.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge tone={
                      rule.riskLevel === "high" ? "critical" :
                      rule.riskLevel === "medium" ? "warning" : "info"
                    }>
                      {rule.riskLevel} risk
                    </Badge>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {rule.description || `Scope: ${rule.scope} | Mode: ${rule.automationMode}`}
                  </Text>
                </BlockStack>
                <InlineStack gap="200">
                  <Button size="slim" onClick={() => handleToggleRule(rule)}>
                    {rule.active ? "Disable" : "Enable"}
                  </Button>
                  <Button size="slim" variant="plain">Edit</Button>
                </InlineStack>
              </InlineStack>
            </ResourceItem>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Rule"
        primaryAction={{ content: "Create", onAction: handleCreateRule }}
        secondaryActions={[{ content: "Cancel", onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Rule Name"
              value={newRule.name}
              onChange={(v) => setNewRule({ ...newRule, name: v })}
              autoComplete="off"
            />
            <Select
              label="Scope"
              options={[
                { label: "Campaign", value: "campaign" },
                { label: "Ad Set", value: "ad_set" },
                { label: "Ad", value: "ad" },
              ]}
              value={newRule.scope}
              onChange={(v) => setNewRule({ ...newRule, scope: v })}
            />
            <Select
              label="Automation Mode"
              options={[
                { label: "Suggestions Only", value: "suggestions_only" },
                { label: "Auto (Low Risk)", value: "auto_low_risk" },
                { label: "Auto (All)", value: "auto_all" },
              ]}
              value={newRule.automationMode}
              onChange={(v) => setNewRule({ ...newRule, automationMode: v })}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
