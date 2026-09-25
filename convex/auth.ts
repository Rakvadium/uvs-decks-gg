import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import {
  HANDOFF_PROVIDER_ID,
  isValidHandoffCode,
  isValidHandoffState,
} from "../shared/auth-handoff";
import { isAllowedHandoffOrigin } from "../shared/hosts";

const SignUpProfileSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(1, "Username is required").max(20, "Username too long"),
});

function normalizeAuthEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new ConvexError("Invalid email format");
  }
  const normalized = email.trim().toLowerCase();
  const parsed = z.string().email("Invalid email format").safeParse(normalized);
  if (!parsed.success) {
    throw new ConvexError("Invalid email format");
  }
  return parsed.data;
}

const passwordProvider = Password({
  profile(params): { email: string } | { email: string; username: string } {
    const email = normalizeAuthEmail(params.email);
    if (params.flow === "signUp") {
      const username =
        typeof params.username === "string" ? params.username.trim() : params.username;
      const parsed = SignUpProfileSchema.safeParse({ email, username });
      if (!parsed.success) {
        throw new ConvexError(parsed.error.format());
      }
      return {
        email: parsed.data.email,
        username: parsed.data.username.trim().toLowerCase(),
      };
    }
    return { email };
  },
  validatePasswordRequirements: (password: string) => {
    if (password.length < 8 || !/\d/.test(password)) {
      throw new ConvexError("Password must be at least 8 characters with a number");
    }
  },
  reset: ResendOTPPasswordReset,
});

export default passwordProvider;

/** Redeems a one-time code minted on the apex (convex/authHandoff.ts). */
const handoffProvider = ConvexCredentials({
  id: HANDOFF_PROVIDER_ID,
  authorize: async (params, ctx) => {
    const { code, origin, state } = params;
    if (!isValidHandoffCode(code) || typeof origin !== "string" || !isAllowedHandoffOrigin(origin)) {
      return null;
    }
    if (state !== undefined && !isValidHandoffState(state)) {
      return null;
    }
    const userId = await ctx.runMutation(internal.authHandoff.consume, { code, origin, state });
    return userId ? { userId } : null;
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider, handoffProvider],
});
