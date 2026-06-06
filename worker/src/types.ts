export interface Env {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ALLOWED_ORIGIN: string;
}

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type UserSettingsPayload = {
  userId: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  madhhab: string;
  calculationMethod: string;
  notificationEnabled: boolean;
  atStart: boolean;
  beforeStartMinutes: number[];
  beforeEndMinutes: number[];
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};
