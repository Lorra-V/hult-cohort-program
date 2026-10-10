"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  type AuthActionState,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

const FORM_ERROR_ID = "forgot-password-error";

type Props = {
  initialError?: string | null;
};

export function ForgotPasswordForm({ initialError }: Props) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    forgotPasswordAction,
    initialError ? { error: initialError } : null,
  );
  const errorDescribedBy = state?.error ? FORM_ERROR_ID : undefined;

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>{state.success}</CardDescription>
        </CardHeader>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition hover:brightness-110"
        >
          Back to log in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter the email on your account and we’ll send a reset link.
        </CardDescription>
      </CardHeader>

      <form action={action} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={pending}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={errorDescribedBy}
        />

        {state?.error ? (
          <p
            id={FORM_ERROR_ID}
            role="alert"
            className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner size="sm" showLabel={false} label="Sending reset link" />
              Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-foreground-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
