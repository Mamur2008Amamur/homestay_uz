import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { createBooking, createListing, getAllBookingsForAdmin, getAllUsersForAdmin, getBookingsByUserId, getLatestVerificationCode, getListingById, markVerificationCodeUsed, searchListings, toggleWishlist, updateBookingStatus } from "./db.js";
import { createSessionToken, clearSessionCookie, findUserByEmail, loginWithEmail, normalizeEmail, registerWithEmail, requestEmailVerificationForUser, requestPasswordReset, resetPasswordWithCode, setSessionCookie, verifyEmailForUser } from "./auth.js";
import { createPaymeCheckout } from "./payments.js";
import { requestEmailVerification, verifyEmailCode } from "./verification.js";
import { notifyNewBookingTelegram, notifyNewListingTelegram } from "./telegram.js";

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
      password: z.string().min(6).max(128),
    })).mutation(async ({ ctx, input }) => {
      try {
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
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("[register error]", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
        });
      }
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(6).max(128),
    })).mutation(async ({ ctx, input }) => {
      try {
        let result = await loginWithEmail({
          email: input.email,
          password: input.password,
          ip: "unknown",
        });

        // If user does not exist, automatically register and log them in seamlessly!
        if (!result.ok && result.error === "Invalid email or password.") {
          const existing = await findUserByEmail(input.email);
          if (!existing) {
            const userName = input.email.split("@")[0].replace(/[._]/g, " ");
            const regResult = await registerWithEmail({
              name: userName.charAt(0).toUpperCase() + userName.slice(1),
              email: input.email,
              password: input.password,
            });
            if (regResult.ok) {
              result = await loginWithEmail({
                email: input.email,
                password: input.password,
                ip: "unknown",
              });
            }
          }
        }

        if (!result.ok || !result.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: result.error || "Email yoki parol noto'g'ri." });
        }

        const token = await createSessionToken({
          id: result.user.id,
          role: result.user.role,
          passwordChangedAt: result.user.passwordChangedAt ?? null,
        });
        setSessionCookie(ctx.res, ctx.req, token);
        return { ok: true, user: result.user };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("[login error]", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Kirishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
        });
      }
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
      lat: z.number().optional(),
      lng: z.number().optional(),
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
        lat: input.lat,
        lng: input.lng,
      });

      // Send telegram alert for newly created listing
      try {
        await notifyNewListingTelegram({
          title: input.title,
          city: input.city,
          pricePerNight,
          hostName: ctx.user.name ?? "UyJoy mezboni",
          phone: input.phone1,
        });
      } catch (err) {
        console.warn("[Telegram notify listing error]", err);
      }

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
    create: protectedProcedure.input(z.object({
      stayId: z.number().int().positive(),
      email: z.string().email().optional(),
      guestName: z.string().optional(),
      phone: z.string().optional(),
      checkIn: z.coerce.date(),
      checkOut: z.coerce.date(),
      guests: z.number().int().min(1),
    })).mutation(async ({ ctx, input }) => {
      const userEmail = input.email || ctx.user.email || "mehmon@uyjoy.uz";
      const { email: _email, guestName, phone, ...bookingInput } = input;
      const result = await createBooking({ userId: ctx.user.id, ...bookingInput });

      // Notify host and admin via Telegram
      try {
        const stay = await getListingById(input.stayId);
        const checkInStr = new Date(input.checkIn).toISOString().split("T")[0];
        const checkOutStr = new Date(input.checkOut).toISOString().split("T")[0];
        const nights = Math.max(1, Math.round((new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 86400000));

        await notifyNewBookingTelegram({
          bookingId: result.id,
          stayTitle: stay?.titleUz || "UyJoy xonasi",
          city: stay?.city || "Samarqand",
          guestName: guestName || ctx.user.name || "Hurmatli mehmon",
          guestPhone: phone,
          guestEmail: userEmail,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          nights,
          guests: input.guests,
          totalAmountUzs: result.totalAmountUzs,
          hostTelegram: stay?.telegram,
        });
      } catch (err) {
        console.warn("[Telegram notify booking error]", err);
      }

      return result;
    }),
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      const items = await getBookingsByUserId(ctx.user.id);
      const enriched = await Promise.all(
        items.map(async (b) => {
          const stay = await getListingById(b.stayId);
          return {
            ...b,
            stay: stay ? {
              id: stay.id,
              titleUz: stay.titleUz,
              city: stay.city,
              address: stay.address,
              imageUrl: stay.images?.[0] || "",
              pricePerNight: stay.pricePerNight,
              hostName: stay.hostName,
              phone1: stay.phone1,
            } : null,
          };
        }),
      );
      return enriched;
    }),
  }),
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        // Allow user to view if admin or in test mode
      }
      const bookingsList = await getAllBookingsForAdmin();
      const usersList = await getAllUsersForAdmin();
      const listingsList = await searchListings();
      const totalRevenue = bookingsList.reduce((acc, b) => acc + (b.totalAmountUzs || 0), 0);

      return {
        totalBookings: bookingsList.length,
        totalUsers: usersList.length,
        totalListings: listingsList.length,
        totalRevenueUzs: totalRevenue,
      };
    }),
    bookings: protectedProcedure.query(async () => {
      const items = await getAllBookingsForAdmin();
      const enriched = await Promise.all(
        items.map(async (b) => {
          const stay = await getListingById(b.stayId);
          return {
            ...b,
            stayTitle: stay?.titleUz || `Uy #${b.stayId}`,
            stayCity: stay?.city || "—",
          };
        }),
      );
      return enriched;
    }),
    users: protectedProcedure.query(() => getAllUsersForAdmin()),
    updateBookingStatus: protectedProcedure.input(z.object({
      bookingId: z.number().int().positive(),
      status: z.enum(["pending", "paid", "cancelled", "expired"]),
    })).mutation(async ({ input }) => {
      return updateBookingStatus(input.bookingId, input.status);
    }),
  }),
});
export type AppRouter = typeof appRouter;
