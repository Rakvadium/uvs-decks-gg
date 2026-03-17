import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

const ProfileSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  username: z.string().min(1, "Username is required").max(20, "Username too long"),
});

export default Password({
  profile(params) {
    const parsed = ProfileSchema.safeParse(params);
    if (!parsed.success) {
      throw new ConvexError(parsed.error.format());
    }
    return {
      email: parsed.data.email,
      username: parsed.data.username,
    };
  },
  validatePasswordRequirements: (password: string) => {
    if (password.length < 8 || !/\d/.test(password)) {
      throw new ConvexError("Password must be at least 8 characters with a number");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({ reset: ResendOTPPasswordReset })],
});