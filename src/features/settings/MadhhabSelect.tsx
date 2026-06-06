import { Check } from "lucide-react";
import { MADHHAB_LIST } from "@/lib/prayer/fiqhProfiles";
import type { Madhhab } from "@/types";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

export function MadhhabSelect({
  value,
  onChange,
}: {
  value: Madhhab;
  onChange: (m: Madhhab) => void;
}) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {MADHHAB_LIST.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              "relative rounded-xl border p-3 text-left transition-colors",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{p.label}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </div>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {t.madhhabDesc[p.id]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
