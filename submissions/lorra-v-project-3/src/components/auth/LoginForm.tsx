"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

type Props = {
  next?: string;
  initialError?: string | null;
};

const FORM_ERROR_ID = "login-error";

export function LoginForm({ next = "/dashboard", initialError }: Props) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    initialError ? { error: initialError } : null,
  );
  const errorDescribedBy = state?.error ? FORM_ERROR_ID : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage your profile, projects, and campaigns.
        </CardDescription>
      </CardHeader>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          disabled={pending}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={errorDescribedBy}
        />
        <p className="text-sm">
          <Link href="/forgot-password" className="text-accent hover:underline">
            Forgot password?
          </Link>
        </p>

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
              <Spinner size="sm" showLabel={false} label="Signing in" />
              Signing in…
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-foreground-muted">
        New here?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
