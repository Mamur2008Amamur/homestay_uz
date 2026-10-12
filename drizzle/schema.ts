import { bigint, double, int, mysqlEnum, mysqlTable, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "host", "admin"]).default("user").notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  passwordChangedAt: timestamp("passwordChangedAt"),
  failedLoginCount: int("failedLoginCount").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const stays = mysqlTable("stays", {
  id: int("id").autoincrement().primaryKey(),
  titleUz: varchar("titleUz", { length: 255 }).notNull(),
  titleRu: varchar("titleRu", { length: 255 }).notNull(),
  titleEn: varchar("titleEn", { length: 255 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  region: varchar("region", { length: 120 }).notNull(),
  homeTypeUz: varchar("homeTypeUz", { length: 80 }).notNull().default("Uy"),
  homeTypeRu: varchar("homeTypeRu", { length: 80 }).notNull().default("Дом"),
  homeTypeEn: varchar("homeTypeEn", { length: 80 }).notNull().default("Home"),
  description: text("description"),
  descUz: text("descUz"),
  descRu: text("descRu"),
  descEn: text("descEn"),
  imageUrl: text("imageUrl").notNull(),
  images: text("images").notNull(),
  amenities: text("amenities"),
  pricePerNight: int("pricePerNight").notNull(),
  pricePerWeek: int("pricePerWeek").notNull().default(0),
  rating: int("rating").notNull().default(5),
  reviewCount: int("reviewCount").notNull().default(0),
  guestCount: int("guestCount").notNull().default(2),
  hostId: int("hostId").notNull(),
  hostName: varchar("hostName", { length: 120 }).notNull(),
  hostAvatar: text("hostAvatar"),
  featured: int("featured").notNull().default(0),
  category: varchar("category", { length: 80 }).notNull().default("historic"),
  source: varchar("source", { length: 30 }).default("curated").notNull(),
  address: text("address"),
  lat: double("lat", { precision: 10, scale: 6 }),
  lng: double("lng", { precision: 10, scale: 6 }),
  email: varchar("email", { length: 320 }),
  phone1: varchar("phone1", { length: 40 }),
  phone2: varchar("phone2", { length: 40 }),
  telegram: varchar("telegram", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  region: varchar("region", { length: 120 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  pricePerNight: int("pricePerNight").notNull(),
  pricePerWeek: int("pricePerWeek").notNull().default(0),
  rating: int("rating").notNull().default(5),
  reviewCount: int("reviewCount").notNull().default(0),
  guestCount: int("guestCount").notNull().default(2),
  homeType: varchar("homeType", { length: 80 }).notNull().default("Mehmon uyi"),
  hostName: varchar("hostName", { length: 120 }).notNull(),
  hostAvatar: text("hostAvatar"),
  amenities: text("amenities"),
  featured: int("featured").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingId: int("listingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ uniqueUserListing: unique().on(table.userId, table.listingId) }));

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stayId: int("stayId").notNull(),
  checkIn: timestamp("checkIn").notNull(),
  checkOut: timestamp("checkOut").notNull(),
  guests: int("guests").notNull().default(1),
  totalAmountUzs: int("totalAmountUzs").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  paymeId: varchar("paymeId", { length: 128 }),
  amountTiyin: int("amountTiyin").notNull(),
  state: mysqlEnum("state", ["created", "performed", "cancelled_before_perform", "cancelled_after_perform"]).default("created").notNull(),
  reason: varchar("reason", { length: 128 }),
  createTime: bigint("createTime", { mode: "number" }),
  performTime: bigint("performTime", { mode: "number" }),
  cancelTime: bigint("cancelTime", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const verificationCodes = mysqlTable("verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Stay = typeof stays.$inferSelect;
export type InsertStay = typeof stays.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
