import { useState } from "react";
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
  Spinner,
  Box,
  Banner,
} from "@shopify/polaris";
import type { CreativeVariant } from "@shopify-ad-intelligence/common";
import { api } from "@/lib/apiClient";

export default function CreativeStudioPage() {
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<CreativeVariant[]>([]);
  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    offer: "",
    audience: "",
    angle: "",
    format: "image",
    count: "3",
  });

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const result = await api.generateCreatives({
        ...form,
        count: parseInt(form.count, 10),
      }) as CreativeVariant[];
      setVariants(result || []);
    } catch (err) {
      console.error("Failed to generate creatives:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async (variant: CreativeVariant) => {
    try {
      const score = await api.scoreCreative({
        headline: variant.headline,
        primaryText: variant.primaryText,
        cta: variant.cta,
        format: variant.format,
      });
      console.log("Score:", score);
    } catch (err) {
      console.error("Failed to score creative:", err);
    }
  };

  return (
    <Page
      title="Creative Studio"
      subtitle="Generate and optimize ad creatives"
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Generate Creatives</Text>
              <FormLayout>
                <TextField
                  label="Product Name"
                  value={form.productName}
                  onChange={(v) => setForm({ ...form, productName: v })}
                  autoComplete="off"
                />
                <TextField
                  label="Product Description"
                  value={form.productDescription}
                  onChange={(v) => setForm({ ...form, productDescription: v })}
                  multiline={3}
                  autoComplete="off"
                />
                <TextField
                  label="Offer"
                  value={form.offer}
                  onChange={(v) => setForm({ ...form, offer: v })}
                  placeholder="e.g., 20% off, Free shipping"
                  autoComplete="off"
                />
                <TextField
                  label="Target Audience"
                  value={form.audience}
                  onChange={(v) => setForm({ ...form, audience: v })}
                  placeholder="e.g., Fitness enthusiasts"
                  autoComplete="off"
                />
                <TextField
                  label="Angle"
                  value={form.angle}
                  onChange={(v) => setForm({ ...form, angle: v })}
                  placeholder="e.g., Urgency, Social proof"
                  autoComplete="off"
                />
                <Select
                  label="Format"
                  options={[
                    { label: "Image", value: "image" },
                    { label: "Video", value: "video" },
                    { label: "Carousel", value: "carousel" },
                  ]}
                  value={form.format}
                  onChange={(v) => setForm({ ...form, format: v })}
                />
                <Select
                  label="Number of Variants"
                  options={[
                    { label: "3", value: "3" },
                    { label: "5", value: "5" },
                    { label: "10", value: "10" },
                  ]}
                  value={form.count}
                  onChange={(v) => setForm({ ...form, count: v })}
                />
                <Button variant="primary" onClick={handleGenerate} loading={loading}>
                  Generate
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Generated Variants</Text>
              {loading ? (
                <Box padding="400">
                  <InlineStack align="center"><Spinner /></InlineStack>
                </Box>
              ) : variants.length === 0 ? (
                <Text tone="subdued" as="p">
                  Fill in the form and click Generate to create ad variants.
                </Text>
              ) : (
                <BlockStack gap="400">
                  {variants.map((variant) => (
                    <Card key={variant.id}>
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text variant="bodyMd" fontWeight="bold" as="p">
                            {variant.name}
                          </Text>
                          <InlineStack gap="100">
                            <Badge>{variant.format}</Badge>
                            <Badge tone={variant.complianceStatus === "ok" ? "success" : "warning"}>
                              {variant.complianceStatus}
                            </Badge>
                            {variant.predictedScore && (
                              <Badge tone="info">
                                Score: {variant.predictedScore.toFixed(1)}
                              </Badge>
                            )}
                          </InlineStack>
                        </InlineStack>
                        <Text variant="headingSm" as="h3">{variant.headline}</Text>
                        <Text variant="bodySm" as="p">{variant.primaryText}</Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          CTA: {variant.cta}
                        </Text>
                        <InlineStack gap="200">
                          <Button size="slim" onClick={() => handleScore(variant)}>
                            Score
                          </Button>
                          <Button size="slim">Export</Button>
                          <Button size="slim" variant="primary">Use</Button>
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
