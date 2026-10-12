import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { createBooking, createListing, getLatestVerificationCode, getListingById, markVerificationCodeUsed, searchListings, toggleWishlist } from "./db.js";
import { createSessionToken, clearSessionCookie, loginWithEmail, normalizeEmail, registerWithEmail, requestEmailVerificationForUser, requestPasswordReset, resetPasswordWithCode, setSessionCookie, verifyEmailForUser } from "./auth.js";
import { createPaymeCheckout } from "./payments.js";
import { requestEmailVerification, verifyEmailCode } from "./verification.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => {
      if (!opts.ctx.user) return null;
      return {
        id: opts.ctx.user.id,
        name: opts.ctx.user.name,
        email: opts.ctx.user.email,
        role: opts.ctx.user.role,
        loginMethod: opts.ctx.user.loginMethod,
        emailVerifiedAt: opts.ctx.user.emailVerifiedAt,
      };
    }),
    register: publicProcedure.input(z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().email(),
      password: z.string().min(8).max(128),
    })).mutation(async ({ ctx, input }) => {
      const result = await registerWithEmail(input);
      if (!result.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      const user = await loginWithEmail({ email: input.email, password: input.password, ip: ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown" });
      if (!user.ok || !user.user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user session." });
      }

      try {
        await requestEmailVerificationForUser(result.userId, input.email);
      } catch (e) {
        console.warn("[Auth] Verification code delivery skipped:", e);
      }

      const token = await createSessionToken({
        id: user.user.id,
        role: user.user.role,
        passwordChangedAt: user.user.passwordChangedAt ?? null,
      });
      setSessionCookie(ctx.res, ctx.req, token);
      return { ok: true, requiresVerification: false, user: user.user };
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(8).max(128),
    })).mutation(async ({ ctx, input }) => {
      const result = await loginWithEmail({
        email: input.email,
        password: input.password,
        ip: ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown",
      });
      if (!result.ok || !result.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: result.error || "Invalid email or password." });
      }

      const token = await createSessionToken({
        id: result.user.id,
        role: result.user.role,
        passwordChangedAt: result.user.passwordChangedAt ?? null,
      });
      setSessionCookie(ctx.res, ctx.req, token);
      return { ok: true, user: result.user };
    }),
    verifyEmail: publicProcedure.input(z.object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
    })).mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      let userId = ctx.user?.id;
      if (!userId) {
        const account = await (await import("./auth.js")).findUserByEmail(email);
        userId = account?.id;
      }
      if (!userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      const verified = await verifyEmailForUser(userId, email, input.code);
      if (!verified.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The verification code is incorrect or expired." });
      }
      return { ok: true };
    }),
    requestVerification: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      let userId = ctx.user?.id;
      if (!userId) {
        const account = await (await import("./auth.js")).findUserByEmail(email);
        userId = account?.id;
      }
      if (!userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      await requestEmailVerificationForUser(userId, email);
      return { ok: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearSessionCookie(ctx.res, ctx.req);
      return { success: true } as const;
    }),
    forgotPassword: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      await requestPasswordReset(input.email);
      return { ok: true };
    }),
    resetPassword: publicProcedure.input(z.object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
      password: z.string().min(8).max(128),
    })).mutation(async ({ input }) => {
      const result = await resetPasswordWithCode(input);
      if (!result.ok) throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      return { ok: true };
    }),
  }),
  listings: router({
    search: publicProcedure.input(z.object({ query: z.string().optional(), city: z.string().optional() }).optional()).query(({ input }) => searchListings(input?.query, input?.city)),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => (await getListingById(input.id)) ?? null),
    create: protectedProcedure.input(z.object({
      title: z.string().trim().min(3).max(255),
      city: z.string().trim().min(1).max(120),
      region: z.string().trim().min(1).max(120),
      address: z.string().trim().min(3).max(400),
      description: z.string().trim().max(4000).default(""),
      imageUrl: z.string().trim().min(1),
      images: z.array(z.string()).optional(),
      amenities: z.array(z.string()).optional(),
      phone1: z.string().optional(),
      telegram: z.string().optional(),
      pricePerWeek: z.number().int().positive().max(500_000_000),
      guestCount: z.number().int().min(1).max(50),
      homeType: z.string().trim().min(1).max(80),
      hostAvatar: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const pricePerNight = Math.round(input.pricePerWeek / 7);
      const saved = await createListing({
        userId: ctx.user.id,
        title: input.title,
        city: input.city,
        region: input.region,
        description: input.description,
        imageUrl: input.imageUrl,
        images: input.images,
        amenities: input.amenities,
        phone1: input.phone1,
        telegram: input.telegram,
        pricePerNight,
        pricePerWeek: input.pricePerWeek,
        guestCount: input.guestCount,
        homeType: input.homeType,
        hostName: ctx.user.name ?? "UyJoy xonadoshi",
        hostAvatar: input.hostAvatar,
        address: input.address,
      });
      return { ...saved, pricePerNight };
    }),
  }),
  wishlist: router({
    toggle: protectedProcedure.input(z.object({ listingId: z.number() })).mutation(({ ctx, input }) => toggleWishlist(ctx.user.id, input.listingId)),
  }),
  verification: router({
    requestCode: protectedProcedure.input(z.object({ email: z.string().email() })).mutation(({ ctx, input }) => requestEmailVerification(ctx.user.id, input.email)),
    verifyCode: protectedProcedure.input(z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) })).mutation(({ ctx, input }) => verifyEmailCode(ctx.user.id, input.email, input.code)),
  }),
  payments: router({
    create: protectedProcedure.input(z.object({
      bookingId: z.number().int().positive(),
      amount: z.number().positive(),
      method: z.enum(["card", "payme", "click"]).default("payme"),
      phone: z.string().optional(),
      account: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const checkout = await createPaymeCheckout({
        bookingId: input.bookingId,
        amount: input.amount,
        method: input.method,
        account: input.account,
        phone: input.phone,
      });

      return {
        ok: true,
        paymentId: checkout.checkoutId,
        provider: checkout.provider,
        mode: checkout.mode,
        redirectUrl: checkout.redirectUrl,
        amount: checkout.amountTiyin,
      };
    }),
  }),
  bookings: router({
    create: protectedProcedure.input(z.object({ stayId: z.number().int().positive(), email: z.string().email(), checkIn: z.coerce.date(), checkOut: z.coerce.date(), guests: z.number().int().min(1) })).mutation(async ({ ctx, input }) => {
      const verification = await getLatestVerificationCode(ctx.user.id, input.email.trim().toLowerCase());
      if (!verification?.verifiedAt || Date.now() - verification.verifiedAt.getTime() > 15 * 60 * 1000) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Avval email orqali bronni tasdiqlang." });
      }
      const { email: _email, ...bookingInput } = input;
      const result = await createBooking({ userId: ctx.user.id, ...bookingInput });
      await markVerificationCodeUsed(verification.id);
      return result;
    }),
  }),
});
export type AppRouter = typeof appRouter;
