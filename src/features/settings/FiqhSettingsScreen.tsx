import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AccuracyBadge } from "@/components/AccuracyBadge";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "@/app/SettingsContext";
import { usePrayerDay } from "@/hooks/usePrayerDay";
import { useT } from "@/hooks/useT";
import type { PrayerName, RuleId } from "@/types";
import { PRAYER_ORDER } from "@/lib/prayer/labels";
import { rulesForPrayer } from "@/lib/prayer/fiqhRules";
import { getProfile, resolveEndRule } from "@/lib/prayer/fiqhProfiles";
import { endTimeAlternatives } from "@/lib/prayer/explain";
import { cn } from "@/lib/utils";

const HEURISTIC_OPTIONS = {
  shortMaghribMinutes: [10, 15, 20, 25],
  yellowingSunMinutesBeforeMaghrib: [20, 30, 40],
  isfarMinutesBeforeSunrise: [15, 20, 30],
} as const;

export function FiqhSettingsScreen() {
  const navigate = useNavigate();
  const { settings, setCustomRule, setHeuristic } = useSettings();
  const { t, lang } = useT();
  const { context, timeZone } = usePrayerDay();
  const profile = getProfile(settings.madhhab);

  // Only prayers that have more than one valid end-rule are worth overriding.
  const editablePrayers = PRAYER_ORDER.filter(
    (p) => rulesForPrayer(p).length > 1,
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-28 safe-top">
      <header className="flex items-center gap-2 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/settings" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.fiqh.title}</h1>
          <p className="text-xs text-muted-foreground">
            {t.fiqh.subtitle(profile.label)}
          </p>
        </div>
      </header>

      <Alert variant="info" className="mt-4">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">{t.fiqh.info}</AlertDescription>
      </Alert>

      <div className="mt-6 space-y-6">
        {editablePrayers.map((prayer) => (
          <PrayerRuleSelector
            key={prayer}
            prayer={prayer}
            hasContext={!!context}
            options={
              context
                ? endTimeAlternatives(prayer, context, settings, timeZone, lang)
                : []
            }
            isOverridden={!!settings.customRules?.[prayer]}
            effectiveRule={resolveEndRule(
              settings.madhhab,
              prayer,
              settings.customRules,
            )}
            onSelect={(ruleId) => setCustomRule(prayer, ruleId)}
            onResetDefault={() => setCustomRule(prayer, null)}
          />
        ))}

        {/* Heuristic minute settings */}
        <SettingsSection
          title={t.fiqh.adjustments}
          icon={<Info className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <HeuristicRow
              title={t.fiqh.shortMaghribTitle}
              desc={t.fiqh.shortMaghribDesc}
              unit={t.notif.minutes}
              value={settings.heuristicSettings.shortMaghribMinutes}
              options={HEURISTIC_OPTIONS.shortMaghribMinutes}
              onChange={(v) => setHeuristic("shortMaghribMinutes", v)}
            />
            <HeuristicRow
              title={t.fiqh.yellowingTitle}
              desc={t.fiqh.yellowingDesc}
              unit={t.notif.minutes}
              value={
                settings.heuristicSettings.yellowingSunMinutesBeforeMaghrib
              }
              options={HEURISTIC_OPTIONS.yellowingSunMinutesBeforeMaghrib}
              onChange={(v) =>
                setHeuristic("yellowingSunMinutesBeforeMaghrib", v)
              }
            />
            <HeuristicRow
              title={t.fiqh.isfarTitle}
              desc={t.fiqh.isfarDesc}
              unit={t.notif.minutes}
              value={settings.heuristicSettings.isfarMinutesBeforeSunrise}
              options={HEURISTIC_OPTIONS.isfarMinutesBeforeSunrise}
              onChange={(v) => setHeuristic("isfarMinutesBeforeSunrise", v)}
            />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function PrayerRuleSelector({
  prayer,
  options,
  effectiveRule,
  isOverridden,
  hasContext,
  onSelect,
  onResetDefault,
}: {
  prayer: PrayerName;
  options: ReturnType<typeof endTimeAlternatives>;
  effectiveRule: RuleId;
  isOverridden: boolean;
  hasContext: boolean;
  onSelect: (ruleId: RuleId) => void;
  onResetDefault: () => void;
}) {
  const { t } = useT();
  const rules = rulesForPrayer(prayer);

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">
          {t.fiqh.endOf(t.prayers[prayer])}
        </h2>
        {isOverridden && (
          <button
            type="button"
            onClick={onResetDefault}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            <RotateCcw className="h-3 w-3" />
            {t.fiqh.backToProfile}
          </button>
        )}
      </div>
      <Card>
        <CardContent className="p-2">
          {rules.map((rule) => {
            const active = rule.id === effectiveRule;
            const preview = options.find((o) => o.ruleId === rule.id);
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => onSelect(rule.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  active ? "bg-primary/5" : "hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="text-sm font-medium">
                    {t.ruleLabel[rule.id]}
                  </span>
                  <AccuracyBadge
                    accuracy={rule.accuracy}
                    withIcon={false}
                    className="ml-2 align-middle"
                  />
                </span>
                {hasContext && preview && (
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {preview.endLabel}
                  </span>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}

function HeuristicRow({
  title,
  desc,
  value,
  options,
  unit,
  onChange,
}: {
  title: string;
  desc: string;
  value: number;
  options: readonly number[];
  unit: (m: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                value === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              {unit(m)}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
