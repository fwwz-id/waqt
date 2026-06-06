import { useSettings } from "@/app/SettingsContext";
import { getMessages, localeFor, type Messages } from "@/lib/i18n/messages";

/** Translated messages for the active language, plus the Intl locale tag. */
export function useT(): { t: Messages; locale: string; lang: "id" | "en" } {
  const { settings } = useSettings();
  const lang = settings.language;
  return { t: getMessages(lang), locale: localeFor(lang), lang };
}
