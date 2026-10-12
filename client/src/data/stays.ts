/**
 * Real Uzbekistan homestay catalogue.
 * Photos: Wikimedia Commons (CC BY / CC BY-SA / Public Domain).
 */

export type StayItem = {
  id: number;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  city: string;
  region: string;
  cityUz?: string;
  cityRu?: string;
  cityEn?: string;
  regionUz?: string;
  regionRu?: string;
  regionEn?: string;
  cityKeyUz: string;
  regionKeyUz: string;
  homeTypeUz: string;
  homeTypeRu: string;
  homeTypeEn: string;
  images: string[];
  pricePerNight: number;
  /** Haftalik narx. Berilmasa pricePerNight * 7 hisoblanadi. */
  pricePerWeek?: number;
  rating: number;
  reviewCount: number;
  guestCount: number;
  hostName: string;
  hostAvatar: string;
  featured: number;
  lat: number;
  lng: number;
  category: string;
  /** Aniq manzil (ixtiyoriy). */
  address?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  telegram?: string;
  /** "curated" — sayt katalogi, "user" — foydalanuvchi joylagan uy. */
  source?: "curated" | "user";
  /** "wifi" | "parking" | "kitchen" | "breakfast" */
  amenities?: string[];
  descUz: string;
  descRu: string;
  descEn: string;
};

/** Wikimedia Commons FilePath — stable, licensed Uzbekistan photos */
export function wiki(file: string, width = 1280): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export const STAYS: StayItem[] = [
  {
    id: 1,
    titleUz: "Bog'ishamoldagi zamonaviy hovli uy",
    titleRu: "Современный дом с двором в Богишамоле",
    titleEn: "Modern courtyard home in Bogishamol",
    city: "Samarqand",
    region: "Bog'ishamol, Samarqand shahri",
    cityKeyUz: "city_samarkand",
    regionKeyUz: "region_samarkand",
    homeTypeUz: "Hovli uy",
    homeTypeRu: "Частный дом",
    homeTypeEn: "Courtyard house",
    images: [
      "/listings/bogishamol-exterior-1.png",
      "/listings/bogishamol-exterior-2.png",
      "/listings/bogishamol-exterior-3.png",
    ],
    pricePerNight: 420000,
    pricePerWeek: 2940000,
    rating: 0,
    reviewCount: 0,
    guestCount: 2,
    hostName: "Dilshod aka",
    hostAvatar: "/listings/host-avatar.svg",
    featured: 1,
    lat: 39.6542,
    lng: 66.9597,
    category: "city",
    address: "Samarqand shahri, Bog'ishamol, Mosni oldida, Hovli uy",
    source: "curated",
    amenities: [],
    descUz: "Samarqand shahri, Bog'ishamol dahasida, Mosni oldida joylashgan hovli uy. Keng, yopiq va yoritilgan ayvoni bor.",
    descRu: "Дом с просторной крытой и освещённой террасой находится в районе Богишамол города Самарканда, рядом с Mosni.",
    descEn: "A courtyard home with a spacious covered, well-lit veranda in Samarkand's Bogishamol area, next to Mosni.",
    phone1: "+998 93 953 56 57",
    phone2: "+998 93 359 30 44",
    telegram: "@juliqian",
  },
  {
    id: 1000001,
    titleUz: "Bog'ishamoldagi ikkinchi hovli uy",
    titleRu: "Еще один частный дом в Богишамоле",
    titleEn: "Another courtyard home in Bogishamol",
    city: "Samarqand",
    region: "Bog'ishamol, Samarqand shahri",
    cityKeyUz: "city_samarkand",
    regionKeyUz: "region_samarkand",
    homeTypeUz: "Hovli uy",
    homeTypeRu: "Частный дом",
    homeTypeEn: "Courtyard house",
    images: [
      "/listings/bogishamol-second-1.jpg",
      "/listings/bogishamol-second-2.jpg",
      "/listings/bogishamol-second-3.jpg",
    ],
    pricePerNight: 420000,
    pricePerWeek: 2940000,
    rating: 0,
    reviewCount: 0,
    guestCount: 2,
    hostName: "Dilshod aka",
    hostAvatar: "/listings/host-avatar.svg",
    featured: 1,
    lat: 39.6542,
    lng: 66.9597,
    category: "city",
    address: "Samarqand shahri, Bog'ishamol dahasi, 2-hovli",
    source: "curated",
    amenities: [],
    descUz: "Samarqand shahri, Bog'ishamol dahasidagi ikkinchi hovli uy. Tinch va osoyishta maskan.",
    descRu: "Второй частный дом в районе Богишамол Самарканда. Тихое и уютное место.",
    descEn: "A second courtyard home in the Bogishamol district of Samarkand. Peaceful and quiet stay.",
    phone1: "+998 93 953 56 57",
    phone2: "+998 93 359 30 44",
    telegram: "@juliqian",
  },
  {
    id: 1000002,
    titleUz: "Bog'ishamol 96-uy, 101-xonadon",
    titleRu: "Квартира 101, дом 96 на Богишамоле",
    titleEn: "Apartment 101, Building 96 in Bogishamol",
    city: "Samarqand",
    region: "Bog'ishamol, Samarqand shahri",
    cityKeyUz: "city_samarkand",
    regionKeyUz: "region_samarkand",
    homeTypeUz: "Kvartira",
    homeTypeRu: "Квартира",
    homeTypeEn: "Apartment",
    images: [
      "/listings/bogishamol-96-front.png",
      "/listings/bogishamol-96-living-room.png",
    ],
    pricePerNight: 350000,
    pricePerWeek: 2450000,
    rating: 0,
    reviewCount: 0,
    guestCount: 2,
    hostName: "Dilshod aka",
    hostAvatar: "/listings/host-avatar.svg",
    featured: 0,
    lat: 39.6542,
    lng: 66.9597,
    category: "city",
    address: "Samarqand shahri, Bog'ishamol dahasi, 96-dom, 101-xona",
    source: "curated",
    amenities: ["wifi", "kitchen"],
    descUz: "Samarqand shahri, Bog'ishamol dahasidagi 96-dom, 101-xona. Keng yashash xonasi va mehmondo'st sharoitlar.",
    descRu: "Квартира 101 в доме 96 на Богишамоле. Просторная гостиная и все удобства.",
    descEn: "Apartment 101 in building 96, Bogishamol. Spacious living room and hospitable setting.",
    phone1: "+998 93 953 56 57",
    phone2: "+998 93 359 30 44",
    telegram: "@juliqian",
  },
];

export function mergeStayCatalog(databaseStays: StayItem[]): StayItem[] {
  const staysById = new Map<number, StayItem>();
  for (const stay of databaseStays) {
    staysById.set(stay.id, stay);
  }
  for (const stay of STAYS) {
    staysById.set(stay.id, { ...staysById.get(stay.id), ...stay });
  }
  const userStays = getUserStays();
  for (const stay of userStays) {
    if (!staysById.has(stay.id)) {
      staysById.set(stay.id, stay);
    }
  }
  return Array.from(staysById.values());
}

export const CITY_IMAGES: Record<string, string> = {
  Samarqand: wiki("RegistanSquare_Samarkand.jpg", 800),
  Buxoro: wiki("Kalon-Ensemble_Buchara.jpg", 800),
  Toshkent: wiki("Chorsu_Market_general_view.jpg", 800),
  Chimgan: wiki("Chimgan Mountains.jpg", 800),
  Xiva: wiki("Kalta_Minor.jpg", 800),
  "Farg'ona": wiki("Коканд. Русско-Азиатский банк 01.jpg", 800),
};

export function stayTitle(s: StayItem, lang: string): string {
  if (lang === "ru") return s.titleRu;
  if (lang === "en") return s.titleEn;
  return s.titleUz;
}

export function stayType(s: StayItem, lang: string): string {
  if (lang === "ru") return s.homeTypeRu;
  if (lang === "en") return s.homeTypeEn;
  return s.homeTypeUz;
}

export function stayDesc(s: StayItem, lang: string): string {
  if (lang === "ru") return s.descRu;
  if (lang === "en") return s.descEn;
  return s.descUz;
}

/** Haftalik narxni qaytaradi (berilmasa kunlik narx × 7). */
export function stayWeekPrice(s: StayItem): number {
  return s.pricePerWeek ?? s.pricePerNight * 7;
}

/** Uy turiga qarab standart xizmatlar (agar ko'rsatilmagan bo'lsa). */
export function stayAmenities(s: StayItem): string[] {
  if (s.amenities) return s.amenities;
  switch (s.homeTypeEn) {
    case "Apartment": return ["wifi", "parking", "kitchen"];
    case "Guesthouse": return ["wifi", "kitchen", "breakfast"];
    case "Cottage":  return ["wifi", "parking", "kitchen", "breakfast"];
    case "Room":     return ["wifi", "breakfast"];
    default:         return ["wifi", "kitchen"];
  }
}

/** Kunlik narxni haftalik narxdan qaytaradi. */
export function nightlyFromWeekly(weekly: number): number {
  return Math.round(weekly / 7);
}

// ── Foydalanuvchi joylagan uylar ─────────────────────────────────────────────
// Yangi e'lonlar serverga ham yuboriladi, lekin sayt ishlashiga qarab
// localStorage'da saqlanadi, shuning uchun ular katalogda darhol ko'rinadi.

const USER_STAYS_KEY = "uyjoy_user_stays";
const listeners = new Set<() => void>();

function safeParse(raw: string | null): StayItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StayItem[]) : [];
  } catch {
    return [];
  }
}

export function sanitizeUserStays(entries: StayItem[] = []): StayItem[] {
  if (!Array.isArray(entries)) return [];

  const cleaned = entries
    .filter((stay) => !!stay && !!stay.titleUz && !!stay.address)
    .map((stay) => {
      const images = Array.isArray(stay.images)
        ? stay.images.filter((img): img is string => typeof img === "string" && !!img.trim())
        : [];

      const validImages = images.filter((img) => {
        const isRemote = /^https?:\/\//i.test(img);
        const isLocalData = /^data:image\//i.test(img);
        const isBlob = /^blob:/i.test(img);

        if (!isRemote && !isLocalData && !isBlob) return false;
        if (isRemote) {
          return !/(images\.unsplash\.com|images\.pexels\.com|placehold\.co|loremflickr|picsum\.photos|source\.unsplash\.com)/i.test(img);
        }
        return true;
      });

      return {
        ...stay,
        images: validImages.slice(0, 10),
      };
    })
    .filter((stay) => stay.images.length > 0);

  return cleaned;
}

export function getUserStays(): StayItem[] {
  if (typeof localStorage === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(USER_STAYS_KEY));
  const cleaned = sanitizeUserStays(parsed);

  if (cleaned.length !== parsed.length) {
    try {
      localStorage.setItem(USER_STAYS_KEY, JSON.stringify(cleaned));
    } catch {}
  }

  return cleaned;
}

export function getAllStays(): StayItem[] {
  if (typeof localStorage === "undefined") return [...STAYS].slice(0, 1);

  const userStays = getUserStays();
  if (userStays.length > 0) {
    return userStays.slice(0, 1);
  }

  return [...STAYS].slice(0, 1);
}

export function findStay(id: number): StayItem | undefined {
  return getAllStays().find((s) => s.id === id);
}

export function subscribeUserStays(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify() {
  listeners.forEach((fn) => fn());
}

export type NewStayInput = {
  titleUz: string;
  city: string;
  region: string;
  homeTypeUz: string;
  address: string;
  description: string;
  images: string[];
  pricePerWeek: number;
  guestCount: number;
  hostName: string;
  hostAvatar?: string;
  phone1?: string;
  phone2?: string;
  telegram?: string;
  email?: string;
  amenities?: string[];
  lat?: number;
  lng?: number;
};

/** Yangi e'lonni saqlaydi va katalogga qo'shadi. */
export function addUserStay(input: NewStayInput): StayItem {
  const current = getUserStays();
  const nextId = Math.max(0, ...STAYS.map((s) => s.id), ...current.map((s) => s.id)) + 1;
  const stay: StayItem = {
    id: nextId,
    titleUz: input.titleUz,
    titleRu: input.titleUz,
    titleEn: input.titleUz,
    city: input.city,
    region: input.region,
    cityKeyUz: CITY_KEY_BY_NAME[input.city] ?? "city_samarkand",
    regionKeyUz: CITY_KEY_BY_NAME[input.city] ?? "region_samarkand",
    homeTypeUz: input.homeTypeUz,
    homeTypeRu: input.homeTypeUz,
    homeTypeEn: input.homeTypeUz,
    images: input.images.length ? input.images : [DEFAULT_STAY_IMAGE],
    pricePerNight: nightlyFromWeekly(input.pricePerWeek),
    pricePerWeek: input.pricePerWeek,
    rating: 0,
    reviewCount: 0,
    guestCount: input.guestCount,
    hostName: input.hostName,
    hostAvatar: input.hostAvatar || "/listings/host-avatar.svg",
    featured: 0,
    lat: input.lat ?? 39.6542,
    lng: input.lng ?? 66.9597,
    category: "city",
    address: input.address,
    source: "user",
    phone1: input.phone1,
    phone2: input.phone2,
    telegram: input.telegram,
    email: input.email,
    amenities: input.amenities?.length ? input.amenities : ["wifi", "kitchen"],
    descUz: input.description,
    descRu: input.description,
    descEn: input.description,
  };

  // Keep exactly one active listing on the site; older fake homes are discarded.
  try {
    localStorage.setItem(USER_STAYS_KEY, JSON.stringify([stay]));
  } catch {}
  notify();
  return stay;
}

export const DEFAULT_STAY_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

const CITY_KEY_BY_NAME: Record<string, string> = {
  Samarqand: "city_samarkand",
  Buxoro: "city_bukhara",
  Toshkent: "city_tashkent",
  Chimgan: "city_chimgan",
  Xiva: "city_khiva",
  "Farg'ona": "city_fergana",
  Shahrisabz: "city_shahrisabz",
  Nukus: "city_nukus",
};
