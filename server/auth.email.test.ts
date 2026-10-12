import { describe, expect, it } from "vitest";
import {
  isStrongPassword,
  registerWithEmail,
  verifyPassword,
} from "./auth.js";

describe("email auth", () => {
  it("rejects weak passwords", () => {
    expect(isStrongPassword("12345678")).toBe(false);
    expect(isStrongPassword("Password123")).toBe(false);
    expect(isStrongPassword("StrongPass!2026")).toBe(true);
  });

  it("registers unique case-insensitive emails", async () => {
    const reg1 = await registerWithEmail({
      name: "Test User",
      email: "TEST@EXAMPLE.COM",
      password: "StrongPass!2026",
    });

    expect(reg1.ok).toBe(true);

    const reg2 = await registerWithEmail({
      name: "Other User",
      email: "test@example.com",
      password: "StrongPass!2026",
    });

    expect(reg2.ok).toBe(false);
    expect(reg2.error).toMatch(/already|exists|used/i);
  });

  it("verifies a bcrypt hash", async () => {
    const hash = await registerWithEmail({
      name: "A",
      email: "a@example.com",
      password: "StrongPass!2026",
    }).then((result) => result.hash);

    expect(hash).toBeTruthy();
    await expect(verifyPassword("StrongPass!2026", hash!)).resolves.toBe(true);
  });
});
