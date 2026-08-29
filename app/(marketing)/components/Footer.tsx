import Image from "next/image";
import Link from "next/link";

export function Footer({ isSignedIn = false }: { isSignedIn?: boolean } = {}) {
  return (
    <footer style={{ borderTop: "var(--hairline)" }}>
      <div className="hp-container" style={{ padding: "20px var(--container-pad)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "var(--text-sm)",
            color: "var(--color-fg-subtle)",
          }}
        >
          <Image src="/fulllogo-Photoroom.png" alt="cpproad" width={128} height={32} style={{ height: "32px", width: "auto" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Privacy / Terms hidden until Google OAuth signup is restored.
            <Link href="/privacy" style={{ color: "var(--color-fg-subtle)", textDecoration: "none" }}>
              Privacy
            </Link>
            <Link href="/terms" style={{ color: "var(--color-fg-subtle)", textDecoration: "none" }}>
              Terms
            </Link>
            */}
            {isSignedIn ? (
              <Link href="/dashboard" style={{ color: "var(--color-fg-subtle)", textDecoration: "none" }}>
                Dashboard
              </Link>
            ) : (
              <Link href="/login" style={{ color: "var(--color-fg-subtle)", textDecoration: "none" }}>
                Sign in
              </Link>
            )}
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
