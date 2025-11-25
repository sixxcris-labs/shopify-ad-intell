import { Frame, Navigation, TopBar } from "@shopify/polaris";
import {
  HomeIcon,
  TargetIcon,
  AutomationIcon,
  ImageIcon,
  PaintBrushIcon,
  NotificationIcon,
  ReportIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { useRouter } from "next/router";

const navItems = [
  { url: "/", label: "Overview", icon: HomeIcon },
  { url: "/campaigns", label: "Campaigns", icon: TargetIcon },
  { url: "/rules", label: "Rules", icon: AutomationIcon },
  { url: "/creative-intelligence", label: "Creative Intelligence", icon: ImageIcon },
  { url: "/creative-studio", label: "Creative Studio", icon: PaintBrushIcon },
  { url: "/alerts", label: "Alerts", icon: NotificationIcon },
  { url: "/reports", label: "Reports", icon: ReportIcon },
  { url: "/settings", label: "Settings", icon: SettingsIcon },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const [mobileNavActive, setMobileNavActive] = useState(false);

  const toggleMobileNav = useCallback(
    () => setMobileNavActive((active) => !active),
    []
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNav}
    />
  );

  const navigationMarkup = (
    <Navigation location={router.pathname}>
      <Navigation.Section
        items={navItems.map((item) => ({
          ...item,
          selected: router.pathname === item.url,
          onClick: () => router.push(item.url),
        }))}
      />
    </Navigation>
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavActive}
      onNavigationDismiss={toggleMobileNav}
    >
      {children}
    </Frame>
  );
}
