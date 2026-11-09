import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { passwordRequirementError } from "./lib/password";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

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
        throw new ConvexError(parsed.error.issues[0]?.message ?? "Invalid sign-up details");
      }
      return {
        email: parsed.data.email,
        username: parsed.data.username.trim().toLowerCase(),
      };
    }
    return { email };
  },
  validatePasswordRequirements: (password: string) => {
    const message = passwordRequirementError(password);
    if (message) {
      throw new ConvexError(message);
    }
  },
  reset: ResendOTPPasswordReset,
});

export default passwordProvider;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider],
});
