import { beforeEach, describe, expect, it, vi } from "vitest";
import { addUserStay, getAllStays, sanitizeUserStays } from "../client/src/data/stays";

describe("real stay source filtering", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = String(value);
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
  });

  it("prefers valid uploaded stays over the stock catalog when user listings exist", () => {
    localStorage.setItem(
      "uyjoy_user_stays",
      JSON.stringify([
        {
          id: 99,
          titleUz: "Mening uyim",
          titleRu: "Мой дом",
          titleEn: "My home",
          city: "Samarqand",
          region: "Urgut tumani",
          cityKeyUz: "city_samarkand",
          regionKeyUz: "region_samarkand",
          homeTypeUz: "Kvartira",
          homeTypeRu: "Квартира",
          homeTypeEn: "Apartment",
          images: ["https://example.com/my-real-home.jpg"],
          pricePerNight: 300000,
          rating: 5,
          reviewCount: 1,
          guestCount: 2,
          hostName: "Test User",
          hostAvatar: "https://example.com/avatar.jpg",
          featured: 0,
          lat: 39.6,
          lng: 66.9,
          category: "city",
          address: "Urgut tumani, Taroqli mahallasi",
          source: "user",
          amenities: ["wifi"],
          descUz: "real listing",
          descRu: "real listing",
          descEn: "real listing",
        },
      ]),
    );

    const stays = getAllStays();

    expect(stays.some((stay) => stay.source === "user")).toBe(true);
    expect(stays.every((stay) => stay.source !== "curated")).toBe(true);
  });

  it("removes stale stock-image placeholders from user entries", () => {
    const cleaned = sanitizeUserStays([
      {
        id: 1,
        titleUz: "Fake",
        titleRu: "Fake",
        titleEn: "Fake",
        city: "Samarqand",
        region: "Urgut tumani",
        cityKeyUz: "city_samarkand",
        regionKeyUz: "region_samarkand",
        homeTypeUz: "Uy",
        homeTypeRu: "Дом",
        homeTypeEn: "House",
        images: ["https://images.unsplash.com/photo-abc123"],
        pricePerNight: 100000,
        rating: 0,
        reviewCount: 0,
        guestCount: 2,
        hostName: "Test",
        hostAvatar: "https://example.com/avatar.jpg",
        featured: 0,
        lat: 39.6,
        lng: 66.9,
        category: "city",
        address: "Urgut tumani",
        source: "user",
        amenities: ["wifi"],
        descUz: "draft",
        descRu: "draft",
        descEn: "draft",
      } as any,
      {
        id: 2,
        titleUz: "Real",
        titleRu: "Real",
        titleEn: "Real",
        city: "Samarqand",
        region: "Urgut tumani",
        cityKeyUz: "city_samarkand",
        regionKeyUz: "region_samarkand",
        homeTypeUz: "Uy",
        homeTypeRu: "Дом",
        homeTypeEn: "House",
        images: ["https://example.com/real-home.jpg"],
        pricePerNight: 200000,
        rating: 0,
        reviewCount: 0,
        guestCount: 2,
        hostName: "Test",
        hostAvatar: "https://example.com/avatar.jpg",
        featured: 0,
        lat: 39.6,
        lng: 66.9,
        category: "city",
        address: "Urgut tumani",
        source: "user",
        amenities: ["wifi"],
        descUz: "real listing",
        descRu: "real listing",
        descEn: "real listing",
      } as any,
    ]);

    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].images[0]).toBe("https://example.com/real-home.jpg");
  });

  it("keeps locally uploaded data-URL images for a user listing", () => {
    const cleaned = sanitizeUserStays([
      {
        id: 12,
        titleUz: "Uploaded listing",
        titleRu: "Uploaded listing",
        titleEn: "Uploaded listing",
        city: "Samarqand",
        region: "Urgut tumani",
        cityKeyUz: "city_samarkand",
        regionKeyUz: "region_samarkand",
        homeTypeUz: "Kvartira",
        homeTypeRu: "Квартира",
        homeTypeEn: "Apartment",
        images: ["data:image/png;base64,AAAA", "https://example.com/real-home.jpg"],
        pricePerNight: 200000,
        rating: 0,
        reviewCount: 0,
        guestCount: 2,
        hostName: "Test",
        hostAvatar: "https://example.com/avatar.jpg",
        featured: 0,
        lat: 39.6,
        lng: 66.9,
        category: "city",
        address: "Urgut tumani",
        source: "user",
        amenities: ["wifi"],
        descUz: "real listing",
        descRu: "real listing",
        descEn: "real listing",
      } as any,
    ]);

    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].images).toContain("data:image/png;base64,AAAA");
    expect(cleaned[0].images).toContain("https://example.com/real-home.jpg");
  });

  it("stores only one active listing after a new upload", () => {
    addUserStay({
      titleUz: "First listing",
      city: "Samarqand",
      region: "Urgut tumani",
      homeTypeUz: "Kvartira",
      address: "Urgut Tumani Taroqli mahallasi",
      description: "real listing",
      images: ["https://example.com/first.jpg"],
      pricePerWeek: 300000,
      guestCount: 2,
      hostName: "Tester",
    });

    addUserStay({
      titleUz: "Second listing",
      city: "Samarqand",
      region: "Urgut tumani",
      homeTypeUz: "Kvartira",
      address: "Boshqa manzil",
      description: "fake second listing",
      images: ["https://example.com/second.jpg"],
      pricePerWeek: 400000,
      guestCount: 2,
      hostName: "Tester",
    });

    const stays = getAllStays();
    expect(stays).toHaveLength(1);
    expect(stays[0].titleUz).toBe("Second listing");
  });
});
