import { Link } from "@tanstack/react-router";
import { MapPin, Settings, BellRing, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettings } from "@/app/SettingsContext";
import { usePrayerDay } from "@/hooks/usePrayerDay";
import { useNotifications } from "@/hooks/useNotifications";
import { useNow } from "@/hooks/useNow";
import { currentOrNextWindow } from "@/lib/prayer/prayerWindows";
import { formatClock, formatLongDate } from "@/lib/utils/datetime";
import { useT } from "@/hooks/useT";
import { HeroCard } from "./HeroCard";
import { PrayerList } from "./PrayerList";

export function DashboardScreen() {
  const { settings } = useSettings();
  const { t, locale } = useT();
  const { windows, context, timeZone, error, highLatitudeWarning } =
    usePrayerDay();
  const now = useNow(1000);
  const { enabled, permission, supported } = useNotifications(windows);

  const location = settings.location;
  const current =
    windows.length > 0 ? currentOrNextWindow(windows, now) : null;

  return (
    <div className="mx-auto max-w-md px-4 pb-28 safe-top">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 pt-4">
        <Link
          to="/settings"
          className="inline-flex max-w-[70%] items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-sm"
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">
            {location?.label ?? t.dashboard.setLocation}
          </span>
        </Link>
        <Button asChild variant="ghost" size="icon">
          <Link to="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      <div className="mt-3 mb-4">
        <p className="text-sm text-muted-foreground">
          {formatLongDate(now, timeZone, locale)}
        </p>
        <p className="font-mono text-2xl font-semibold tabular-nums">
          {formatClock(now, timeZone, locale)}
        </p>
      </div>

      {error && (
        <Alert variant="warning" className="mb-4">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>{t.dashboard.errorTitle}</AlertTitle>
          <AlertDescription>
            {error}{" "}
            <Link to="/settings" className="font-medium underline">
              {t.dashboard.openSettings}
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      {current && (
        <HeroCard window={current.window} isActive={current.isActive} />
      )}

      {highLatitudeWarning && (
        <Alert variant="info" className="mt-4">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{t.dashboard.highLat}</AlertDescription>
        </Alert>
      )}

      {supported && !enabled && permission !== "denied" && (
        <Alert variant="default" className="mt-4">
          <BellRing className="h-4 w-4 text-primary" />
          <AlertTitle>{t.dashboard.enableTitle}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{t.dashboard.enableBody}</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/settings">{t.dashboard.setupNotif}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {windows.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2.5 px-1 text-sm font-semibold text-muted-foreground">
            {t.dashboard.todaySchedule}
          </h3>
          <PrayerList
            windows={windows}
            timeZone={timeZone}
            sunrise={context?.today.sunrise}
          />
        </section>
      )}
    </div>
  );
}
