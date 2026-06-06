import type { ReactNode } from "react";
import { BellRing, BellOff, ShieldAlert, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  const { supported, permission, enabled, scheduledCount, usesPush, pushError, requestPermission, setPushEnabled } =
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

      {pushError && (
        <Alert variant="warning">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            {t.notif.pushRegisterFailed}
            <span className="mt-1 block text-xs opacity-70">{pushError}</span>
          </AlertDescription>
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
                onCheckedChange={(v) => void setPushEnabled(v)}
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
                  {usesPush ? t.notif.pushEnabled : t.notif.webLimitation}
                  {scheduledCount > 0 && <> {t.notif.scheduled(scheduledCount)}</>}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      <TroubleshootDrawer />
    </div>
  );
}

function TroubleshootDrawer() {
  const { t } = useT();
  const ts = t.notif.troubleshoot;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {ts.trigger}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{ts.title}</DrawerTitle>
          <DrawerDescription>{ts.intro}</DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 pb-8">
          {ts.steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
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
