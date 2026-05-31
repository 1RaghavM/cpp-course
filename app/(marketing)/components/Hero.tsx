import Link from "next/link";
import { CodeCard } from "./CodeCard";

export function Hero() {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "calc(64px + clamp(60px, 10vw, 120px))",
        paddingBottom: "var(--section-y)",
      }}
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-glow), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="hp-container"
        style={{ position: "relative", maxWidth: "820px" }}
      >
        {/* Headline */}
        <h1
          className="hp-reveal"
          style={{
            fontSize: "var(--text-hero)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "var(--color-fg)",
            textAlign: "center",
            margin: 0,
          }}
        >
          Learn C++ the way it&rsquo;s actually written.
        </h1>

        {/* Sub-line */}
        <p
          className="hp-reveal hp-reveal-d1"
          style={{
            fontSize: "var(--text-body)",
            lineHeight: 1.6,
            color: "var(--color-fg-muted)",
            textAlign: "center",
            maxWidth: "580px",
            margin: "24px auto 0",
          }}
        >
          A structured, hands-on path through modern C++ — from first program to
          templates. Write real code in a sandboxed editor, get help from an AI
          tutor when you&rsquo;re stuck.
        </p>

        {/* CTAs */}
        <div
          className="hp-reveal hp-reveal-d2"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginTop: "40px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/register" className="hp-btn hp-btn-primary hp-btn-lg">
            Start learning C++
          </Link>
          <Link href="/login" className="hp-btn hp-btn-secondary hp-btn-lg">
            Sign in
          </Link>
        </div>

        {/* Code card */}
        <div className="hp-reveal hp-reveal-d3" style={{ marginTop: "56px" }}>
          <CodeCard />
        </div>
      </div>
    </section>
  );
}
