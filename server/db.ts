import { and, desc, eq, gte, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema.js";
import { bookings, InsertUser, listings, stays, users, verificationCodes, wishlists } from "../drizzle/schema.js";
import { STAYS, type StayItem } from "../client/src/data/stays.js";
import { ENV } from "./_core/env.js";

export const BOOKING_SERVICE_FEE_RATE = 0.05;
const MILLISECONDS_PER_DAY = 86_400_000;

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connectionUrl = new URL(process.env.DATABASE_URL);
      const usesSsl = connectionUrl.searchParams.has("ssl");
      _db = drizzle({
        connection: {
          host: connectionUrl.hostname,
          port: Number(connectionUrl.port || 3306),
          user: decodeURIComponent(connectionUrl.username),
          password: decodeURIComponent(connectionUrl.password),
          database: decodeURIComponent(connectionUrl.pathname.slice(1)),
          ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
        },
        schema,
        mode: "default",
      });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
    }
  }
  return _db;
}

function parseJsonArray<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseStayRow(row: any): StayItem {
  return {
    id: Number(row.id),
    titleUz: row.titleUz ?? row.title ?? "",
    titleRu: row.titleRu ?? row.titleUz ?? "",
    titleEn: row.titleEn ?? row.titleUz ?? "",
    city: row.city ?? "",
    region: row.region ?? "",
    cityUz: row.city,
    cityRu: row.city,
    cityEn: row.city,
    regionUz: row.region,
    regionRu: row.region,
    regionEn: row.region,
    cityKeyUz: `city_${String(row.city ?? "").toLowerCase().replace(/\s+/g, "_")}`,
    regionKeyUz: `region_${String(row.region ?? "").toLowerCase().replace(/\s+/g, "_")}`,
    homeTypeUz: row.homeTypeUz ?? row.homeType ?? "Uy",
    homeTypeRu: row.homeTypeRu ?? row.homeType ?? "Дом",
    homeTypeEn: row.homeTypeEn ?? row.homeType ?? "Home",
    images: parseJsonArray<string>(row.images) || [row.imageUrl].filter(Boolean),
    pricePerNight: Number(row.pricePerNight ?? 0),
    pricePerWeek: Number(row.pricePerWeek ?? 0) || undefined,
    rating: Number(row.rating ?? 5),
    reviewCount: Number(row.reviewCount ?? 0),
    guestCount: Number(row.guestCount ?? 2),
    hostName: row.hostName ?? "UyJoy xonadoshi",
    hostAvatar: row.hostAvatar ?? "",
    featured: Number(row.featured ?? 0),
    lat: typeof row.lat === "number" ? row.lat : Number(row.lat ?? 0),
    lng: typeof row.lng === "number" ? row.lng : Number(row.lng ?? 0),
    category: row.category ?? "historic",
    address: row.address ?? "",
    email: row.email ?? undefined,
    phone1: row.phone1 ?? undefined,
    phone2: row.phone2 ?? undefined,
    telegram: row.telegram ?? undefined,
    source: (row.source as "curated" | "user") ?? "curated",
    amenities: parseJsonArray<string>(row.amenities),
    descUz: row.descUz ?? row.description ?? "",
    descRu: row.descRu ?? row.description ?? "",
    descEn: row.descEn ?? row.description ?? "",
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function searchListings(query?: string, city?: string) {
  const catalogMatches = () => STAYS.filter((stay) => {
    const matchesQuery = !query || [stay.titleUz, stay.titleRu, stay.titleEn, stay.city, stay.region]
      .some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const matchesCity = !city || city === "all" || stay.city === city;
    return matchesQuery && matchesCity;
  });

  try {
    const db = await getDb();
    if (!db) return catalogMatches();
    const filters = [] as any[];
    if (query) {
      filters.push(or(like(stays.titleUz, `%${query}%`), like(stays.titleRu, `%${query}%`), like(stays.titleEn, `%${query}%`), like(stays.city, `%${query}%`), like(stays.region, `%${query}%`)));
    }
    if (city && city !== "all") {
      filters.push(eq(stays.city, city));
    }
    const rows = await db.select().from(stays).where(filters.length ? and(...filters) : undefined).orderBy(desc(stays.featured), desc(stays.rating), desc(stays.createdAt));
    return rows.length ? rows.map(parseStayRow) : catalogMatches();
  } catch (error) {
    console.warn("[Database] Listing search failed; using curated catalog.");
    return catalogMatches();
  }
}

export async function getListingById(id: number) {
  try {
    const db = await getDb();
    if (!db) return STAYS.find((stay) => stay.id === id);
    const row = (await db.select().from(stays).where(eq(stays.id, id)).limit(1))[0];
    return row ? parseStayRow(row) : STAYS.find((stay) => stay.id === id);
  } catch (error) {
    console.warn("[Database] Listing lookup failed; using curated catalog.");
    return STAYS.find((stay) => stay.id === id);
  }
}

export async function getStayById(id: number) {
  return getListingById(id);
}

export async function createListing(input: {
  userId: number;
  title: string;
  city: string;
  region: string;
  description: string;
  imageUrl: string;
  pricePerNight: number;
  pricePerWeek: number;
  guestCount: number;
  homeType: string;
  hostName: string;
  address?: string;
  images?: string[];
  amenities?: string[];
  phone1?: string;
  telegram?: string;
}) {
  const db = await getDb();
  if (!db) return { ...input, id: 0, rating: 0, reviewCount: 0, featured: 0, persisted: false as const };

  const allImages = input.images && input.images.length ? input.images : [input.imageUrl];
  const allAmenities = input.amenities ?? [];

  const result = await db.insert(stays).values({
    titleUz: input.title,
    titleRu: input.title,
    titleEn: input.title,
    city: input.city,
    region: input.region,
    homeTypeUz: input.homeType,
    homeTypeRu: input.homeType,
    homeTypeEn: input.homeType,
    description: input.description,
    descUz: input.description,
    descRu: input.description,
    descEn: input.description,
    imageUrl: input.imageUrl,
    images: JSON.stringify(allImages),
    amenities: JSON.stringify(allAmenities),
    pricePerNight: input.pricePerNight,
    pricePerWeek: input.pricePerWeek,
    rating: 0,
    reviewCount: 0,
    guestCount: input.guestCount,
    hostId: input.userId,
    hostName: input.hostName,
    featured: 0,
    address: input.address ?? input.title,
    phone1: input.phone1,
    telegram: input.telegram,
    source: "user",
  });

  return { ...input, id: Number(result[0].insertId), rating: 0, reviewCount: 0, featured: 0, persisted: true as const };
}

export async function toggleWishlist(userId: number, listingId: number) {
  const db = await getDb(); if (!db) return { saved: false };
  try {
    const existing = (await db.select().from(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.listingId, listingId))).limit(1))[0];
    if (existing) { await db.delete(wishlists).where(eq(wishlists.id, existing.id)); return { saved: false }; }
    await db.insert(wishlists).values({ userId, listingId }); return { saved: true };
  } catch {
    return { saved: false };
  }
}

export function calculateStayTotal({
  pricePerNight,
  nights,
  serviceFeeRate = BOOKING_SERVICE_FEE_RATE,
}: {
  pricePerNight: number;
  nights: number;
  serviceFeeRate?: number;
}) {
  const nightly = Number(pricePerNight || 0);
  const stayNights = Math.max(1, Number(nights || 1));
  const subtotal = nightly * stayNights;
  return Math.round(subtotal + subtotal * serviceFeeRate);
}

export function normalizeUtcDate(value: Date): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid booking dates.");
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function validateBookingInput(input: {
  checkIn: Date;
  checkOut: Date;
  guests: number;
  stayGuestCount: number;
  pricePerNight: number;
}): { checkIn: Date; checkOut: Date; guests: number; nights: number; totalAmountUzs: number } {
  const checkIn = normalizeUtcDate(input.checkIn);
  const checkOut = normalizeUtcDate(input.checkOut);
  const today = normalizeUtcDate(new Date());

  if (checkIn < today) {
    throw new Error("Check-in cannot be in the past.");
  }
  if (checkOut <= checkIn) {
    throw new Error("Check-out must be later than check-in.");
  }

  const nights = (checkOut.getTime() - checkIn.getTime()) / MILLISECONDS_PER_DAY;
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("Booking must cover at least one night.");
  }
  if (nights > 30) {
    throw new Error("Booking cannot be longer than 30 nights.");
  }

  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > input.stayGuestCount) {
    throw new Error("Guest count is outside the stay capacity.");
  }

  const totalAmountUzs = calculateStayTotal({ pricePerNight: input.pricePerNight, nights });

  return { checkIn, checkOut, guests: input.guests, nights, totalAmountUzs };
}

export async function createBooking(input: {
  userId: number;
  stayId: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
}) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");

  return db.transaction(async (tx) => {
    const stay = (await tx.select().from(stays).where(eq(stays.id, input.stayId)).limit(1).for("update"))[0];
    if (!stay) {
      throw new Error("Stay not found.");
    }

    const validated = validateBookingInput({
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      stayGuestCount: Number(stay.guestCount ?? 1),
      pricePerNight: Number(stay.pricePerNight ?? 0),
    });

    const overlap = (await tx.select().from(bookings).where(
      and(
        eq(bookings.stayId, input.stayId),
        sql`${bookings.checkIn} < ${validated.checkOut} AND ${bookings.checkOut} > ${validated.checkIn}`,
        sql`${bookings.status} IN ('pending', 'paid')`,
      ),
    ).limit(1))[0];

    if (overlap) {
      throw new Error("Stay is already booked for the selected dates.");
    }

    const result = await tx.insert(bookings).values({
      userId: input.userId,
      stayId: input.stayId,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      guests: validated.guests,
      totalAmountUzs: validated.totalAmountUzs,
      status: "pending",
    });

    return {
      id: Number(result[0].insertId),
      userId: input.userId,
      stayId: input.stayId,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      guests: validated.guests,
      status: "pending" as const,
      totalAmountUzs: validated.totalAmountUzs,
    };
  });
}

export async function expirePendingBookings() {
  const db = await getDb(); if (!db) return 0;
  const result = await db.update(bookings)
    .set({ status: "expired" })
    .where(and(eq(bookings.status, "pending"), sql`${bookings.createdAt} < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`));
  return result[0]?.affectedRows ?? 0;
}

export async function seedStaysFromCatalog(items: Array<StayItem & { id?: number }>) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");

  for (const stay of items) {
    await db.insert(stays).values({
      id: stay.id,
      titleUz: stay.titleUz,
      titleRu: stay.titleRu,
      titleEn: stay.titleEn,
      city: stay.city,
      region: stay.region,
      homeTypeUz: stay.homeTypeUz,
      homeTypeRu: stay.homeTypeRu,
      homeTypeEn: stay.homeTypeEn,
      description: stay.descUz,
      descUz: stay.descUz,
      descRu: stay.descRu,
      descEn: stay.descEn,
      imageUrl: stay.images?.[0] ?? "",
      images: JSON.stringify(stay.images ?? []),
      amenities: JSON.stringify(stay.amenities ?? []),
      pricePerNight: stay.pricePerNight,
      pricePerWeek: stay.pricePerWeek ?? Math.round(stay.pricePerNight * 7),
      rating: Math.round(stay.rating),
      reviewCount: stay.reviewCount,
      guestCount: stay.guestCount,
      hostId: 1,
      hostName: stay.hostName,
      hostAvatar: stay.hostAvatar,
      featured: stay.featured ?? 0,
      category: stay.category ?? "historic",
      source: stay.source ?? "curated",
      address: stay.address ?? stay.region,
      lat: stay.lat,
      lng: stay.lng,
      email: stay.email,
      phone1: stay.phone1,
      phone2: stay.phone2,
      telegram: stay.telegram,
    }).onDuplicateKeyUpdate({
      set: {
        titleUz: stay.titleUz,
        titleRu: stay.titleRu,
        titleEn: stay.titleEn,
        city: stay.city,
        region: stay.region,
        homeTypeUz: stay.homeTypeUz,
        homeTypeRu: stay.homeTypeRu,
        homeTypeEn: stay.homeTypeEn,
        description: stay.descUz,
        descUz: stay.descUz,
        descRu: stay.descRu,
        descEn: stay.descEn,
        imageUrl: stay.images?.[0] ?? "",
        images: JSON.stringify(stay.images ?? []),
        amenities: JSON.stringify(stay.amenities ?? []),
        pricePerNight: stay.pricePerNight,
        pricePerWeek: stay.pricePerWeek ?? Math.round(stay.pricePerNight * 7),
        rating: Math.round(stay.rating),
        reviewCount: stay.reviewCount,
        guestCount: stay.guestCount,
        hostName: stay.hostName,
        hostAvatar: stay.hostAvatar,
        featured: stay.featured ?? 0,
        category: stay.category ?? "historic",
        source: stay.source ?? "curated",
        address: stay.address ?? stay.region,
        lat: stay.lat,
        lng: stay.lng,
        email: stay.email,
        phone1: stay.phone1,
        phone2: stay.phone2,
        telegram: stay.telegram,
      },
    });
  }

  return items.length;
}

export async function createVerificationCode(input: { userId: number; email: string; codeHash: string; expiresAt: Date }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(verificationCodes).set({ expiresAt: new Date() }).where(and(eq(verificationCodes.userId, input.userId), eq(verificationCodes.email, input.email)));
  const result = await db.insert(verificationCodes).values(input); return Number(result[0].insertId);
}

export async function getLatestVerificationCode(userId: number, email: string) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(verificationCodes).where(and(eq(verificationCodes.userId, userId), eq(verificationCodes.email, email))).orderBy(desc(verificationCodes.createdAt)).limit(1))[0];
}

export async function markVerificationCodeUsed(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(verificationCodes).set({ verifiedAt: new Date() }).where(eq(verificationCodes.id, id));
}
