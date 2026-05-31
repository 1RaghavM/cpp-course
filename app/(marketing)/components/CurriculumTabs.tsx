"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

const STAGES = [
  {
    label: "Basics",
    file: "hello.cpp",
    lines: [
      { text: "#include <iostream>", cls: "kw-inc" },
      { text: "" },
      { text: "int main() {", cls: "fn" },
      { text: '    std::string name = "world";', cls: "str" },
      { text: "    int count = 3;", cls: "num" },
      { text: "" },
      { text: "    for (int i = 0; i < count; i++) {" },
      { text: '        std::cout << "Hello, "' },
      { text: "                  << name" },
      { text: '                  << "!" << std::endl;' },
      { text: "    }" },
      { text: "" },
      { text: "    return 0;" },
      { text: "}" },
    ],
  },
  {
    label: "Memory & OOP",
    file: "shape.cpp",
    lines: [
      { text: "class Shape {", cls: "fn" },
      { text: "public:" },
      { text: "    virtual double area() const = 0;", cls: "kw" },
      { text: "    virtual ~Shape() = default;" },
      { text: "};" },
      { text: "" },
      { text: "class Circle : public Shape {", cls: "fn" },
      { text: "    double radius;" },
      { text: "public:" },
      { text: "    Circle(double r) : radius(r) {}" },
      { text: "" },
      { text: "    double area() const override {", cls: "kw" },
      { text: "        return 3.14159 * radius * radius;", cls: "num" },
      { text: "    }" },
      { text: "};" },
    ],
  },
  {
    label: "STL & Templates",
    file: "filter.cpp",
    lines: [
      { text: "#include <vector>", cls: "kw-inc" },
      { text: "#include <algorithm>", cls: "kw-inc" },
      { text: "" },
      { text: "template<typename T, typename Pred>", cls: "kw" },
      { text: "std::vector<T> filter(", cls: "fn" },
      { text: "    const std::vector<T>& v, Pred pred) {" },
      { text: "    std::vector<T> result;" },
      { text: "    std::copy_if(v.begin(), v.end()," },
      { text: "        std::back_inserter(result), pred);" },
      { text: "    return result;" },
      { text: "}" },
      { text: "" },
      { text: "// usage:", cls: "cmt" },
      { text: "auto evens = filter(nums,", cls: "cmt" },
      { text: "    [](int n){ return n % 2 == 0; });", cls: "cmt" },
    ],
  },
  {
    label: "Advanced",
    file: "resource.cpp",
    lines: [
      { text: "class Buffer {", cls: "fn" },
      { text: "    std::unique_ptr<char[]> data;", cls: "kw" },
      { text: "    size_t size;" },
      { text: "public:" },
      { text: "    Buffer(size_t n)", cls: "fn" },
      { text: "        : data(std::make_unique<char[]>(n))" },
      { text: "        , size(n) {}" },
      { text: "" },
      { text: "    // move constructor", cls: "cmt" },
      { text: "    Buffer(Buffer&& other) noexcept", cls: "kw" },
      { text: "        : data(std::move(other.data))" },
      { text: "        , size(std::exchange(other.size, 0))" },
      { text: "    {}" },
      { text: "" },
      { text: "    size_t len() const { return size; }" },
      { text: "};" },
    ],
  },
] as const;

function lineClass(cls?: string) {
  switch (cls) {
    case "kw-inc": return "ct-kw";
    case "kw": return "ct-kw";
    case "fn": return "ct-fn";
    case "str": return "ct-str";
    case "num": return "ct-num";
    case "cmt": return "ct-cmt";
    default: return "";
  }
}

export function CurriculumTabs() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container" style={{ maxWidth: "720px" }}>
        <Reveal>
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
        </Reveal>

        <Reveal delay={0.1}>
          <div className="tab-bar" role="tablist">
            {STAGES.map((s, i) => (
              <button
                key={s.label}
                className="tab-button"
                role="tab"
                aria-selected={i === active}
                data-active={i === active ? "" : undefined}
                onClick={() => setActive(i)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="curriculum-editor" role="tabpanel">
            <div className="curriculum-editor-chrome">
              <span className="curriculum-editor-tab">{stage.file}</span>
            </div>
            <div className="curriculum-editor-body">
              <div className="curriculum-editor-gutters" aria-hidden="true">
                {stage.lines.map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <pre className="curriculum-editor-code">
                <code>
                  {stage.lines.map((line, i) => (
                    <span key={i} className={lineClass("cls" in line ? line.cls : undefined)}>
                      {line.text}
                      {"\n"}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
