import { createHash, randomInt } from "node:crypto";
import nodemailer from "nodemailer";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env.js";
import { createVerificationCode, getLatestVerificationCode, markVerificationCodeUsed } from "./db.js";

const CODE_TTL_MS = 10 * 60 * 1000;
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

function createMailTransport() {
  const port = Number(ENV.smtpPort);
  if (!Number.isFinite(port) || port <= 0) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "SMTP port noto‘g‘ri kiritilgan." });
  }
  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass || !ENV.emailFrom) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gmail SMTP sozlamalari to‘liq kiritilmagan." });
  }
  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
    tls: { minVersion: "TLSv1.2" },
  });
}

export async function sendVerificationEmail(to: string, code: string, purpose = "Ro'yxatdan o'tishni tasdiqlash") {
  const transporter = createMailTransport();
  try {
    await transporter.sendMail({
      from: ENV.emailFrom,
      to,
      subject: `UyJoy tasdiqlash kodi: ${code}`,
      text: `UyJoy tasdiqlash kodingiz: ${code}. Kod 10 daqiqa amal qiladi. Agar bu so‘rovni siz yubormagan bo‘lsangiz, ushbu xabarni e’tiborsiz qoldiring.`,
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:24px;overflow:hidden;background:#ffffff;">
          <div style="background:#e8175d;padding:28px 24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:-0.5px;">uyjoy.uz</h1>
            <p style="color:#ffe6ee;margin:6px 0 0 0;font-size:14px;">O'zbekistonda uydek sayohat</p>
          </div>
          <div style="padding:32px 28px;color:#183a37;">
            <h2 style="margin:0 0 12px 0;font-size:20px;color:#183a37;">${purpose}</h2>
            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#555;">Hisobingizni tasdiqlash va tizimga kirish uchun quyidagi bir martalik 6 xonali kodni kiriting:</p>
            <div style="font-size:36px;letter-spacing:10px;font-weight:800;background:#fdf2f5;color:#e8175d;padding:20px;border-radius:16px;text-align:center;border:2px dashed #f6b5c9;font-family:monospace;">
              ${code}
            </div>
            <p style="margin:24px 0 0 0;font-size:13px;color:#888;text-align:center;">Ushbu kod 10 daqiqa davomida amal qiladi.</p>
          </div>
          <div style="background:#faf8f6;padding:16px 24px;border-top:1px solid #f0ebe6;text-align:center;font-size:12px;color:#999;">
            Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.<br/>
            © 2026 UyJoy — Barcha huquqlar himoyalangan.
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[SMTP] Verification email failed", error instanceof Error ? error.message : "unknown error");
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Tasdiqlash emailini yuborib bo‘lmadi. SMTP sozlamalarini tekshiring." });
  } finally {
    transporter.close();
  }
}

export async function requestEmailVerification(userId: number, email: string) {
  const normalized = normalizeEmail(email);
  const code = String(randomInt(100000, 1000000));
  await createVerificationCode({ userId, email: normalized, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) });
  await sendVerificationEmail(normalized, code);
  return { sent: true as const, expiresInSeconds: CODE_TTL_MS / 1000 };
}

export async function verifyEmailCode(userId: number, email: string, code: string) {
  const normalized = normalizeEmail(email);
  const record = await getLatestVerificationCode(userId, normalized);
  if (!record || record.verifiedAt || record.expiresAt.getTime() < Date.now() || record.codeHash !== hashCode(code)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Kod noto‘g‘ri yoki muddati tugagan." });
  }
  await markVerificationCodeUsed(record.id);
  return { verified: true as const };
}
