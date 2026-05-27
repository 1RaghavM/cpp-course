"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authCallbackUrl } from "@/lib/auth/constants";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { createBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createBrowserClient();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${authCallbackUrl(origin)}?next=/update-password`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Check your email for a link to reset your password.");
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <AuthAlert variant="success">{message}</AuthAlert>
        <Link
          href="/login"
          className="block w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthField
        id="forgot-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        autoFocus
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-base transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send reset link"}
      </button>

      {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}

      <p className="text-center text-xs text-muted">
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
