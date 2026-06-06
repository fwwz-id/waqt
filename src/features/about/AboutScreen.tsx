import type { ReactNode } from "react";
import { MoonStar, Telescope, Scale, CircleDashed, BookHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GitHub } from "@/components/icons/GitHub";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useT } from "@/hooks/useT";
import { APP_VERSION } from "@/lib/version";
import { MadhhabGuide } from "./MadhhabGuide";

export function AboutScreen() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-md px-4 pb-28 safe-top">
      <header className="pt-6 pb-2">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <MoonStar className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.about.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.about.subtitle}</p>
      </header>

      <InstallPrompt className="mt-4" />

      <Card className="mt-4">
        <CardContent className="space-y-3 p-5 text-sm leading-relaxed">
          <p>{t.about.p1}</p>
          <p>{t.about.p2}</p>
        </CardContent>
      </Card>

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
        <BookHeart className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium leading-relaxed">{t.about.p3}</p>
      </div>

      <section className="mt-6">
        <h2 className="mb-2.5 px-1 text-sm font-semibold text-muted-foreground">
          {t.about.accuracyMeaning}
        </h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <AccuracyRow
              icon={<Telescope className="h-4 w-4 text-sky-600" />}
              label={t.accuracy.labels.astronomical}
              desc={t.accuracy.descriptions.astronomical}
            />
            <AccuracyRow
              icon={<Scale className="h-4 w-4 text-emerald-600" />}
              label={t.accuracy.labels.fiqh_rule}
              desc={t.accuracy.descriptions.fiqh_rule}
            />
            <AccuracyRow
              icon={<CircleDashed className="h-4 w-4 text-amber-600" />}
              label={t.accuracy.labels.heuristic}
              desc={t.accuracy.descriptions.heuristic}
            />
          </CardContent>
        </Card>
      </section>

      <MadhhabGuide />

      <Separator className="my-6" />

      <div className="flex flex-col items-center gap-3 text-center text-xs text-muted-foreground">
        <a
          href="https://ko-fi.com/K3K61UWBII"
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <img
            height={36}
            style={{ border: 0, height: 36 }}
            src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
            alt="Buy Me a Coffee at ko-fi.com"
          />
        </a>
        <p>
          {t.about.version(APP_VERSION)} · {t.about.contact}{" "}
          <a
            href="mailto:hi@fwwz.space"
            className="font-medium text-primary underline"
          >
            hi@fwwz.space
          </a>
        </p>
        <a
          href="https://github.com/fwwz-id/waqt"
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
          aria-label="GitHub"
        >
          <GitHub className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}

function AccuracyRow({
  icon,
  label,
  desc,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
