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
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <AuthAlert variant="success">{message}</AuthAlert>
        <Link href="/login" className="auth-secondary-btn">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

      <button type="submit" disabled={status === "loading"} className="auth-submit">
        {status === "loading" ? "Sending…" : "Send reset link"}
      </button>

      {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}

      <p className="auth-text-xs" style={{ textAlign: "center" }}>
        <Link href="/login" className="auth-link">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
