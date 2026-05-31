import Link from "next/link";

export function Footer() {
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
          <span style={{ fontFamily: "var(--hp-font-mono)", fontWeight: 600 }}>
            cpproad
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/login"
              style={{ color: "var(--color-fg-subtle)", textDecoration: "none" }}
            >
              Sign in
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
