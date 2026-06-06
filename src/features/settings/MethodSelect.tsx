import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { METHOD_OPTIONS } from "@/lib/prayer/methods";
import type { CalculationMethod } from "@/types";
import { useT } from "@/hooks/useT";

export function MethodSelect({
  value,
  onChange,
}: {
  value: CalculationMethod;
  onChange: (m: CalculationMethod) => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={(v) => onChange(v as CalculationMethod)}
      >
        <SelectTrigger>
          <SelectValue>{t.methodLabel[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {METHOD_OPTIONS.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {t.methodLabel[m.id]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="px-1 text-xs leading-snug text-muted-foreground">
        {t.methodDesc[value]}
      </p>
    </div>
  );
}
