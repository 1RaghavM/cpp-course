import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="We'll email you a link to choose a new password">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
