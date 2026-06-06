import {
  CalculationMethod as AdhanMethod,
  CalculationParameters,
  Madhab as AdhanMadhab,
  HighLatitudeRule,
} from "adhan";
import type { CalculationMethod, Madhhab } from "@/types";

export type MethodOption = {
  id: CalculationMethod;
  label: string;
  /** Short Bahasa Indonesia description shown in settings. */
  description: string;
};

/** Order shown in the settings selector. */
export const METHOD_OPTIONS: MethodOption[] = [
  {
    id: "auto",
    label: "Otomatis (berdasarkan negara)",
    description: "Pilih metode yang umum dipakai di negara lokasi Anda.",
  },
  {
    id: "kemenag_id",
    label: "Kemenag Indonesia",
    description: "Pendekatan Kementerian Agama RI (Subuh 20°, Isya 18°).",
  },
  {
    id: "umm_al_qura",
    label: "Umm Al-Qura (Makkah)",
    description: "Dipakai di Arab Saudi.",
  },
  {
    id: "muslim_world_league",
    label: "Muslim World League",
    description: "Standar internasional yang umum.",
  },
  { id: "isna", label: "ISNA (Amerika Utara)", description: "Subuh & Isya 15°." },
  { id: "egypt", label: "Egyptian General Authority", description: "Subuh 19.5°, Isya 17.5°." },
  { id: "dubai", label: "Dubai", description: "Subuh & Isya 18.2°." },
  { id: "kuwait", label: "Kuwait", description: "Subuh 18°, Isya 17.5°." },
  { id: "qatar", label: "Qatar", description: "Subuh 18°, Isya 90 menit." },
  { id: "turkey", label: "Turki (Diyanet)", description: "Subuh & Isya 18°." },
  { id: "singapore", label: "Singapura (MUIS)", description: "Subuh & Isya 20°." },
  {
    id: "moonsighting_committee",
    label: "Moonsighting Committee",
    description: "Dengan penyesuaian musim untuk lintang tinggi.",
  },
];

/**
 * Custom approximation of the Indonesian Ministry of Religious Affairs
 * (Kemenag) since adhan-js has no exact preset. Kemenag commonly uses
 * Fajr 20°, Isha 18°.
 */
function kemenagParameters(): CalculationParameters {
  const params = AdhanMethod.Other();
  params.fajrAngle = 20;
  params.ishaAngle = 18;
  return params;
}

/**
 * Resolve "auto" to a concrete method id based on country code.
 * - ID  -> Kemenag
 * - SA  -> Umm Al-Qura
 * - SG  -> Singapore (MUIS)
 * - EG  -> Egypt
 * - TR  -> Turkey
 * - AE  -> Dubai
 * - KW  -> Kuwait
 * - QA  -> Qatar
 * - US/CA -> ISNA
 * - else -> Muslim World League
 */
export function resolveAutoMethod(
  countryCode?: string,
): Exclude<CalculationMethod, "auto"> {
  switch ((countryCode ?? "").toUpperCase()) {
    case "ID":
      return "kemenag_id";
    case "SA":
      return "umm_al_qura";
    case "SG":
      return "singapore";
    case "EG":
      return "egypt";
    case "TR":
      return "turkey";
    case "AE":
      return "dubai";
    case "KW":
      return "kuwait";
    case "QA":
      return "qatar";
    case "US":
    case "CA":
      return "isna";
    default:
      return "muslim_world_league";
  }
}

/** Build adhan CalculationParameters for a resolved (non-auto) method. */
function baseParameters(
  method: Exclude<CalculationMethod, "auto">,
): CalculationParameters {
  switch (method) {
    case "kemenag_id":
      return kemenagParameters();
    case "umm_al_qura":
      return AdhanMethod.UmmAlQura();
    case "isna":
      return AdhanMethod.NorthAmerica();
    case "egypt":
      return AdhanMethod.Egyptian();
    case "dubai":
      return AdhanMethod.Dubai();
    case "kuwait":
      return AdhanMethod.Kuwait();
    case "qatar":
      return AdhanMethod.Qatar();
    case "turkey":
      return AdhanMethod.Turkey();
    case "singapore":
      return AdhanMethod.Singapore();
    case "moonsighting_committee":
      return AdhanMethod.MoonsightingCommittee();
    case "muslim_world_league":
    default:
      return AdhanMethod.MuslimWorldLeague();
  }
}

/**
 * Produce fully-resolved adhan parameters for a given method + madhhab.
 * The madhhab only affects Asr shadow factor here (Hanafi = 2x).
 */
export function buildCalculationParameters(
  method: CalculationMethod,
  madhhab: Madhhab,
  countryCode?: string,
): { params: CalculationParameters; resolvedMethod: Exclude<CalculationMethod, "auto"> } {
  const resolvedMethod =
    method === "auto" ? resolveAutoMethod(countryCode) : method;
  const params = baseParameters(resolvedMethod);

  // Hanafi uses shadow factor 2 for Asr; everyone else uses 1.
  params.madhab = madhhab === "hanafi" ? AdhanMadhab.Hanafi : AdhanMadhab.Shafi;

  // Sensible default for high latitudes so Isha/Fajr never go undefined.
  params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

  return { params, resolvedMethod };
}

export function methodLabel(method: CalculationMethod): string {
  return METHOD_OPTIONS.find((m) => m.id === method)?.label ?? method;
}
