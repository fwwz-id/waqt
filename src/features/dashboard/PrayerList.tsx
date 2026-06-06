import { Link } from "@tanstack/react-router";
import { ChevronRight, Sunrise } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccuracyBadge } from "@/components/AccuracyBadge";
import type { PrayerWindow } from "@/types";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/datetime";

export function PrayerList({
  windows,
  timeZone,
  sunrise,
}: {
  windows: PrayerWindow[];
  timeZone: string;
  sunrise?: Date;
}) {
  const { t, locale } = useT();
  return (
    <div className="space-y-2.5">
      {windows.map((w) => {
        const active = w.status === "active" || w.status === "ending_soon";
        return (
          <Link
            key={w.name}
            to="/prayer/$name"
            params={{ name: w.name }}
            className="block"
          >
            <Card
              className={cn(
                "flex items-center gap-3 p-4 transition-colors hover:bg-accent/60",
                active && "border-primary/40 bg-primary/5",
                w.status === "ended" && "opacity-70",
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.prayers[w.name]}</span>
                  <AccuracyBadge accuracy={w.accuracy} withIcon={false} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {w.startLabel} – {w.endLabel}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </Link>
        );
      })}

      {sunrise && (
        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
          <Sunrise className="h-3.5 w-3.5" />
          {t.dashboard.sunrise}{" "}
          <span className="tabular-nums">
            {formatTime(sunrise, timeZone, locale)}
          </span>
        </div>
      )}
    </div>
  );
}
