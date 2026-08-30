"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authCallbackUrl } from "@/lib/auth/constants";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLegalNotice } from "@/components/auth/AuthLegalNotice";
// import { AuthDivider } from "@/components/auth/AuthDivider";
// import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { syncOnboardingFromStorage } from "@/lib/onboarding/sync";

export function RegisterForm() {
  const supabase = createBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: authCallbackUrl(origin) },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    if (data.session) {
      const result = await syncOnboardingFromStorage();
      router.push(result.status === "applied" ? "/onboarding?step=payoff" : "/dashboard");
      router.refresh();
      return;
    }

    setStatus("success");
    setMessage("Account created. Check your email to confirm your address, then sign in.");
  }

  if (status === "success") {
    return (
      <div className="grid gap-4">
        <AuthAlert variant="success">{message}</AuthAlert>
        <Button variant="outline" render={<Link href="/login" />}>
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <AuthField
          id="register-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />

        <AuthField
          id="register-password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          minLength={6}
        />

        <AuthField
          id="register-confirm"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat password"
          autoComplete="new-password"
          minLength={6}
        />

        <Button type="submit" disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Creating account…" : "Create account"}
        </Button>

        {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}
      </form>

      <AuthLegalNotice />

      {/* Google OAuth parked.
      <AuthDivider />
      <GoogleAuthButton label="Sign up with Google" />
      */}
    </div>
  );
}
