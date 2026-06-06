let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

/** Register and activate the SW as early as possible (before any push toggle). */
export function warmServiceWorkerRegistration(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (registrationPromise) return;

  registrationPromise = (async () => {
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }
    if (!reg.active) {
      await navigator.serviceWorker.ready;
    }
    return reg;
  })();
}

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  warmServiceWorkerRegistration();
  if (!registrationPromise) {
    return Promise.reject(new Error("Service workers unsupported"));
  }
  return registrationPromise;
}
