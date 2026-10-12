import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema.js";
import { sdk } from "./sdk.js";
import { COOKIE_NAME } from "../../shared/const.js";
import { loadUserFromToken } from "../auth.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    let token = "";
    const req = opts.req as any;
    const authHeader = req?.headers?.authorization;
    if (authHeader && String(authHeader).toLowerCase().startsWith("bearer ")) {
      token = String(authHeader).slice(7).trim();
    }
    if (!token) {
      const rawCookie: string = req?.headers?.cookie || "";
      const match = rawCookie.split(";").map((part: string) => part.trim()).find((part: string) => part.startsWith(`${COOKIE_NAME}=`));
      if (match) {
        token = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
      }
    }
    if (token) {
      const dbUser = await loadUserFromToken(token);
      if (dbUser) {
        user = dbUser as User;
      }
    }
  } catch {
    user = null;
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
