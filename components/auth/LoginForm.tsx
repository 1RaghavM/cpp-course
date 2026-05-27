"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { validateOwnerEmail } from "@/lib/auth/actions";
import { authCallbackUrl } from "@/lib/auth/constants";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { createBrowserClient } from "@/lib/supabase/client";

type LoginMode = "password" | "magic";

export function LoginForm() {
  const supabase = createBrowserClient();
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const ownerCheck = await validateOwnerEmail(email);
    if (!ownerCheck.ok) {
      setStatus("error");
      setMessage(ownerCheck.message);
      return;
    }

    const origin = window.location.origin;

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authCallbackUrl(origin) },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("success");
      setMessage("Check your email for the magic link.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (status === "success" && mode === "magic") {
    return <AuthAlert variant="success">{message}</AuthAlert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-lg border border-border bg-elevated p-1">
        {(["password", "magic"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setStatus("idle");
              setMessage("");
            }}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              mode === tab
                ? "bg-accent text-base shadow-sm"
                : "text-secondary hover:text-primary"
            }`}
          >
            {tab === "password" ? "Password" : "Magic link"}
          </button>
        ))}
      </div>

      <AuthField
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        autoFocus
      />

      {mode === "password" ? (
        <>
          <AuthField
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            minLength={6}
          />
          <p className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-muted transition-colors hover:text-accent"
            >
              Forgot password?
            </Link>
          </p>
        </>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-base transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading"
          ? "Please wait…"
          : mode === "password"
            ? "Sign in"
            : "Send magic link"}
      </button>

      {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}
    </form>
  );
}
