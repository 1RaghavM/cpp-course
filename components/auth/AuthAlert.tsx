type AuthAlertVariant = "success" | "error" | "info";

const VARIANT_CLASS: Record<AuthAlertVariant, string> = {
  success: "auth-alert auth-alert-success",
  error: "auth-alert auth-alert-error",
  info: "auth-alert auth-alert-info",
};

export function AuthAlert({
  variant,
  children,
}: {
  variant: AuthAlertVariant;
  children: React.ReactNode;
}) {
  return (
    <div className={VARIANT_CLASS[variant]} role={variant === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
