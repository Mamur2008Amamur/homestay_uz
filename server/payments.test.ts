import { describe, expect, it } from "vitest";
import { buildPaymeRequest, isPaymeConfigured } from "./payments.js";

describe("payme payment helpers", () => {
  it("builds a valid Payme JSON-RPC request payload", () => {
    const payload = buildPaymeRequest({
      id: 1,
      method: "CreateTransaction",
      amount: 250000,
      account: "booking-42",
    });

    expect(payload).toMatchObject({
      id: 1,
      method: "CreateTransaction",
      params: {
        amount: 250000,
        account: "booking-42",
      },
    });
  });

  it("accepts legacy Payme env aliases used by older deployments", () => {
    const previous = { ...process.env };
    process.env.PAYME_API_URL = "";
    process.env.PAYME_MERCHANT_ID = "";
    process.env.PAYME_SECRET_KEY = "";
    process.env.PAYME_URL = "https://legacy.example/payme";
    process.env.PAYME_MERCHANT = "legacy-merchant";
    process.env.PAYME_KEY = "legacy-secret";

    try {
      expect(isPaymeConfigured()).toBe(true);
    } finally {
      process.env = previous;
    }
  });

  it("reports when the Payme integration is not configured", () => {
    expect(isPaymeConfigured()).toBe(false);
  });
});
