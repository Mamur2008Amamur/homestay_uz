import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateStayTotal, normalizeUtcDate, validateBookingInput } from "./db";

describe("booking validation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates total price from nightly rate, nights, and service fee", () => {
    expect(calculateStayTotal({ pricePerNight: 420000, nights: 3, serviceFeeRate: 0.05 })).toBe(1323000);
  });

  it("normalizes booking dates to UTC days and calculates whole nights", () => {
    const booking = validateBookingInput({
      checkIn: new Date("2030-01-10T23:59:59.999Z"),
      checkOut: new Date("2030-01-12T00:00:00.000Z"),
      guests: 2,
      stayGuestCount: 4,
      pricePerNight: 420000,
    });

    expect(booking.checkIn.toISOString()).toBe("2030-01-10T00:00:00.000Z");
    expect(booking.checkOut.toISOString()).toBe("2030-01-12T00:00:00.000Z");
    expect(booking.nights).toBe(2);
    expect(booking.totalAmountUzs).toBe(882000);
    expect(normalizeUtcDate(new Date("2030-01-10T18:00:00.000Z")).toISOString()).toBe("2030-01-10T00:00:00.000Z");
  });

  it("rejects past, invalid, too-long, and over-capacity bookings", () => {
    expect(() =>
      validateBookingInput({
        checkIn: new Date("2029-12-31T00:00:00.000Z"),
        checkOut: new Date("2030-01-02T00:00:00.000Z"),
        guests: 1,
        stayGuestCount: 4,
        pricePerNight: 420000,
      }),
    ).toThrow("past");

    expect(() =>
      validateBookingInput({
        checkIn: new Date("2030-01-10T00:00:00.000Z"),
        checkOut: new Date("2030-01-10T23:59:59.000Z"),
        guests: 1,
        stayGuestCount: 4,
        pricePerNight: 420000,
      }),
    ).toThrow();

    expect(() =>
      validateBookingInput({
        checkIn: new Date("2030-01-10T00:00:00.000Z"),
        checkOut: new Date("2030-02-10T00:00:00.000Z"),
        guests: 1,
        stayGuestCount: 4,
        pricePerNight: 420000,
      }),
    ).toThrow("30 nights");

    expect(() =>
      validateBookingInput({
        checkIn: new Date("2030-01-10T00:00:00.000Z"),
        checkOut: new Date("2030-01-12T00:00:00.000Z"),
        guests: 5,
        stayGuestCount: 4,
        pricePerNight: 420000,
      }),
    ).toThrow();
  });
});
