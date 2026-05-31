import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="hp-section hp-section-border">
      <div
        className="hp-container"
        style={{ textAlign: "center", maxWidth: "600px" }}
      >
        <h2
          style={{
            fontSize: "var(--text-h2)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-fg)",
            marginBottom: "32px",
          }}
        >
          Start with the basics. No setup required.
        </h2>
        <Link href="/register" className="hp-btn hp-btn-primary hp-btn-lg">
          Start learning C++
        </Link>
      </div>
    </section>
  );
}
