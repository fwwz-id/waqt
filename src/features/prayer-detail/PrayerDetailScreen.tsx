import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Hourglass, Info, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AccuracyBadge } from "@/components/AccuracyBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/app/SettingsContext";
import { usePrayerDay } from "@/hooks/usePrayerDay";
import { useNow } from "@/hooks/useNow";
import { useT } from "@/hooks/useT";
import type { PrayerName } from "@/types";
import { endTimeAlternatives } from "@/lib/prayer/explain";
import { getProfile } from "@/lib/prayer/fiqhProfiles";
import { formatCountdown, formatDuration } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";

export function PrayerDetailScreen({ name }: { name: PrayerName }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { t, lang } = useT();
  const { windows, context, timeZone, error } = usePrayerDay();
  const now = useNow(1000);

  const w = windows.find((x) => x.name === name);
  const label = t.prayers[name];
  const profile = getProfile(settings.madhhab);

  if (error || !w || !context) {
    return (
      <div className="mx-auto max-w-md px-4 pb-28 safe-top">
        <DetailHeader label={label} onBack={() => navigate({ to: "/" })} />
        <Alert variant="warning" className="mt-6">
          <AlertDescription>{error ?? t.detail.notAvailable}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActive = w.status === "active" || w.status === "ending_soon";
  const target = isActive ? w.end : w.start;
  const remainingMs = target.getTime() - now.getTime();
  const alternatives = endTimeAlternatives(
    name,
    context,
    settings,
    timeZone,
    lang,
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-28 safe-top">
      <DetailHeader label={label} onBack={() => navigate({ to: "/" })} />

      <Card className="mt-4 border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={w.status} />
            <AccuracyBadge accuracy={w.accuracy} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {isActive ? t.detail.remaining : t.detail.willEnterIn}
            </p>
            <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
              {formatCountdown(Math.max(0, remainingMs))}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isActive
                ? t.detail.aboutMore(formatDuration(remainingMs, lang))
                : t.detail.startAt(w.startLabel)}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <TimeStat
              icon={<Clock className="h-4 w-4" />}
              label={t.detail.startTime}
              value={w.startLabel}
            />
            <TimeStat
              icon={<Hourglass className="h-4 w-4" />}
              label={t.detail.endEstimate}
              value={w.endLabel}
            />
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <section className="mt-5 space-y-2">
        <h3 className="px-1 text-sm font-semibold text-muted-foreground">
          {t.detail.explanationTitle}
        </h3>
        <Card>
          <CardContent className="space-y-3 p-4 text-sm leading-relaxed">
            <p>{w.explanation}</p>
            <Separator />
            <p className="text-xs text-muted-foreground">
              {t.accuracy.descriptions[w.accuracy]}
            </p>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <BookOpen className="h-4 w-4" />
                  {t.detail.explainBtn}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{t.detail.endEstimateFor(label)}</DrawerTitle>
                  <DrawerDescription>
                    {t.detail.basedOnProfile(profile.label)}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="space-y-3 px-5 pb-8">
                  <p className="text-sm leading-relaxed">{w.explanation}</p>
                  <Alert variant="info">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {t.profileDisclaimer}
                    </AlertDescription>
                  </Alert>
                </div>
              </DrawerContent>
            </Drawer>
          </CardContent>
        </Card>
      </section>

      {/* Alternatives */}
      {alternatives.length > 1 && (
        <section className="mt-5 space-y-2">
          <h3 className="px-1 text-sm font-semibold text-muted-foreground">
            {t.detail.otherOpinions}
          </h3>
          <Card>
            <CardContent className="p-2">
              {alternatives.map((alt) => (
                <div
                  key={alt.ruleId}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5",
                    alt.isCurrent && "bg-primary/5",
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{alt.label}</span>
                      {alt.isCurrent && (
                        <span className="text-[10px] font-semibold uppercase text-primary">
                          {t.common.used}
                        </span>
                      )}
                    </div>
                    <AccuracyBadge
                      accuracy={alt.accuracy}
                      withIcon={false}
                      className="mt-1"
                    />
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {alt.endLabel}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            {t.detail.changeRulePrompt}{" "}
            <Link
              to="/settings/fiqh"
              className="font-medium text-primary underline"
            >
              {t.detail.openAdvanced}
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}

function DetailHeader({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  return (
    <header className="flex items-center gap-2 pt-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-bold tracking-tight">{label}</h1>
    </header>
  );
}

function TimeStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
