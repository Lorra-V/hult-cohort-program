"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { friendlyAuthError } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/auth/schemas";
import { clientIpFromHeaders, takeRateLimit } from "@/lib/rate-limit";

const RESET_SENT =
  "If an account exists for that email, we've sent a reset link.";

const RESET_RATE_LIMIT = 5;
const RESET_RATE_WINDOW_MS = 15 * 60 * 1000;

export type AuthActionState = {
  error?: string;
  success?: string;
} | null;

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "/dashboard"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const next = safeRedirectPath(parsed.data.next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: friendlyAuthError(error?.message) };
  }

  const result = await ensureProfileForUser({
    id: data.user.id,
    email: data.user.email,
    name:
      (data.user.user_metadata?.name as string | undefined) ||
      (data.user.user_metadata?.full_name as string | undefined) ||
      null,
  });

  if (!result.ok) {
    await supabase.auth.signOut();
    return { error: friendlyAuthError(result.reason) };
  }

  redirect(next);
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  // Email confirmation disabled → session present; bootstrap profile now.
  if (data.user && data.session) {
    const result = await ensureProfileForUser({
      id: data.user.id,
      email: data.user.email,
      name: parsed.data.name,
    });

    if (!result.ok) {
      await supabase.auth.signOut();
      return { error: friendlyAuthError(result.reason) };
    }

    redirect("/dashboard");
  }

  // Email confirmation required.
  return {
    success:
      "Account created. Check your email for a confirmation link, then log in.",
  };
}

function hidesUnknownAccount(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("user not found") ||
    lower.includes("no user found") ||
    lower.includes("not registered")
  );
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const limited = takeRateLimit(
    `password-reset:${ip}`,
    RESET_RATE_LIMIT,
    RESET_RATE_WINDOW_MS,
  );
  if (!limited.ok) {
    return { error: "Too many attempts. Wait a moment and try again." };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error && !hidesUnknownAccount(error.message)) {
    return { error: friendlyAuthError(error.message) };
  }

  return { success: RESET_SENT };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=recovery_session");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
