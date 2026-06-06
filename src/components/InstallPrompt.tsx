import { Download, Share } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

/**
 * Install-to-home-screen prompt. Self-hides when the app is already installed
 * or the browser can't install it. iOS Safari has no install API, so we show
 * the Share → Add to Home Screen instruction instead of a button.
 */
export function InstallPrompt({ className }: { className?: string }) {
  const { t } = useT();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();

  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t.install.title}</p>
          <p className="text-xs leading-snug text-muted-foreground">
            {isIOS ? t.install.iosSteps : t.install.description}
          </p>
        </div>
        {canInstall ? (
          <Button size="sm" onClick={() => promptInstall()}>
            <Download className="h-4 w-4" />
            {t.install.button}
          </Button>
        ) : (
          <Share className="h-5 w-5 shrink-0 text-primary" />
        )}
      </CardContent>
    </Card>
  );
}
