import type {
  CalculationMethod,
  Madhhab,
  PrayerName,
  PrayerStatus,
  RuleAccuracy,
  RuleId,
} from "@/types";

export type Language = "id" | "en";

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "id", label: "Bahasa Indonesia" },
  { id: "en", label: "English" },
];

/** Intl locale tag for a UI language. */
export function localeFor(lang: Language): string {
  return lang === "en" ? "en-US" : "id-ID";
}

// ---------------------------------------------------------------------------
// Indonesian dictionary is the source of truth. `type Messages = typeof id`
// is derived from it, so the English dictionary is forced by the compiler to
// implement exactly the same shape (no missing or stray keys).
// ---------------------------------------------------------------------------
const id = {
  nav: { home: "Beranda", settings: "Pengaturan", about: "Tentang" },

  common: {
    back: "Kembali",
    next: "Lanjut",
    finish: "Selesai",
    cancel: "Batal",
    change: "Ubah",
    reset: "Reset",
    allow: "Izinkan",
    or: "atau cari kota",
    used: "dipakai",
  },

  install: {
    title: "Pasang aplikasi",
    description:
      "Pasang Waqt ke layar utama untuk akses cepat dan tampilan penuh.",
    button: "Pasang",
    iosSteps:
      "Buka menu Bagikan di Safari, lalu pilih “Tambahkan ke Layar Utama”.",
  },

  prayers: {
    fajr: "Subuh",
    dhuhr: "Dzuhur",
    asr: "Ashar",
    maghrib: "Maghrib",
    isha: "Isya",
  } as Record<PrayerName, string>,

  status: {
    upcoming: "Akan datang",
    active: "Sedang berlangsung",
    ending_soon: "Hampir berakhir",
    ended: "Telah lewat",
  } as Record<PrayerStatus, string>,

  accuracy: {
    labels: {
      astronomical: "Astronomis",
      fiqh_rule: "Fikih",
      heuristic: "Estimasi",
    } as Record<RuleAccuracy, string>,
    descriptions: {
      astronomical:
        "Dihitung secara astronomis (posisi matahari). Paling presisi untuk perangkat.",
      fiqh_rule:
        "Mengikuti aturan fikih dari profil madzhab yang dipilih, dihitung dari waktu astronomis.",
      heuristic:
        "Perkiraan, karena tanda alamnya tidak bisa dihitung persis oleh perangkat.",
    } as Record<RuleAccuracy, string>,
  },

  onboarding: {
    appSubtitle:
      "Pengingat waktu sholat berbasis lokasi, madzhab, dan estimasi akhir waktu.",
    locTitle: "Tentukan lokasi",
    locSubtitle:
      "Untuk menghitung waktu sholat secara lokal di perangkat Anda.",
    locationSet: (label: string) => `Lokasi: ${label}`,
    madhhabTitle: "Pilih profil madzhab",
    madhhabSubtitle: "Memengaruhi awal Ashar dan estimasi batas akhir waktu.",
    asrNote:
      "Perbedaan utama awal Ashar: Hanafi menggunakan bayangan 2x, sedangkan mayoritas madzhab menggunakan bayangan 1x.",
    methodTitle: "Metode perhitungan",
    methodSubtitle:
      "Pilih otomatis, atau sesuaikan dengan otoritas di wilayah Anda.",
    autoUses: (method: string) =>
      `Mode otomatis memilih ${method} untuk lokasi Anda.`,
  },

  location: {
    useCurrent: "Gunakan lokasi saat ini",
    searchPlaceholder: "Contoh: Jakarta, Surabaya, Makkah…",
    gpsFallback:
      "Gagal mendapatkan lokasi. Coba cari kota secara manual.",
    searchFailed:
      "Pencarian kota gagal. Periksa koneksi internet, atau gunakan lokasi GPS.",
    noResults: (q: string) => `Tidak ada hasil untuk "${q}".`,
    geo: {
      unsupported: "Perangkat ini tidak mendukung deteksi lokasi.",
      permission_denied:
        "Izin lokasi ditolak. Anda bisa mencari kota secara manual.",
      unavailable:
        "Lokasi tidak tersedia saat ini. Coba lagi atau cari manual.",
      timeout: "Deteksi lokasi terlalu lama. Coba lagi atau cari manual.",
    },
  },

  dashboard: {
    setLocation: "Atur lokasi",
    todaySchedule: "Jadwal hari ini",
    sunrise: "Terbit matahari",
    errorTitle: "Belum bisa menampilkan waktu",
    openSettings: "Buka pengaturan",
    highLat:
      "Lokasi Anda berada di lintang tinggi. Waktu Subuh dan Isya bisa kurang presisi dan menggunakan aturan pertengahan malam.",
    enableTitle: "Aktifkan pengingat",
    enableBody: "Dapatkan pengingat awal & estimasi akhir waktu sholat.",
    setupNotif: "Atur notifikasi",
  },

  hero: {
    nowIn: (prayer: string) => `Sekarang dalam waktu ${prayer}`,
    towards: (prayer: string) => `Menuju waktu ${prayer}`,
    remaining: "Sisa waktu",
    willEnterIn: "Akan masuk dalam",
    remainingAbout: (dur: string) => `Sisa waktu sekitar ${dur}`,
    startIn: (dur: string) => `Mulai dalam ${dur}`,
    start: "Mulai",
    end: "Akhir",
    detail: "Detail",
  },

  detail: {
    willEnterIn: "Akan masuk dalam",
    remaining: "Sisa waktu",
    aboutMore: (dur: string) => `Sekitar ${dur} lagi`,
    startAt: (label: string) => `Mulai ${label}`,
    startTime: "Awal waktu",
    endEstimate: "Estimasi akhir",
    explanationTitle: "Penjelasan waktu",
    explainBtn: "Jelaskan waktu ini",
    endEstimateFor: (prayer: string) => `Estimasi akhir waktu ${prayer}`,
    basedOnProfile: (profile: string) => `Berdasarkan profil ${profile}`,
    otherOpinions: "Pendapat lain untuk akhir waktu",
    changeRulePrompt: "Ingin mengubah aturan akhir waktu?",
    openAdvanced: "Buka mode lanjutan",
    notAvailable: "Data waktu sholat tidak tersedia.",
  },

  settings: {
    title: "Pengaturan",
    location: "Lokasi",
    locationNotSet: "Belum diatur",
    madhhabProfile: "Profil madzhab",
    madhhabDesc: "Memengaruhi awal Ashar dan estimasi batas akhir waktu.",
    method: "Metode perhitungan",
    methodAutoUses: (m: string) => `Mode otomatis memakai ${m}.`,
    notifications: "Notifikasi",
    language: "Bahasa",
    advancedMode: "Mode lanjutan",
    enableAdvanced: "Aktifkan mode lanjutan",
    enableAdvancedDesc: "Atur sendiri aturan akhir waktu tiap sholat.",
    configureEndRules: "Atur aturan akhir waktu",
    changeLocationTitle: "Ubah lokasi",
    changeLocationDesc: "Gunakan GPS atau cari kota Anda.",
    resetAll: "Reset semua pengaturan",
    resetTitle: "Reset pengaturan?",
    resetBody:
      "Semua pengaturan termasuk lokasi akan dikembalikan ke awal. Tindakan ini tidak dapat dibatalkan.",
  },

  notif: {
    reminderTitle: "Pengingat waktu sholat",
    reminderDesc: "Pengingat awal & estimasi akhir waktu.",
    atStart: "Saat waktu masuk",
    atStartDesc: "Notifikasi tepat di awal waktu sholat.",
    beforeStart: "Sebelum waktu masuk",
    beforeStartDesc: "Ingatkan beberapa menit sebelum awal waktu.",
    beforeEnd: "Sebelum estimasi akhir",
    beforeEndDesc: "Ingatkan menjelang batas akhir waktu (estimasi profil).",
    minutes: (m: number) => `${m} menit`,
    unsupportedTitle: "Notifikasi tidak didukung",
    unsupportedBody:
      "Browser atau perangkat ini tidak mendukung notifikasi web. Anda tetap bisa melihat jadwal dan estimasi akhir waktu di dalam aplikasi.",
    deniedBody:
      "Izin notifikasi diblokir. Aktifkan kembali melalui pengaturan browser untuk situs ini.",
    webLimitation:
      "Pengingat paling andal saat aplikasi sedang dibuka. Kalau aplikasi ditutup, pengingat kadang tidak muncul tepat waktu.",
    pushEnabled:
      "Pengingat tetap muncul walau aplikasi sedang ditutup.",
    pushRegisterFailed:
      "Gagal mendaftarkan push ke server. Matikan lalu nyalakan lagi, atau tutup dan buka ulang aplikasi dari layar utama (PWA).",
    enabledTitle: "Notifikasi diaktifkan",
    enabledBody: "Kami akan kasih notifikasi kalo sesuai pengaturan kamu ya.",
    scheduled: (n: number) => `Hari ini ada ${n} pengingat.`,
    troubleshoot: {
      trigger: "Notifikasi tidak muncul?",
      title: "Notifikasi tidak muncul?",
      intro: "Coba langkah berikut satu per satu.",
      steps: [
        {
          title: "Izinkan notifikasi",
          body: "Pastikan kamu menekan Izinkan saat diminta. Kalau dulu pernah diblokir, ubah lewat pengaturan situs di browser, lalu buka ulang halaman ini.",
        },
        {
          title: "Pakai Brave?",
          body: "Brave mematikan layanan push bawaan. Buka pengaturan Brave, nyalakan 'Use Google services for push messaging', lalu buka ulang Brave.",
        },
        {
          title: "Pengguna iPhone",
          body: "Notifikasi cuma jalan kalau aplikasi sudah dipasang ke layar utama. Buka aplikasi lewat ikon di layar utama, bukan dari Safari.",
        },
        {
          title: "Masih belum muncul",
          body: "Matikan lalu nyalakan lagi sakelarnya, atau tutup dan buka ulang aplikasinya. Browser seperti Chrome biasanya paling lancar.",
        },
      ],
    },
  },

  fiqh: {
    title: "Aturan akhir waktu",
    subtitle: (profile: string) => `Mode lanjutan · profil ${profile}`,
    backToProfile: "Kembali ke profil",
    endOf: (prayer: string) => `Akhir ${prayer}`,
    info:
      "Setiap aturan ditandai sebagai Astronomis, Fikih, atau Estimasi. Pengaturan ini mengikuti pendapat mayoritas dalam profil yang dipilih dan sebagian hanya berupa perkiraan, bukan rujukan fikih final.",
    adjustments: "Penyesuaian estimasi",
    shortMaghribTitle: "Estimasi singkat Maghrib",
    shortMaghribDesc:
      "Menit setelah terbenam (untuk aturan estimasi singkat).",
    yellowingTitle: "Matahari menguning",
    yellowingDesc:
      "Menit sebelum Maghrib untuk estimasi akhir Ashar utama.",
    isfarTitle: "Isfar (Subuh)",
    isfarDesc: "Menit sebelum terbit untuk estimasi akhir Subuh utama.",
  },

  about: {
    title: "Tentang Waqt",
    subtitle:
      "Pengingat waktu sholat berbasis lokasi, madzhab, dan estimasi akhir waktu.",
    p1: "Aplikasi ini membantu mengingatkan waktu sholat berdasarkan perhitungan astronomis dan profil fikih yang dipilih. Tidak hanya awal waktu, tetapi juga estimasi batas akhir waktu dan sisa waktu.",
    p2: "Beberapa batas akhir waktu hanya berupa perkiraan, karena tidak semua tanda alam bisa dihitung persis oleh perangkat.",
    p3: "Aplikasi ini bukan pengganti rujukan fikih atau bimbingan guru.",
    accuracyMeaning: "Arti label akurasi",
    howItWorks: "Cara kerja tiap madzhab",
    version: (v: string) => `Versi ${v}`,
    contact: "Kontak",
  },

  madhhabGuide: {
    intro:
      "Awal waktu sholat dihitung secara astronomis dari posisi matahari, dan sama untuk semua madzhab. Yang berbeda terutama awal Ashar dan estimasi batas akhir tiap waktu. Ketuk salah satu madzhab untuk melihat detailnya.",
    asrLabel: "Awal Ashar",
    endLabel: "Batas akhir waktu",
    referenceLabel: "Dasar",
    disclaimer:
      "Ringkasan ini disederhanakan dan mengikuti pendapat mayoritas tiap madzhab. Untuk pembahasan lengkap, rujuk kitab fikih atau guru Anda.",
    items: {
      syafii: {
        asr: "Dimulai saat panjang bayangan benda sama dengan tinggi bendanya (bayangan 1x).",
        ends: [
          "Subuh berakhir saat matahari terbit.",
          "Dzuhur berakhir saat masuk waktu Ashar.",
          "Ashar berakhir saat masuk waktu Maghrib.",
          "Maghrib: profil ini memakai perkiraan rentang singkat setelah terbenam. (Pendapat lain: sampai masuk Isya.)",
          "Isya berakhir di tengah malam (titik tengah antara Maghrib dan Subuh).",
        ],
        reference:
          "Waktu sholat berdasarkan hadits Jibril (HR. Tirmidzi & Abu Dawud) dan hadits batas waktu sholat (HR. Muslim). Perbedaan rincian batas akhir berasal dari ijtihad ulama madzhab ini.",
      },
      hanafi: {
        asr: "Dimulai lebih lambat, saat panjang bayangan benda dua kali tinggi bendanya (bayangan 2x).",
        ends: [
          "Subuh berakhir saat matahari terbit.",
          "Dzuhur berakhir saat masuk waktu Ashar.",
          "Ashar berakhir saat masuk waktu Maghrib.",
          "Maghrib berakhir saat masuk waktu Isya (hilangnya mega merah).",
          "Isya berakhir saat masuk waktu Subuh esok hari.",
        ],
        reference:
          "Waktu sholat berdasarkan hadits Jibril (HR. Tirmidzi & Abu Dawud) dan hadits batas waktu sholat (HR. Muslim). Perbedaan rincian batas akhir berasal dari ijtihad ulama madzhab ini.",
      },
      maliki: {
        asr: "Dimulai saat panjang bayangan benda sama dengan tinggi bendanya (bayangan 1x).",
        ends: [
          "Subuh berakhir saat matahari terbit.",
          "Dzuhur berakhir saat masuk waktu Ashar.",
          "Ashar berakhir saat masuk waktu Maghrib.",
          "Maghrib berakhir saat masuk waktu Isya.",
          "Isya berakhir pada sepertiga malam pertama.",
        ],
        reference:
          "Waktu sholat berdasarkan hadits Jibril (HR. Tirmidzi & Abu Dawud) dan hadits batas waktu sholat (HR. Muslim). Perbedaan rincian batas akhir berasal dari ijtihad ulama madzhab ini.",
      },
      hanbali: {
        asr: "Dimulai saat panjang bayangan benda sama dengan tinggi bendanya (bayangan 1x).",
        ends: [
          "Subuh berakhir saat matahari terbit.",
          "Dzuhur berakhir saat masuk waktu Ashar.",
          "Ashar berakhir saat masuk waktu Maghrib.",
          "Maghrib berakhir saat masuk waktu Isya.",
          "Isya berakhir di tengah malam.",
        ],
        reference:
          "Waktu sholat berdasarkan hadits Jibril (HR. Tirmidzi & Abu Dawud) dan hadits batas waktu sholat (HR. Muslim). Perbedaan rincian batas akhir berasal dari ijtihad ulama madzhab ini.",
      },
    } as Record<Madhhab, { asr: string; ends: string[]; reference: string }>,
  },

  madhhabDesc: {
    syafii:
      "Mayoritas di Indonesia. Awal Ashar memakai bayangan 1x. Akhir Isya hingga tengah malam.",
    hanafi:
      "Awal Ashar memakai bayangan 2x. Akhir Maghrib hingga Isya, akhir Isya hingga Subuh.",
    maliki:
      "Awal Ashar memakai bayangan 1x. Akhir Isya hingga sepertiga malam.",
    hanbali:
      "Awal Ashar memakai bayangan 1x. Akhir Isya hingga tengah malam.",
  } as Record<Madhhab, string>,

  methodLabel: {
    auto: "Otomatis (berdasarkan negara)",
    kemenag_id: "Kemenag Indonesia",
    umm_al_qura: "Umm Al-Qura (Makkah)",
    muslim_world_league: "Muslim World League",
    isna: "ISNA (Amerika Utara)",
    egypt: "Egyptian General Authority",
    dubai: "Dubai",
    kuwait: "Kuwait",
    qatar: "Qatar",
    turkey: "Turki (Diyanet)",
    singapore: "Singapura (MUIS)",
    moonsighting_committee: "Moonsighting Committee",
  } as Record<CalculationMethod, string>,

  methodDesc: {
    auto: "Pilih metode yang umum dipakai di negara lokasi Anda.",
    kemenag_id: "Pendekatan Kementerian Agama RI (Subuh 20°, Isya 18°).",
    umm_al_qura: "Dipakai di Arab Saudi.",
    muslim_world_league: "Standar internasional yang umum.",
    isna: "Subuh & Isya 15°.",
    egypt: "Subuh 19.5°, Isya 17.5°.",
    dubai: "Subuh & Isya 18.2°.",
    kuwait: "Subuh 18°, Isya 17.5°.",
    qatar: "Subuh 18°, Isya 90 menit.",
    turkey: "Subuh & Isya 18°.",
    singapore: "Subuh & Isya 20°.",
    moonsighting_committee: "Dengan penyesuaian musim untuk lintang tinggi.",
  } as Record<CalculationMethod, string>,

  ruleLabel: {
    next_prayer: "Sampai waktu sholat berikutnya",
    sunrise: "Sampai terbit matahari",
    maghrib: "Sampai Maghrib",
    isha_start: "Sampai Isya",
    short_maghrib_window: "Estimasi singkat (menit dari Maghrib)",
    one_third_night: "Sepertiga malam",
    half_night: "Setengah malam (tengah malam syar'i)",
    fajr_next_day: "Sampai Subuh esok hari",
    asr_shadow_2x_heuristic: "Bayangan 2x (pendekatan Hanafi)",
    yellowing_sun_heuristic: "Estimasi matahari menguning",
    isfar_heuristic: "Estimasi isfar (langit terang)",
  } as Record<RuleId, string>,

  ruleExplain: {
    next_prayer: (p: { time: string }) =>
      `Waktu berakhir saat masuk waktu sholat berikutnya, yaitu sekitar ${p.time}.`,
    sunrise: (p: { time: string }) =>
      `Akhir waktu Subuh dihitung sampai matahari terbit pada ${p.time}. Ini adalah perhitungan astronomis.`,
    maghrib: (p: { time: string }) =>
      `Akhir waktu Ashar dihitung sampai masuk waktu Maghrib pada ${p.time} (terbenam matahari).`,
    isha_start: (p: { time: string }) =>
      `Akhir waktu Maghrib dihitung sampai masuk waktu Isya pada ${p.time}.`,
    short_maghrib_window: (p: { minutes: number; time: string }) =>
      `Akhir Maghrib ini memakai estimasi singkat, sekitar ${p.minutes} menit setelah matahari terbenam (kira-kira ${p.time}). Ini perkiraan untuk berjaga-jaga, bukan batas pasti.`,
    one_third_night: (p: { maghrib: string; time: string }) =>
      `Akhir Isya dihitung sampai sepertiga malam, yaitu titik sepertiga antara Maghrib (${p.maghrib}) dan Subuh esok hari, sekitar ${p.time}.`,
    half_night: (p: { maghrib: string; time: string }) =>
      `Akhir Isya dihitung sampai setengah malam, yaitu titik tengah antara Maghrib (${p.maghrib}) dan Subuh esok hari, sekitar ${p.time}.`,
    fajr_next_day: (p: { time: string }) =>
      `Akhir Isya dihitung sampai masuk waktu Subuh esok hari, sekitar ${p.time}.`,
    asr_shadow_2x_heuristic: (p: { maghrib: string }) =>
      `Akhir Ashar tetap sampai Maghrib (${p.maghrib}). Catatan: perbedaan bayangan 2x terutama memengaruhi awal Ashar, bukan akhirnya.`,
    yellowing_sun_heuristic: (p: { minutes: number; time: string }) =>
      `Estimasi waktu Ashar utama berakhir saat matahari mulai menguning, sekitar ${p.minutes} menit sebelum Maghrib (${p.time}). Ini perkiraan, karena perubahan warna langit tidak bisa dihitung persis oleh perangkat.`,
    isfar_heuristic: (p: { minutes: number; time: string }) =>
      `Estimasi isfar: langit sudah cukup terang sekitar ${p.minutes} menit sebelum terbit (${p.time}). Ini perkiraan, bukan batas pasti.`,
  },

  notifBody: {
    startTitle: (label: string) => `Waktu ${label} telah masuk`,
    startBody: (label: string, endLabel: string) =>
      `Sekarang masuk waktu ${label}. Akhir waktu sekitar ${endLabel}.`,
    beforeStartTitle: (label: string) => `${label} sebentar lagi`,
    beforeStartBody: (m: number, label: string, startLabel: string) =>
      `${m} menit lagi menuju waktu ${label} (${startLabel}).`,
    beforeEndTitle: (label: string) => `Waktu ${label} hampir habis`,
    beforeEndBody: (m: number, label: string, endLabel: string, rem: string) =>
      `Estimasi akhir waktu ${label} sekitar ${m} menit lagi (${endLabel}). Sisa ${rem}.`,
  },

  profileDisclaimer:
    "Batas akhir waktu mengikuti pendapat mayoritas dalam profil madzhab yang dipilih. Ini perkiraan untuk membantu pengingat, bukan rujukan fikih final.",
};

export type Messages = typeof id;

const en: Messages = {
  nav: { home: "Home", settings: "Settings", about: "About" },

  common: {
    back: "Back",
    next: "Next",
    finish: "Done",
    cancel: "Cancel",
    change: "Change",
    reset: "Reset",
    allow: "Allow",
    or: "or search a city",
    used: "in use",
  },

  install: {
    title: "Install app",
    description:
      "Add Waqt to your home screen for quick access and a full-screen view.",
    button: "Install",
    iosSteps:
      "Open the Share menu in Safari, then choose “Add to Home Screen”.",
  },

  prayers: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  },

  status: {
    upcoming: "Upcoming",
    active: "In progress",
    ending_soon: "Ending soon",
    ended: "Ended",
  },

  accuracy: {
    labels: {
      astronomical: "Astronomical",
      fiqh_rule: "Fiqh",
      heuristic: "Estimate",
    },
    descriptions: {
      astronomical:
        "Computed astronomically (sun position). The most precise a device can do.",
      fiqh_rule:
        "Follows the fiqh rule of your chosen madhhab, derived from the astronomical times.",
      heuristic:
        "An approximation, because the natural sign involved can't be computed exactly by a device.",
    },
  },

  onboarding: {
    appSubtitle:
      "Prayer-time reminders based on location, madhhab, and estimated end times.",
    locTitle: "Set your location",
    locSubtitle: "Used to compute prayer times locally on your device.",
    locationSet: (label: string) => `Location: ${label}`,
    madhhabTitle: "Choose a madhhab profile",
    madhhabSubtitle: "Affects the start of Asr and the estimated end times.",
    asrNote:
      "Main difference in Asr's start: Hanafi uses a 2x shadow, while most madhhabs use a 1x shadow.",
    methodTitle: "Calculation method",
    methodSubtitle: "Pick automatic, or match the authority in your region.",
    autoUses: (method: string) =>
      `Automatic mode selects ${method} for your location.`,
  },

  location: {
    useCurrent: "Use current location",
    searchPlaceholder: "e.g. Jakarta, London, Makkah…",
    gpsFallback: "Couldn't get your location. Try searching for a city.",
    searchFailed:
      "City search failed. Check your internet connection, or use GPS.",
    noResults: (q: string) => `No results for "${q}".`,
    geo: {
      unsupported: "This device doesn't support location detection.",
      permission_denied:
        "Location permission denied. You can search for a city instead.",
      unavailable: "Location isn't available right now. Try again or search.",
      timeout: "Location is taking too long. Try again or search.",
    },
  },

  dashboard: {
    setLocation: "Set location",
    todaySchedule: "Today's schedule",
    sunrise: "Sunrise",
    errorTitle: "Can't show times yet",
    openSettings: "Open settings",
    highLat:
      "You're at a high latitude. Fajr and Isha may be less precise and use the middle-of-the-night rule.",
    enableTitle: "Turn on reminders",
    enableBody: "Get start reminders and estimated end-of-time alerts.",
    setupNotif: "Set up notifications",
  },

  hero: {
    nowIn: (prayer: string) => `Now in ${prayer} time`,
    towards: (prayer: string) => `Approaching ${prayer}`,
    remaining: "Time left",
    willEnterIn: "Starts in",
    remainingAbout: (dur: string) => `About ${dur} left`,
    startIn: (dur: string) => `Starts in ${dur}`,
    start: "Start",
    end: "End",
    detail: "Details",
  },

  detail: {
    willEnterIn: "Starts in",
    remaining: "Time left",
    aboutMore: (dur: string) => `About ${dur} to go`,
    startAt: (label: string) => `Starts ${label}`,
    startTime: "Start time",
    endEstimate: "Estimated end",
    explanationTitle: "How this time is set",
    explainBtn: "Explain this time",
    endEstimateFor: (prayer: string) => `Estimated end of ${prayer}`,
    basedOnProfile: (profile: string) => `Based on the ${profile} profile`,
    otherOpinions: "Other opinions for the end time",
    changeRulePrompt: "Want to change the end-time rule?",
    openAdvanced: "Open advanced mode",
    notAvailable: "Prayer-time data isn't available.",
  },

  settings: {
    title: "Settings",
    location: "Location",
    locationNotSet: "Not set",
    madhhabProfile: "Madhhab profile",
    madhhabDesc: "Affects the start of Asr and the estimated end times.",
    method: "Calculation method",
    methodAutoUses: (m: string) => `Automatic mode uses ${m}.`,
    notifications: "Notifications",
    language: "Language",
    advancedMode: "Advanced mode",
    enableAdvanced: "Enable advanced mode",
    enableAdvancedDesc: "Set the end-time rule for each prayer yourself.",
    configureEndRules: "Configure end-time rules",
    changeLocationTitle: "Change location",
    changeLocationDesc: "Use GPS or search for your city.",
    resetAll: "Reset all settings",
    resetTitle: "Reset settings?",
    resetBody:
      "All settings, including your location, will return to defaults. This can't be undone.",
  },

  notif: {
    reminderTitle: "Prayer-time reminders",
    reminderDesc: "Start reminders and estimated end-of-time alerts.",
    atStart: "When the time starts",
    atStartDesc: "Notify right at the start of each prayer.",
    beforeStart: "Before the time starts",
    beforeStartDesc: "Remind a few minutes before the start.",
    beforeEnd: "Before the estimated end",
    beforeEndDesc: "Remind near the end of the window (profile estimate).",
    minutes: (m: number) => `${m} min`,
    unsupportedTitle: "Notifications not supported",
    unsupportedBody:
      "This browser or device doesn't support web notifications. You can still see the schedule and estimated end times inside the app.",
    deniedBody:
      "Notification permission is blocked. Re-enable it in your browser settings for this site.",
    webLimitation:
      "Reminders work best while the app is open. If you close it, they might not always show up on time.",
    pushEnabled:
      "Reminders still show up even when the app is closed.",
    pushRegisterFailed:
      "Could not register push with the server. Toggle off and on again, or reopen the app from your home screen (PWA).",
    enabledTitle: "Notifications on",
    enabledBody: "We'll let you know based on your settings.",
    scheduled: (n: number) => `${n} reminders set for today.`,
    troubleshoot: {
      trigger: "Notifications not showing?",
      title: "Notifications not showing?",
      intro: "Try these one at a time.",
      steps: [
        {
          title: "Allow notifications",
          body: "Make sure you tapped Allow when asked. If it was blocked before, change it in your browser's site settings, then reload this page.",
        },
        {
          title: "Using Brave?",
          body: "Brave turns off its built-in push service. Open Brave settings, turn on 'Use Google services for push messaging', then reopen Brave.",
        },
        {
          title: "On iPhone",
          body: "Notifications only work once the app is added to your home screen. Open it from the home screen icon, not from Safari.",
        },
        {
          title: "Still nothing",
          body: "Toggle the switch off and on, or close and reopen the app. Browsers like Chrome usually work best.",
        },
      ],
    },
  },

  fiqh: {
    title: "End-time rules",
    subtitle: (profile: string) => `Advanced mode · ${profile} profile`,
    backToProfile: "Back to profile",
    endOf: (prayer: string) => `End of ${prayer}`,
    info:
      "Each rule is tagged Astronomical, Fiqh, or Estimate. These follow the majority opinion within the chosen profile, and some are only approximations, not a final fiqh ruling.",
    adjustments: "Estimate adjustments",
    shortMaghribTitle: "Short Maghrib estimate",
    shortMaghribDesc: "Minutes after sunset (for the short-estimate rule).",
    yellowingTitle: "Yellowing sun",
    yellowingDesc: "Minutes before Maghrib for the main Asr end estimate.",
    isfarTitle: "Isfar (Fajr)",
    isfarDesc: "Minutes before sunrise for the main Fajr end estimate.",
  },

  about: {
    title: "About Waqt",
    subtitle:
      "Prayer-time reminders based on location, madhhab, and estimated end times.",
    p1: "This app helps remind you of prayer times based on astronomical calculation and your chosen fiqh profile — not just the start, but also the estimated end of each window and the time remaining.",
    p2: "Some end times are only approximations, because not every natural sign can be computed precisely by a device.",
    p3: "This app is not a replacement for fiqh references or guidance from a teacher.",
    accuracyMeaning: "What the accuracy labels mean",
    howItWorks: "How each madhhab works",
    version: (v: string) => `Version ${v}`,
    contact: "Contact",
  },

  madhhabGuide: {
    intro:
      "Prayer start times are computed astronomically from the sun's position and are the same for every madhhab. What differs is mainly the start of Asr and the estimated end of each window. Tap a madhhab to see the details.",
    asrLabel: "Start of Asr",
    endLabel: "End of each window",
    referenceLabel: "Basis",
    disclaimer:
      "This is a simplified summary following the majority position of each madhhab. For the full discussion, refer to fiqh manuals or your teacher.",
    items: {
      syafii: {
        asr: "Begins when an object's shadow equals its own height (1x shadow).",
        ends: [
          "Fajr ends at sunrise.",
          "Dhuhr ends when Asr begins.",
          "Asr ends when Maghrib begins.",
          "Maghrib: this profile uses a short estimate after sunset. (Another view: until Isha begins.)",
          "Isha ends at midnight (the midpoint between Maghrib and Fajr).",
        ],
        reference:
          "Prayer times are based on the hadith of Jibril (Tirmidhi & Abu Dawud) and the hadith on prayer-time limits (Muslim). Differences in the exact end limits come from this madhhab's juristic reasoning.",
      },
      hanafi: {
        asr: "Begins later, when an object's shadow is twice its height (2x shadow).",
        ends: [
          "Fajr ends at sunrise.",
          "Dhuhr ends when Asr begins.",
          "Asr ends when Maghrib begins.",
          "Maghrib ends when Isha begins (after the red twilight fades).",
          "Isha ends at the next day's Fajr.",
        ],
        reference:
          "Prayer times are based on the hadith of Jibril (Tirmidhi & Abu Dawud) and the hadith on prayer-time limits (Muslim). Differences in the exact end limits come from this madhhab's juristic reasoning.",
      },
      maliki: {
        asr: "Begins when an object's shadow equals its own height (1x shadow).",
        ends: [
          "Fajr ends at sunrise.",
          "Dhuhr ends when Asr begins.",
          "Asr ends when Maghrib begins.",
          "Maghrib ends when Isha begins.",
          "Isha ends at the first third of the night.",
        ],
        reference:
          "Prayer times are based on the hadith of Jibril (Tirmidhi & Abu Dawud) and the hadith on prayer-time limits (Muslim). Differences in the exact end limits come from this madhhab's juristic reasoning.",
      },
      hanbali: {
        asr: "Begins when an object's shadow equals its own height (1x shadow).",
        ends: [
          "Fajr ends at sunrise.",
          "Dhuhr ends when Asr begins.",
          "Asr ends when Maghrib begins.",
          "Maghrib ends when Isha begins.",
          "Isha ends at midnight.",
        ],
        reference:
          "Prayer times are based on the hadith of Jibril (Tirmidhi & Abu Dawud) and the hadith on prayer-time limits (Muslim). Differences in the exact end limits come from this madhhab's juristic reasoning.",
      },
    },
  },

  madhhabDesc: {
    syafii:
      "Majority in Indonesia. Asr starts at a 1x shadow. Isha ends at midnight.",
    hanafi:
      "Asr starts at a 2x shadow. Maghrib ends at Isha; Isha ends at Fajr.",
    maliki: "Asr starts at a 1x shadow. Isha ends at one-third of the night.",
    hanbali: "Asr starts at a 1x shadow. Isha ends at midnight.",
  },

  methodLabel: {
    auto: "Automatic (by country)",
    kemenag_id: "Kemenag Indonesia",
    umm_al_qura: "Umm al-Qura (Makkah)",
    muslim_world_league: "Muslim World League",
    isna: "ISNA (North America)",
    egypt: "Egyptian General Authority",
    dubai: "Dubai",
    kuwait: "Kuwait",
    qatar: "Qatar",
    turkey: "Turkey (Diyanet)",
    singapore: "Singapore (MUIS)",
    moonsighting_committee: "Moonsighting Committee",
  },

  methodDesc: {
    auto: "Picks the method commonly used in your country.",
    kemenag_id: "Indonesian Ministry of Religious Affairs (Fajr 20°, Isha 18°).",
    umm_al_qura: "Used in Saudi Arabia.",
    muslim_world_league: "A common international standard.",
    isna: "Fajr & Isha 15°.",
    egypt: "Fajr 19.5°, Isha 17.5°.",
    dubai: "Fajr & Isha 18.2°.",
    kuwait: "Fajr 18°, Isha 17.5°.",
    qatar: "Fajr 18°, Isha 90 minutes.",
    turkey: "Fajr & Isha 18°.",
    singapore: "Fajr & Isha 20°.",
    moonsighting_committee: "With seasonal adjustment for high latitudes.",
  },

  ruleLabel: {
    next_prayer: "Until the next prayer",
    sunrise: "Until sunrise",
    maghrib: "Until Maghrib",
    isha_start: "Until Isha",
    short_maghrib_window: "Short estimate (minutes from Maghrib)",
    one_third_night: "One-third of the night",
    half_night: "Midnight (half of the night)",
    fajr_next_day: "Until the next day's Fajr",
    asr_shadow_2x_heuristic: "2x shadow (Hanafi approximation)",
    yellowing_sun_heuristic: "Yellowing-sun estimate",
    isfar_heuristic: "Isfar estimate (bright sky)",
  },

  ruleExplain: {
    next_prayer: (p) =>
      `The window ends when the next prayer begins, around ${p.time}.`,
    sunrise: (p) =>
      `Fajr ends at sunrise, ${p.time}. This is an astronomical calculation.`,
    maghrib: (p) =>
      `Asr ends when Maghrib begins at ${p.time} (sunset).`,
    isha_start: (p) => `Maghrib ends when Isha begins at ${p.time}.`,
    short_maghrib_window: (p) =>
      `This Maghrib end uses a short estimate, about ${p.minutes} minutes after sunset (around ${p.time}). It's a precautionary approximation, not a fixed limit.`,
    one_third_night: (p) =>
      `Isha ends at one-third of the night — a third of the way between Maghrib (${p.maghrib}) and the next day's Fajr, around ${p.time}.`,
    half_night: (p) =>
      `Isha ends at midnight — the midpoint between Maghrib (${p.maghrib}) and the next day's Fajr, around ${p.time}.`,
    fajr_next_day: (p) =>
      `Isha ends when the next day's Fajr begins, around ${p.time}.`,
    asr_shadow_2x_heuristic: (p) =>
      `Asr still ends at Maghrib (${p.maghrib}). Note: the 2x-shadow difference mainly affects Asr's start, not its end.`,
    yellowing_sun_heuristic: (p) =>
      `The main Asr time is estimated to end as the sun begins to yellow, about ${p.minutes} minutes before Maghrib (${p.time}). It's an approximation, because the sky's color change can't be computed exactly by a device.`,
    isfar_heuristic: (p) =>
      `Isfar estimate: the sky is bright enough about ${p.minutes} minutes before sunrise (${p.time}). It's an approximation, not a fixed limit.`,
  },

  notifBody: {
    startTitle: (label: string) => `${label} time has started`,
    startBody: (label: string, endLabel: string) =>
      `${label} has begun. The window ends around ${endLabel}.`,
    beforeStartTitle: (label: string) => `${label} is coming up`,
    beforeStartBody: (m: number, label: string, startLabel: string) =>
      `${m} minutes until ${label} (${startLabel}).`,
    beforeEndTitle: (label: string) => `${label} is almost over`,
    beforeEndBody: (m: number, label: string, endLabel: string, rem: string) =>
      `${label} ends in about ${m} minutes (${endLabel}). ${rem} left.`,
  },

  profileDisclaimer:
    "End times follow the majority opinion within the chosen madhhab profile. This is an estimate to help reminders, not a final fiqh reference.",
};

export const dictionaries: Record<Language, Messages> = { id, en };

export function getMessages(lang: Language): Messages {
  return dictionaries[lang] ?? dictionaries.id;
}
