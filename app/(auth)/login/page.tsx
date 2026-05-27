import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthAlert } from "@/components/auth/AuthAlert";

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Sign-in link expired or is invalid. Request a new magic link.",
  forbidden: "This account is not authorized for this app.",
};

type LoginPageProps = {
  searchParams: { error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackError = searchParams.error
    ? (ERROR_MESSAGES[searchParams.error] ?? "Sign-in failed. Try again.")
    : null;

  return (
    <AuthShell
      title="cpproad"
      subtitle="Sign in to continue learning C++"
      footer={
        <p className="text-sm text-secondary">
          No account yet?{" "}
          <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
            Create one
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {callbackError ? <AuthAlert variant="error">{callbackError}</AuthAlert> : null}
        <LoginForm />
      </div>
    </AuthShell>
  );
}
