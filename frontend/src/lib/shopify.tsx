import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ReactNode } from "react";

interface ShopifyProviderProps {
  children: ReactNode;
}

export function ShopifyProvider({ children }: ShopifyProviderProps) {
  return (
    <AppProvider i18n={enTranslations}>
      {children}
    </AppProvider>
  );
}
