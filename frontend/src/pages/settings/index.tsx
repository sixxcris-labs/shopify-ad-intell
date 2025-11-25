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
  FormLayout,
  TextField,
  Select,
  RangeSlider,
  Checkbox,
  Spinner,
  Box,
  Banner,
  Divider,
} from "@shopify/polaris";
import type { Settings } from "@shopify-ad-intelligence/common";
import { api } from "@/lib/apiClient";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSettings() as Settings;
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveAutomation = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateAutomation(settings.automation);
      setSuccess("Automation settings saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBrandProfile = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateBrandProfile(settings.brandProfile);
      setSuccess("Brand profile saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Page title="Settings">
        <Box padding="800">
          <InlineStack align="center"><Spinner size="large" /></InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page title="Settings" subtitle="Configure your app preferences">
      {success && (
        <Banner tone="success" onDismiss={() => setSuccess(null)}>
          {success}
        </Banner>
      )}

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Integrations</Text>
              
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text fontWeight="semibold" as="span">Shopify</Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {settings.integrations.shopify.shop || "Not connected"}
                  </Text>
                </BlockStack>
                <Badge tone={settings.integrations.shopify.connected ? "success" : undefined}>
                  {settings.integrations.shopify.connected ? "Connected" : "Disconnected"}
                </Badge>
              </InlineStack>

              <Divider />

              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text fontWeight="semibold" as="span">Meta Ads</Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {settings.integrations.meta.adAccountName || "Not connected"}
                  </Text>
                </BlockStack>
                {settings.integrations.meta.connected ? (
                  <Badge tone="success">Connected</Badge>
                ) : (
                  <Button onClick={() => api.connectMeta()}>Connect</Button>
                )}
              </InlineStack>

              <Divider />

              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text fontWeight="semibold" as="span">Slack</Text>
                  <Text variant="bodySm" tone="subdued" as="p">Receive alerts in Slack</Text>
                </BlockStack>
                {settings.integrations.slack.connected ? (
                  <Badge tone="success">Connected</Badge>
                ) : (
                  <Button onClick={() => {}}>Connect</Button>
                )}
              </InlineStack>

              <Divider />

              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text fontWeight="semibold" as="span">Discord</Text>
                  <Text variant="bodySm" tone="subdued" as="p">Receive alerts in Discord</Text>
                </BlockStack>
                {settings.integrations.discord.connected ? (
                  <Badge tone="success">Connected</Badge>
                ) : (
                  <Button onClick={() => {}}>Connect</Button>
                )}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Automation</Text>
              <FormLayout>
                <Select
                  label="Global Automation Level"
                  options={[
                    { label: "Suggestions Only", value: "suggestions_only" },
                    { label: "Auto (Low Risk)", value: "auto_low_risk" },
                    { label: "Auto (Advanced)", value: "auto_advanced" },
                  ]}
                  value={settings.automation.globalAutomationLevel}
                  onChange={(v) => setSettings({
                    ...settings,
                    automation: { ...settings.automation, globalAutomationLevel: v as any },
                  })}
                />
                <RangeSlider
                  label={`Max Daily Spend Change: ${settings.automation.maxDailySpendChangePercent}%`}
                  value={settings.automation.maxDailySpendChangePercent}
                  min={5}
                  max={50}
                  onChange={(v) => setSettings({
                    ...settings,
                    automation: { ...settings.automation, maxDailySpendChangePercent: v as number },
                  })}
                  output
                />
                <Checkbox
                  label="Require review for high-risk actions"
                  checked={settings.automation.requireReviewForHighRisk}
                  onChange={(v) => setSettings({
                    ...settings,
                    automation: { ...settings.automation, requireReviewForHighRisk: v },
                  })}
                />
                <Checkbox
                  label="Pause automation on tracking issues"
                  checked={settings.automation.pauseOnTrackingIssues}
                  onChange={(v) => setSettings({
                    ...settings,
                    automation: { ...settings.automation, pauseOnTrackingIssues: v },
                  })}
                />
                <Checkbox
                  label="Notify on automated actions"
                  checked={settings.automation.notifyOnAutoActions}
                  onChange={(v) => setSettings({
                    ...settings,
                    automation: { ...settings.automation, notifyOnAutoActions: v },
                  })}
                />
              </FormLayout>
              <Button variant="primary" onClick={handleSaveAutomation} loading={saving}>
                Save Automation Settings
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Brand Profile</Text>
              <FormLayout>
                <RangeSlider
                  label={`Tone: Formal ← → Casual (${settings.brandProfile.toneFormalToCasual})`}
                  value={settings.brandProfile.toneFormalToCasual}
                  min={1}
                  max={10}
                  onChange={(v) => setSettings({
                    ...settings,
                    brandProfile: { ...settings.brandProfile, toneFormalToCasual: v as number },
                  })}
                />
                <RangeSlider
                  label={`Tone: Playful ← → Serious (${settings.brandProfile.tonePlayfulToSerious})`}
                  value={settings.brandProfile.tonePlayfulToSerious}
                  min={1}
                  max={10}
                  onChange={(v) => setSettings({
                    ...settings,
                    brandProfile: { ...settings.brandProfile, tonePlayfulToSerious: v as number },
                  })}
                />
                <TextField
                  label="Voice Description"
                  value={settings.brandProfile.voiceDescription || ""}
                  onChange={(v) => setSettings({
                    ...settings,
                    brandProfile: { ...settings.brandProfile, voiceDescription: v },
                  })}
                  multiline={2}
                  autoComplete="off"
                />
              </FormLayout>
              <Button variant="primary" onClick={handleSaveBrandProfile} loading={saving}>
                Save Brand Profile
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Community Benchmarking</Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Opt in to share anonymized data and see how you compare to peers.
              </Text>
              <Checkbox
                label="Opt in to community benchmarking"
                checked={settings.community.optedIn}
                onChange={(v) => setSettings({
                  ...settings,
                  community: { ...settings.community, optedIn: v },
                })}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
