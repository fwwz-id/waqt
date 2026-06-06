import type { ReactNode } from "react";
import { BellRing, BellOff, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettings } from "@/app/SettingsContext";
import { usePrayerDay } from "@/hooks/usePrayerDay";
import { useNotifications } from "@/hooks/useNotifications";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

const BEFORE_START_OPTIONS = [30, 15, 10, 5];
const BEFORE_END_OPTIONS = [15, 10, 5];

export function NotificationSettings() {
  const { settings, setNotifications } = useSettings();
  const { t } = useT();
  const { windows } = usePrayerDay();
  const { supported, permission, enabled, scheduledCount, requestPermission } =
    useNotifications(windows);
  const notif = settings.notifications;

  const toggle = (list: number[], value: number) =>
    list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value].sort((a, b) => b - a);

  if (!supported) {
    return (
      <Alert variant="warning">
        <BellOff className="h-4 w-4" />
        <AlertTitle>{t.notif.unsupportedTitle}</AlertTitle>
        <AlertDescription>{t.notif.unsupportedBody}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {permission === "denied" && (
        <Alert variant="warning">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{t.notif.deniedBody}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{t.notif.reminderTitle}</p>
              <p className="text-xs text-muted-foreground">
                {t.notif.reminderDesc}
              </p>
            </div>
            {permission === "granted" ? (
              <Switch
                checked={notif.enabled}
                onCheckedChange={(v) => setNotifications({ enabled: v })}
              />
            ) : (
              <Button size="sm" onClick={requestPermission}>
                <BellRing className="h-4 w-4" />
                {t.common.allow}
              </Button>
            )}
          </div>

          {enabled && permission === "granted" && (
            <>
              <Separator />
              <Row label={t.notif.atStart} desc={t.notif.atStartDesc}>
                <Switch
                  checked={notif.atStart}
                  onCheckedChange={(v) => setNotifications({ atStart: v })}
                />
              </Row>

              <Separator />
              <div>
                <p className="text-sm font-medium">{t.notif.beforeStart}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t.notif.beforeStartDesc}
                </p>
                <Chips
                  options={BEFORE_START_OPTIONS}
                  selected={notif.beforeStartMinutes}
                  fmt={t.notif.minutes}
                  onToggle={(m) =>
                    setNotifications({
                      beforeStartMinutes: toggle(notif.beforeStartMinutes, m),
                    })
                  }
                />
              </div>

              <Separator />
              <div>
                <p className="text-sm font-medium">{t.notif.beforeEnd}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t.notif.beforeEndDesc}
                </p>
                <Chips
                  options={BEFORE_END_OPTIONS}
                  selected={notif.beforeEndMinutes}
                  fmt={t.notif.minutes}
                  onToggle={(m) =>
                    setNotifications({
                      beforeEndMinutes: toggle(notif.beforeEndMinutes, m),
                    })
                  }
                />
              </div>

              <Separator />
              <Alert variant="info">
                <AlertDescription className="text-xs">
                  {t.notif.webLimitation}
                  {scheduledCount > 0 && <> {t.notif.scheduled(scheduledCount)}</>}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Chips({
  options,
  selected,
  fmt,
  onToggle,
}: {
  options: number[];
  selected: number[];
  fmt: (m: number) => string;
  onToggle: (m: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((m) => {
        const active = selected.includes(m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => onToggle(m)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent",
            )}
          >
            {fmt(m)}
          </button>
        );
      })}
    </div>
  );
}
