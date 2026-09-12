import { VerifyEmailResult } from "@/features/auth/verify-email-result";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const verificationToken = Array.isArray(token) ? token[0] : token;

  return <VerifyEmailResult token={verificationToken} />;
}
