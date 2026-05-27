import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="New password" subtitle="Choose a password for your account">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
