import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import type { PrayerStatus } from "@/types";
import { cn } from "@/lib/utils";

const STYLE: Record<PrayerStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  ending_soon: "bg-amber-100 text-amber-800 animate-pulse",
  ended: "bg-slate-100 text-slate-500",
  upcoming: "bg-slate-100 text-slate-600",
};

export function StatusBadge({
  status,
  className,
}: {
  status: PrayerStatus;
  className?: string;
}) {
  const { t } = useT();
  return (
    <Badge className={cn("border-transparent", STYLE[status], className)}>
      {t.status[status]}
    </Badge>
  );
}
