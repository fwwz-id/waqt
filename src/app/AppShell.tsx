import { Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

/** Hide chrome on the full-screen onboarding flow. */
const FULLSCREEN_ROUTES = ["/onboarding"];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="min-h-dvh bg-background">
      <Outlet />
      {!fullscreen && <BottomNav />}
    </div>
  );
}
