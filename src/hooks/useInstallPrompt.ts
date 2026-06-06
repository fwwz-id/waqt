import * as React from "react";

/** The non-standard event Chromium fires when the PWA is installable. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState = {
  /** A native install prompt is available (Chromium-based browsers). */
  canInstall: boolean;
  /** Already running as an installed app (standalone display mode). */
  isInstalled: boolean;
  /** iOS Safari, which installs only via the Share → Add to Home Screen flow. */
  isIOS: boolean;
  /** Trigger the native prompt; resolves with the user's choice. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag when launched from home screen.
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ masquerades as macOS; detect via touch points instead.
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return (iOSDevice || iPadOS) && !isStandalone();
}

export function useInstallPrompt(): InstallState {
  const deferredRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(isStandalone);

  React.useEffect(() => {
    const onPrompt = (e: Event) => {
      // Stop Chrome's mini-infobar so we can present our own button instead.
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => setIsInstalled(isStandalone());
    mq.addEventListener?.("change", onDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    const e = deferredRef.current;
    if (!e) return "unavailable" as const;
    await e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      deferredRef.current = null;
    }
    return outcome;
  }, []);

  return { canInstall, isInstalled, isIOS: detectIOS(), promptInstall };
}
