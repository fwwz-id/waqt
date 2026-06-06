import type { LocationConfig } from "@/types";
import { deviceTimeZone } from "./geolocation";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

/** Lightweight raw shape we care about from Nominatim responses. */
type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

export type CitySearchResult = {
  id: string;
  label: string;
  city?: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lng: number;
};

function pickCity(addr?: NominatimAddress): string | undefined {
  return (
    addr?.city ??
    addr?.town ??
    addr?.village ??
    addr?.municipality ??
    addr?.county ??
    addr?.state
  );
}

function shortLabel(addr: NominatimAddress | undefined, fallback: string): string {
  const city = pickCity(addr);
  const country = addr?.country;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  // Trim an overly long display_name to the first two comma parts.
  return fallback.split(",").slice(0, 2).join(",").trim();
}

async function nominatimFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      // Nominatim usage policy asks for an identifying UA / referrer.
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Nominatim error ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Free-text city search. Returns a small, UI-friendly result list. */
export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<CitySearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    limit: "8",
    "accept-language": "id",
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  const data = (await res.json()) as NominatimResult[];

  return data.map((r, i) => ({
    id: `${r.lat},${r.lon},${i}`,
    label: shortLabel(r.address, r.display_name),
    city: pickCity(r.address),
    country: r.address?.country,
    countryCode: r.address?.country_code?.toUpperCase(),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

/** Reverse geocode coordinates into a LocationConfig. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<LocationConfig> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "id",
  });

  try {
    const r = await nominatimFetch<NominatimResult>(
      `/reverse?${params.toString()}`,
    );
    return {
      label: shortLabel(r.address, r.display_name),
      city: pickCity(r.address),
      country: r.address?.country,
      countryCode: r.address?.country_code?.toUpperCase(),
      lat,
      lng,
      timezone: deviceTimeZone(),
    };
  } catch {
    // Reverse geocoding failed (offline / rate limit) — still usable with a
    // generic label and raw coordinates.
    return {
      label: `Lokasi (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      lat,
      lng,
      timezone: deviceTimeZone(),
    };
  }
}

export function searchResultToLocation(r: CitySearchResult): LocationConfig {
  return {
    label: r.label,
    city: r.city,
    country: r.country,
    countryCode: r.countryCode,
    lat: r.lat,
    lng: r.lng,
    timezone: deviceTimeZone(),
  };
}
