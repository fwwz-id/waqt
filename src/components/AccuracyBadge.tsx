import { Telescope, Scale, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import type { RuleAccuracy } from "@/types";
import { cn } from "@/lib/utils";

const VARIANT: Record<RuleAccuracy, "astronomical" | "fiqh" | "heuristic"> = {
  astronomical: "astronomical",
  fiqh_rule: "fiqh",
  heuristic: "heuristic",
};

const ICON = {
  astronomical: Telescope,
  fiqh_rule: Scale,
  heuristic: CircleDashed,
} as const;

export function AccuracyBadge({
  accuracy,
  className,
  withIcon = true,
}: {
  accuracy: RuleAccuracy;
  className?: string;
  withIcon?: boolean;
}) {
  const { t } = useT();
  const Icon = ICON[accuracy];
  return (
    <Badge variant={VARIANT[accuracy]} className={cn("gap-1", className)}>
      {withIcon && <Icon className="h-3 w-3" />}
      {t.accuracy.labels[accuracy]}
    </Badge>
  );
}
