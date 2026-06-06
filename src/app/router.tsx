import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  useParams,
} from "@tanstack/react-router";
import { AppShell } from "./AppShell";
import { useSettings } from "./SettingsContext";
import { DashboardScreen } from "@/features/dashboard/DashboardScreen";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { FiqhSettingsScreen } from "@/features/settings/FiqhSettingsScreen";
import { PrayerDetailScreen } from "@/features/prayer-detail/PrayerDetailScreen";
import { AboutScreen } from "@/features/about/AboutScreen";
import { PRAYER_ORDER } from "@/lib/prayer/labels";
import type { PrayerName } from "@/types";

const rootRoute = createRootRoute({ component: AppShell });

/** Index: gate behind onboarding until a location is set. */
function IndexGate() {
  const { ready } = useSettings();
  if (!ready) return <Navigate to="/onboarding" />;
  return <DashboardScreen />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexGate,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingScreen,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsScreen,
});

const fiqhRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/fiqh",
  component: FiqhSettingsScreen,
});

function PrayerDetailRoute() {
  const { name } = useParams({ from: "/prayer/$name" });
  if (!PRAYER_ORDER.includes(name as PrayerName)) {
    return <Navigate to="/" />;
  }
  return <PrayerDetailScreen name={name as PrayerName} />;
}

const prayerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/prayer/$name",
  component: PrayerDetailRoute,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  onboardingRoute,
  settingsRoute,
  fiqhRoute,
  prayerRoute,
  aboutRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
