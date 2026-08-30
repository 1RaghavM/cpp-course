"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authCallbackUrl } from "@/lib/auth/constants";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
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
      <div className="grid gap-4">
        <AuthAlert variant="success">{message}</AuthAlert>
        <Button variant="outline" render={<Link href="/login" />}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
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

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send reset link"}
      </Button>

      {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
