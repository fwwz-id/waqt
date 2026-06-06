import type { AppSettings } from "@/types";
import { getUserId } from "@/lib/storage/settingsStorage";

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushConfig = {
  vapidPublicKey: string;
};

export function getPushApiUrl(): string | undefined {
  const url = import.meta.env.VITE_PUSH_API_URL?.trim();
  return url || undefined;
}

export async function fetchPushConfig(
  apiUrl: string,
): Promise<PushConfig | null> {
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/config`);
    if (!res.ok) return null;
    const data = (await res.json()) as { vapidPublicKey?: string };
    if (!data.vapidPublicKey) return null;
    return { vapidPublicKey: data.vapidPublicKey };
  } catch {
    return null;
  }
}

export async function registerPushSubscription(
  apiUrl: string,
  subscription: PushSubscriptionJSON,
): Promise<boolean> {
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: getUserId(), subscription }),
  });
  return res.ok;
}

export async function unregisterPushSubscription(
  apiUrl: string,
  endpoint: string,
): Promise<void> {
  await fetch(`${apiUrl.replace(/\/$/, "")}/api/subscriptions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

export function buildPushSettingsPayload(settings: AppSettings) {
  const loc = settings.location;
  if (!loc) return null;

  return {
    userId: getUserId(),
    lat: loc.lat,
    lng: loc.lng,
    city: loc.city,
    country: loc.country,
    countryCode: loc.countryCode,
    timezone: loc.timezone,
    madhhab: settings.madhhab,
    calculationMethod: settings.calculationMethod,
    notificationEnabled: settings.notifications.enabled,
    atStart: settings.notifications.atStart,
    beforeStartMinutes: settings.notifications.beforeStartMinutes,
    beforeEndMinutes: settings.notifications.beforeEndMinutes,
  };
}

export async function syncPushSettings(
  apiUrl: string,
  settings: AppSettings,
): Promise<boolean> {
  const payload = buildPushSettingsPayload(settings);
  if (!payload) return false;

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
