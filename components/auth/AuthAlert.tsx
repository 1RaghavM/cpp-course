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
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-safe:ease-out">
      <Alert
        variant={config.variant}
        className={config.className}
        role={variant === "error" ? "alert" : "status"}
      >
        {config.icon}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    </div>
  );
}
