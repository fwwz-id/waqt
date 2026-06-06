import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AccuracyBadge } from "@/components/AccuracyBadge";
import { StatusBadge } from "@/components/StatusBadge";
import type { PrayerWindow } from "@/types";
import { windowProgress } from "@/lib/prayer/status";
import { formatCountdown, formatDuration } from "@/lib/utils/datetime";
import { useNow } from "@/hooks/useNow";
import { useT } from "@/hooks/useT";

export function HeroCard({
  window: w,
  isActive,
}: {
  window: PrayerWindow;
  isActive: boolean;
}) {
  const now = useNow(1000);
  const { t, lang } = useT();
  const label = t.prayers[w.name];

  const target = isActive ? w.end : w.start;
  const remainingMs = target.getTime() - now.getTime();
  const progress = isActive ? windowProgress(now, w.start, w.end) * 100 : 0;

  const heading = isActive ? t.hero.nowIn(label) : t.hero.towards(label);
  const remainingLabel = isActive
    ? t.hero.remainingAbout(formatDuration(remainingMs, lang))
    : t.hero.startIn(formatDuration(remainingMs, lang));

  return (
    <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">{heading}</p>
          <h2 className="mt-0.5 text-3xl font-bold tracking-tight">{label}</h2>
        </div>
        <StatusBadge status={w.status} />
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {isActive ? t.hero.remaining : t.hero.willEnterIn}
          </p>
          <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
            {formatCountdown(Math.max(0, remainingMs))}
          </p>
        </div>
        <Link
          to="/prayer/$name"
          params={{ name: w.name }}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {t.hero.detail}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isActive && (
        <div className="mt-4">
          <Progress
            value={progress}
            indicatorClassName={
              w.status === "ending_soon" ? "bg-amber-500" : undefined
            }
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" /> {t.hero.start}{" "}
          <strong className="text-foreground tabular-nums">
            {w.startLabel}
          </strong>
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Hourglass className="h-4 w-4" /> {t.hero.end}{" "}
          <strong className="text-foreground tabular-nums">{w.endLabel}</strong>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <AccuracyBadge accuracy={w.accuracy} />
        <span className="text-xs text-muted-foreground">{remainingLabel}</span>
      </div>
    </Card>
  );
}
