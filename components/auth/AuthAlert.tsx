"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

type AuthAlertVariant = "success" | "error" | "info";

const VARIANT_CONFIG: Record<
  AuthAlertVariant,
  { variant: "default" | "destructive"; icon: React.ReactNode; className: string }
> = {
  error: {
    variant: "destructive",
    icon: <CircleAlert className="size-4" />,
    className: "",
  },
  success: {
    variant: "default",
    icon: <CircleCheck className="size-4" />,
    className: "border-green-500/50 text-green-600 dark:text-green-400",
  },
  info: {
    variant: "default",
    icon: <Info className="size-4" />,
    className: "",
  },
};

export function AuthAlert({
  variant,
  children,
}: {
  variant: AuthAlertVariant;
  children: React.ReactNode;
}) {
  const config = VARIANT_CONFIG[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={variant}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Alert
          variant={config.variant}
          className={config.className}
          role={variant === "error" ? "alert" : "status"}
        >
          {config.icon}
          <AlertDescription>{children}</AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
