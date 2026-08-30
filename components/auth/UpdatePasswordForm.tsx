"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const supabase = createBrowserClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <AuthField
        id="new-password"
        label="New password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={6}
      />

      <AuthField
        id="confirm-new-password"
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        minLength={6}
      />

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Saving…" : "Save password"}
      </Button>

      {status === "error" ? <AuthAlert variant="error">{message}</AuthAlert> : null}
    </form>
  );
}
