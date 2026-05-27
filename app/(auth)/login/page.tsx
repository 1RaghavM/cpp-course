"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("success");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-base text-sm font-bold">
            C++
          </span>
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-primary">cpproad</h1>
        <p className="mb-8 text-center text-sm text-secondary">Sign in to continue</p>

        {status === "success" ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center text-sm text-success">
            Check your email for the magic link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-primary placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-base transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send magic link"}
            </button>

            {status === "error" && (
              <p className="rounded-lg border border-error/30 bg-error/10 p-3 text-center text-sm text-error">
                {errorMessage}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
