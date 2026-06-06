import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Compass,
  Calculator,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Pencil,
  Languages,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useSettings } from "@/app/SettingsContext";
import { useT } from "@/hooks/useT";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LocationPicker } from "@/features/onboarding/LocationPicker";
import { MadhhabSelect } from "./MadhhabSelect";
import { MethodSelect } from "./MethodSelect";
import { LanguageSelect } from "./LanguageSelect";
import { NotificationSettings } from "./NotificationSettings";
import { SettingsSection } from "./SettingsSection";
import { resolveAutoMethod } from "@/lib/prayer/methods";

export function SettingsScreen() {
  const {
    settings,
    setLocation,
    setMadhhab,
    setCalculationMethod,
    setAdvancedMode,
    resetAll,
  } = useSettings();
  const { t } = useT();
  const [locOpen, setLocOpen] = React.useState(false);

  const autoResolved =
    settings.calculationMethod === "auto"
      ? t.methodLabel[resolveAutoMethod(settings.location?.countryCode)]
      : null;

  return (
    <div className="mx-auto max-w-md px-4 pb-28 safe-top">
      <header className="pt-5 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t.settings.title}
        </h1>
      </header>

      <div className="space-y-6">
        <InstallPrompt />

        {/* Language */}
        <SettingsSection
          icon={<Languages className="h-4 w-4" />}
          title={t.settings.language}
        >
          <LanguageSelect />
        </SettingsSection>

        {/* Location */}
        <SettingsSection
          icon={<MapPin className="h-4 w-4" />}
          title={t.settings.location}
        >
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {settings.location?.label ?? t.settings.locationNotSet}
                </p>
                {settings.location && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {settings.location.lat.toFixed(3)},{" "}
                    {settings.location.lng.toFixed(3)}
                  </p>
                )}
              </div>
              <Dialog open={locOpen} onOpenChange={setLocOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4" />
                    {t.common.change}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.settings.changeLocationTitle}</DialogTitle>
                    <DialogDescription>
                      {t.settings.changeLocationDesc}
                    </DialogDescription>
                  </DialogHeader>
                  <LocationPicker
                    current={settings.location}
                    onSelect={(loc) => {
                      setLocation(loc);
                      setLocOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </SettingsSection>

        {/* Madhhab */}
        <SettingsSection
          icon={<Compass className="h-4 w-4" />}
          title={t.settings.madhhabProfile}
          desc={t.settings.madhhabDesc}
        >
          <MadhhabSelect value={settings.madhhab} onChange={setMadhhab} />
        </SettingsSection>

        {/* Method */}
        <SettingsSection
          icon={<Calculator className="h-4 w-4" />}
          title={t.settings.method}
          desc={autoResolved ? t.settings.methodAutoUses(autoResolved) : undefined}
        >
          <MethodSelect
            value={settings.calculationMethod}
            onChange={setCalculationMethod}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={<Bell className="h-4 w-4" />}
          title={t.settings.notifications}
        >
          <NotificationSettings />
        </SettingsSection>

        {/* Advanced */}
        <SettingsSection
          icon={<SlidersHorizontal className="h-4 w-4" />}
          title={t.settings.advancedMode}
        >
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{t.settings.enableAdvanced}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.enableAdvancedDesc}
                  </p>
                </div>
                <Switch
                  checked={settings.advancedMode}
                  onCheckedChange={setAdvancedMode}
                />
              </div>
              {settings.advancedMode && (
                <>
                  <Separator />
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/settings/fiqh">
                      {t.settings.configureEndRules}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </SettingsSection>

        {/* Reset */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-destructive">
              <RotateCcw className="h-4 w-4" />
              {t.settings.resetAll}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.settings.resetTitle}</DialogTitle>
              <DialogDescription>{t.settings.resetBody}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">{t.common.cancel}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={resetAll}>
                  {t.common.reset}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
