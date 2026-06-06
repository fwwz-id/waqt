export type GeoCoords = { lat: number; lng: number };

export type GeoErrorKind =
  | "unsupported"
  | "permission_denied"
  | "unavailable"
  | "timeout";

export class GeolocationError extends Error {
  kind: GeoErrorKind;
  constructor(kind: GeoErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "GeolocationError";
  }
}

const MESSAGES: Record<GeoErrorKind, string> = {
  unsupported: "Perangkat ini tidak mendukung deteksi lokasi.",
  permission_denied:
    "Izin lokasi ditolak. Anda bisa mencari kota secara manual.",
  unavailable: "Lokasi tidak tersedia saat ini. Coba lagi atau cari manual.",
  timeout: "Deteksi lokasi terlalu lama. Coba lagi atau cari manual.",
};

/** Resolve the device's current coordinates via the browser Geolocation API. */
export function getCurrentCoords(timeoutMs = 12_000): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeolocationError("unsupported", MESSAGES.unsupported));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const kind: GeoErrorKind =
          err.code === err.PERMISSION_DENIED
            ? "permission_denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable";
        reject(new GeolocationError(kind, MESSAGES[kind]));
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

/** Best-effort device timezone (used when reverse geocoding lacks one). */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
