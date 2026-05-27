"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { validateOwnerEmail } from "@/lib/auth/actions";
import { authCallbackUrl } from "@/lib/auth/constants";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { createBrowserClient } from "@/lib/supabase/client";

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

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    const ownerCheck = await validateOwnerEmail(email);
    if (!ownerCheck.ok) {
      setStatus("error");
      setMessage(ownerCheck.message);
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
      router.push("/");
      router.refresh();
      return;
    }

    setStatus("success");
    setMessage(
      "Account created. Check your email to confirm your address, then sign in.",
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <AuthAlert variant="success">{message}</AuthAlert>
        <Link
          href="/login"
          className="block w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-hover"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-base transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Creating account…" : "Create account"}
      </button>

      {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </form>
  );
}
