type AuthAlertVariant = "success" | "error" | "info";

const VARIANT_STYLES: Record<AuthAlertVariant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-error/30 bg-error/10 text-error",
  info: "border-accent/30 bg-accent/10 text-accent",
};

export function AuthAlert({
  variant,
  children,
}: {
  variant: AuthAlertVariant;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-4 text-center text-sm ${VARIANT_STYLES[variant]}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
