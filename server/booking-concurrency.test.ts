import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName } from "drizzle-orm/table";

const mockedDriver = vi.hoisted(() => ({ database: null as unknown }));

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: () => mockedDriver.database,
}));

type StoredBooking = {
  id: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  [key: string]: unknown;
};

class FakeBookingDatabase {
  readonly stay = { id: 7, guestCount: 4, pricePerNight: 420_000 };
  readonly rows: StoredBooking[] = [];
  lockCount = 0;
  private nextStayLock: Promise<void> = Promise.resolve();

  async transaction<T>(callback: (tx: FakeBookingTransaction) => Promise<T>): Promise<T> {
    const tx = new FakeBookingTransaction(this);
    try {
      return await callback(tx);
    } finally {
      tx.releaseLocks();
    }
  }

  async lockStay(): Promise<() => void> {
    const previousLock = this.nextStayLock;
    let release!: () => void;
    this.nextStayLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previousLock;
    this.lockCount += 1;
    return release;
  }
}

class FakeBookingTransaction {
  private releaseStayLock: (() => void) | undefined;

  constructor(private readonly database: FakeBookingDatabase) {}

  select() {
    return {
      from: (table: unknown) => ({
        where: (_condition: unknown) => ({
          limit: (_limit: number) => {
            if (getTableName(table as never) === "stays") {
              return {
                for: async (lockMode: string) => {
                  if (lockMode !== "update") {
                    throw new Error("Expected a FOR UPDATE stay lock.");
                  }
                  this.releaseStayLock = await this.database.lockStay();
                  return [this.database.stay];
                },
              };
            }

            if (getTableName(table as never) === "bookings") {
              return this.database.rows
                .filter((booking) => booking.status === "pending" || booking.status === "paid")
                .slice(0, 1);
            }

            throw new Error("Unexpected table query.");
          },
        }),
      }),
    };
  }

  insert(table: unknown) {
    if (getTableName(table as never) !== "bookings") {
      throw new Error("Unexpected table insert.");
    }

    return {
      values: async (value: Omit<StoredBooking, "id">) => {
        const id = this.database.rows.length + 1;
        this.database.rows.push({ id, ...value });
        return [{ insertId: id }];
      },
    };
  }

  releaseLocks() {
    this.releaseStayLock?.();
    this.releaseStayLock = undefined;
  }
}

const originalDatabaseUrl = process.env.DATABASE_URL;
let database: FakeBookingDatabase;
let bookingModule: typeof import("./db");

beforeEach(async () => {
  vi.resetModules();
  database = new FakeBookingDatabase();
  mockedDriver.database = database;
  process.env.DATABASE_URL = "mysql://test:test@localhost:3306/uyjoy_test";
  bookingModule = await import("./db");
});

afterEach(() => {
  vi.resetModules();
  mockedDriver.database = null;
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("concurrent booking protection", () => {
  it("lets only one simultaneous booking for the same stay and dates succeed", async () => {
    const checkIn = new Date();
    checkIn.setUTCDate(checkIn.getUTCDate() + 1);
    checkIn.setUTCHours(0, 0, 0, 0);
    const checkOut = new Date(checkIn.getTime() + 2 * 86_400_000);

    const results = await Promise.allSettled([
      bookingModule.createBooking({ userId: 1, stayId: 7, checkIn, checkOut, guests: 2 }),
      bookingModule.createBooking({ userId: 2, stayId: 7, checkIn, checkOut, guests: 2 }),
    ]);

    if (results[0].status === "rejected") {
      throw results[0].reason;
    }
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(database.rows).toHaveLength(1);
    expect(database.lockCount).toBe(2);

    const successful = results.find((result) => result.status === "fulfilled");
    expect(successful).toMatchObject({ status: "fulfilled", value: { totalAmountUzs: 882_000 } });
  });
});
