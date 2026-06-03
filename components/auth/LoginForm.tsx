"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

const fadeSlideUp = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 * (index + 1), duration: 0.3, ease: "easeOut" as const },
});

const buttonSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export function LoginForm() {
  const supabase = createBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <motion.div {...fadeSlideUp(0)}>
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
        </motion.div>

        <motion.div {...fadeSlideUp(1)}>
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
        </motion.div>

        <motion.div {...fadeSlideUp(2)}>
          <p className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </motion.div>

        <motion.div
          {...fadeSlideUp(3)}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          transition={{ ...fadeSlideUp(3).transition, ...buttonSpring }}
        >
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Please wait…" : "Sign in"}
          </Button>
        </motion.div>

        {status === "error" ? (
          <motion.div {...fadeSlideUp(4)}>
            <AuthAlert variant="error">{message}</AuthAlert>
          </motion.div>
        ) : null}
      </form>

      <motion.div {...fadeSlideUp(5)}>
        <AuthDivider />
      </motion.div>

      <motion.div {...fadeSlideUp(6)}>
        <GoogleAuthButton label="Sign in with Google" />
      </motion.div>
    </div>
  );
}
