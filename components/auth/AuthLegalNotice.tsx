import Link from "next/link";

export function AuthLegalNotice() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      By continuing, you agree to our{" "}
      <Link href="/terms" className="text-primary hover:underline">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="text-primary hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
