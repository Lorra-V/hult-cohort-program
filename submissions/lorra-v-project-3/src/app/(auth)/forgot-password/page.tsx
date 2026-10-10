import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { authErrorFromSearchParam } from "@/lib/auth/errors";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialError = authErrorFromSearchParam(params.error);

  return <ForgotPasswordForm initialError={initialError} />;
}
