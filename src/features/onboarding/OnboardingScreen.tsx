import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, MoonStar, Compass, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/app/SettingsContext";
import { useT } from "@/hooks/useT";
import { LocationPicker } from "./LocationPicker";
import { MadhhabSelect } from "@/features/settings/MadhhabSelect";
import { MethodSelect } from "@/features/settings/MethodSelect";
import { LanguageSelect } from "@/features/settings/LanguageSelect";
import { resolveAutoMethod } from "@/lib/prayer/methods";

type Step = 0 | 1 | 2;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { t } = useT();
  const {
    settings,
    setLocation,
    setMadhhab,
    setCalculationMethod,
  } = useSettings();
  const [step, setStep] = React.useState<Step>(0);

  const autoResolved =
    settings.calculationMethod === "auto"
      ? t.methodLabel[resolveAutoMethod(settings.location?.countryCode)]
      : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 safe-top">
      <header className="pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <MoonStar className="h-6 w-6 text-primary" />
          </div>
          <LanguageSelect compact />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Waktu Sholat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.onboarding.appSubtitle}
        </p>
      </header>

      <Stepper step={step} />

      <div className="mt-6 flex-1">
        {step === 0 && (
          <section className="space-y-4">
            <StepHeading
              icon={<MapPin className="h-5 w-5 text-primary" />}
              title={t.onboarding.locTitle}
              subtitle={t.onboarding.locSubtitle}
            />
            <LocationPicker
              current={settings.location}
              onSelect={setLocation}
            />
            {settings.location && (
              <Alert variant="success">
                <Check className="h-4 w-4" />
                <AlertDescription>
                  {t.onboarding.locationSet(settings.location.label)}
                </AlertDescription>
              </Alert>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <StepHeading
              icon={<Compass className="h-5 w-5 text-primary" />}
              title={t.onboarding.madhhabTitle}
              subtitle={t.onboarding.madhhabSubtitle}
            />
            <MadhhabSelect value={settings.madhhab} onChange={setMadhhab} />
            <p className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              {t.onboarding.asrNote}
            </p>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <StepHeading
              icon={<MoonStar className="h-5 w-5 text-primary" />}
              title={t.onboarding.methodTitle}
              subtitle={t.onboarding.methodSubtitle}
            />
            <MethodSelect
              value={settings.calculationMethod}
              onChange={setCalculationMethod}
            />
            {autoResolved && (
              <Card className="bg-muted/40">
                <CardContent className="p-4 text-xs text-muted-foreground">
                  {t.onboarding.autoUses(autoResolved)}
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </div>

      <footer className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <Button
            variant="ghost"
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            {t.common.back}
          </Button>
        )}
        <div className="flex-1" />
        {step < 2 ? (
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={step === 0 && !settings.location}
          >
            {t.common.next}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => navigate({ to: "/" })}>
            {t.common.finish}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </footer>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={
            "h-1.5 flex-1 rounded-full transition-colors " +
            (i <= step ? "bg-primary" : "bg-muted")
          }
        />
      ))}
    </div>
  );
}

function StepHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
