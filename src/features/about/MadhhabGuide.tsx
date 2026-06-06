import { ChevronRight, Info, Sun, Hourglass, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MADHHAB_LIST } from "@/lib/prayer/fiqhProfiles";
import { useT } from "@/hooks/useT";
import type { Madhhab } from "@/types";

export function MadhhabGuide() {
  const { t } = useT();
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 px-1 text-sm font-semibold text-muted-foreground">
        {t.about.howItWorks}
      </h2>
      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.madhhabGuide.intro}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {MADHHAB_LIST.map((p) => (
              <MadhhabDrawer key={p.id} id={p.id} label={p.label} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MadhhabDrawer({ id, label }: { id: Madhhab; label: string }) {
  const { t } = useT();
  const g = t.madhhabGuide;
  const item = g.items[id];

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:bg-accent"
        >
          <span className="font-semibold">{label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription>{t.madhhabDesc[id]}</DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-5 pb-8">
          {/* Asr start */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sun className="h-3.5 w-3.5" />
              {g.asrLabel}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{item.asr}</p>
          </div>

          {/* End-time rules */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Hourglass className="h-3.5 w-3.5" />
              {g.endLabel}
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed">
              {item.ends.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reference */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              {g.referenceLabel}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.reference}
            </p>
          </div>

          <Alert
            variant="warning"
            className="flex items-center gap-2.5 [&>svg]:static [&>svg~*]:pl-0"
          >
            <Info className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs leading-snug">
              {g.disclaimer}
            </AlertDescription>
          </Alert>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
