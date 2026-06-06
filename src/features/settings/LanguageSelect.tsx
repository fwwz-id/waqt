import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/app/SettingsContext";
import { LANGUAGES } from "@/lib/i18n/messages";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { settings, setLanguage } = useSettings();
  return (
    <Select
      value={settings.language}
      onValueChange={(v) => setLanguage(v as Language)}
    >
      <SelectTrigger className={cn(compact && "h-9 w-auto gap-1 px-3 text-xs")}>
        <SelectValue>
          {compact
            ? settings.language.toUpperCase()
            : LANGUAGES.find((l) => l.id === settings.language)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
