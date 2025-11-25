import "@shopify/polaris/build/esm/styles.css";
import type { AppProps } from "next/app";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { AppLayout } from "@/components/layout/AppLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider i18n={enTranslations}>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </AppProvider>
  );
}
