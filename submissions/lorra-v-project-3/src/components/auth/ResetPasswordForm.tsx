"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
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

const FORM_ERROR_ID = "reset-password-error";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    resetPasswordAction,
    null,
  );
  const errorDescribedBy = state?.error ? FORM_ERROR_ID : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          This replaces the password on your Comentiq account.
        </CardDescription>
      </CardHeader>

      <form action={action} className="space-y-4">
        <Input
          label="New password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          disabled={pending}
          hint="At least 6 characters."
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={errorDescribedBy}
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your new password"
          required
          minLength={6}
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
              <Spinner size="sm" showLabel={false} label="Updating password" />
              Updating password…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-foreground-muted">
        Need a new link?{" "}
        <Link href="/forgot-password" className="text-accent hover:underline">
          Request another reset
        </Link>
      </p>
    </Card>
  );
}
