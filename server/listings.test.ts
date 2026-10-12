import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("listings router", () => {
  it("returns a list for the public search endpoint", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.listings.search({ query: "Samarqand" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns null instead of undefined for a missing listing", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.listings.byId({ id: 999999 });
    expect(result).toBeNull();
  });

  it("rejects wishlist mutations for signed-out visitors", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.wishlist.toggle({ listingId: 101 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects listing creation for signed-out visitors", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.listings.create({
      title: "Test uy", city: "Samarqand", region: "Samarqand viloyati",
      address: "Mirzo Ulug'bek ko'chasi, 9-dom, 101-xona", description: "",
      imageUrl: "https://example.com/a.jpg", pricePerWeek: 300000, guestCount: 2, homeType: "Kvartira",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a listing with a non-positive weekly price", async () => {
    const caller = appRouter.createCaller({ ...createContext(), user: { id: 1, openId: "o", name: "Test", email: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), loginMethod: null } });
    await expect(caller.listings.create({
      title: "Test uy", city: "Samarqand", region: "Samarqand viloyati",
      address: "Mirzo Ulug'bek ko'chasi, 9-dom, 101-xona", description: "",
      imageUrl: "https://example.com/a.jpg", pricePerWeek: 0, guestCount: 2, homeType: "Kvartira",
    })).rejects.toThrow();
  });
});
