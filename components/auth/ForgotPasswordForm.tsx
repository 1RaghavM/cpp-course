"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authCallbackUrl } from "@/lib/auth/constants";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

const fadeSlideUp = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 * (index + 1), duration: 0.3, ease: "easeOut" as const },
});

const buttonSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

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
      <AnimatePresence>
        <motion.div
          className="grid gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <AuthAlert variant="success">{message}</AuthAlert>
          <Button variant="outline" render={<Link href="/login" />}>
            Back to sign in
          </Button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <motion.div {...fadeSlideUp(0)}>
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
      </motion.div>

      <motion.div
        {...fadeSlideUp(1)}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        transition={{ ...fadeSlideUp(1).transition, ...buttonSpring }}
      >
        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send reset link"}
        </Button>
      </motion.div>

      {status === "error" ? (
        <motion.div {...fadeSlideUp(2)}>
          <AuthAlert variant="error">{message}</AuthAlert>
        </motion.div>
      ) : null}

      <motion.div {...fadeSlideUp(2)}>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </form>
  );
}
