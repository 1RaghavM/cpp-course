import Link from "next/link";
import { Reveal } from "./Reveal";

export function FinalCTA({ isSignedIn = false }: { isSignedIn?: boolean } = {}) {
  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container" style={{ textAlign: "center", maxWidth: "600px" }}>
        <Reveal>
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
            {isSignedIn ? "Continue where you left off." : "Start with the basics. No setup required."}
          </h2>
          {isSignedIn ? (
            <Link href="/dashboard" className="hp-btn hp-btn-primary hp-btn-lg">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/onboarding" className="hp-btn hp-btn-primary hp-btn-lg">
              Start learning C++
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
