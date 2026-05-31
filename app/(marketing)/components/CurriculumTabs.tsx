"use client";

import { useState } from "react";

const STAGES = [
  {
    label: "Basics",
    topics: [
      "Variables & types",
      "Control flow",
      "Functions",
      "Arrays & strings",
      "I/O streams",
      "Operators & expressions",
    ],
  },
  {
    label: "Memory & OOP",
    topics: [
      "Pointers & references",
      "Dynamic allocation",
      "Classes & objects",
      "Inheritance",
      "Operator overloading",
      "Scope & namespaces",
    ],
  },
  {
    label: "STL & Templates",
    topics: [
      "std::vector & std::array",
      "Iterators",
      "Algorithms",
      "Function & class templates",
      "Smart pointers",
      "Containers & adaptors",
    ],
  },
  {
    label: "Advanced",
    topics: [
      "Move semantics",
      "Exceptions",
      "Lambda expressions",
      "The preprocessor",
      "Input & output streams",
      "Build systems & linking",
    ],
  },
] as const;

export function CurriculumTabs() {
  const [active, setActive] = useState(0);

  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container" style={{ maxWidth: "720px" }}>
        <h2
          style={{
            fontSize: "var(--text-h2)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-fg)",
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          A clear path from basics to proficiency
        </h2>

        {/* Tab bar */}
        <div className="tab-bar" role="tablist">
          {STAGES.map((stage, i) => (
            <button
              key={stage.label}
              className="tab-button"
              role="tab"
              aria-selected={i === active}
              data-active={i === active ? "" : undefined}
              onClick={() => setActive(i)}
            >
              {stage.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div role="tabpanel">
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {STAGES[active].topics.map((topic) => (
              <li
                key={topic}
                style={{
                  fontSize: "var(--text-body)",
                  lineHeight: 1.6,
                  color: "var(--color-fg-muted)",
                  paddingLeft: "16px",
                  borderLeft: "2px solid var(--color-border)",
                }}
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
