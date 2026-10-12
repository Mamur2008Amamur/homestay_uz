import "dotenv/config";
import nodemailer from "nodemailer";
import { describe, expect, it } from "vitest";

describe("Gmail SMTP configuration", () => {
  it("authenticates without sending an email", async () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 0);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    expect(host, "SMTP_HOST is required").toBeTruthy();
    expect(port, "SMTP_PORT is required").toBeGreaterThan(0);
    expect(user, "SMTP_USER is required").toBeTruthy();
    expect(pass, "SMTP_PASS must be a Gmail App Password").toBeTruthy();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 12_000,
    });

    try {
      await expect(transporter.verify()).resolves.toBe(true);
    } finally {
      transporter.close();
    }
  }, 20_000);
});
