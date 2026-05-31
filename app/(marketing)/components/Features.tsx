const FEATURES = [
  {
    title: "Pointers & memory",
    description:
      "Pointers stop being scary once you can see what they point at.",
    code: "int* ptr = &x;",
  },
  {
    title: "The STL in practice",
    description:
      "Vectors, maps, algorithms — learn the standard library by using it.",
    code: "std::vector<int>",
  },
  {
    title: "Templates & generics",
    description:
      "Write code that works with any type, without the mystery.",
    code: "template<typename T>",
  },
  {
    title: "Compile, link, debug",
    description:
      "Understand what happens between 'Save' and 'Run'.",
    code: "g++ -std=c++17",
  },
] as const;

export function Features() {
  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container">
        <h2
          style={{
            fontSize: "var(--text-h2)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-fg)",
            textAlign: "center",
            marginBottom: "56px",
          }}
        >
          What you&rsquo;ll actually learn
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
          }}
          className="features-grid"
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <h3
                style={{
                  fontSize: "var(--text-h3)",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: "var(--color-fg)",
                  margin: "0 0 8px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "var(--text-body)",
                  lineHeight: 1.6,
                  color: "var(--color-fg-muted)",
                  margin: "0 0 16px",
                }}
              >
                {feature.description}
              </p>
              <code
                style={{
                  fontFamily: "var(--hp-font-mono)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-fg-subtle)",
                }}
              >
                {feature.code}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
