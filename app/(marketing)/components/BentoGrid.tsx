"use client";

import { Reveal } from "./Reveal";

const CELL_ORDER = ["tutor", "editor", "pointers", "stl", "templates", "toolchain", "setup"];

function BentoCell({
  area,
  children,
}: {
  area: string;
  children: React.ReactNode;
}) {
  const staggerClass = `bento-stagger-${CELL_ORDER.indexOf(area)}`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      className={`bento-cell ${staggerClass}`}
      style={{ gridArea: area }}
      onMouseMove={onMove}
    >
      <div className="bento-cell-spotlight" aria-hidden="true" />
      {children}
    </div>
  );
}

function CodeChip({ children }: { children: React.ReactNode }) {
  return <span className="bento-chip">{children}</span>;
}

function MiniChat() {
  return (
    <div className="bento-mini-chat">
      <div className="bento-chat-msg bento-chat-user">
        <span className="bento-chat-label">You</span>
        <p>My code prints a weird number instead of 42. What&rsquo;s wrong?</p>
        <pre className="bento-chat-code">
          <code>
            <span className="ce-kw">int</span> x = <span className="ce-number">42</span>;{"\n"}
            <span className="ce-kw">int</span>* ptr = &amp;x;{"\n"}
            std::cout &lt;&lt; ptr;
          </code>
        </pre>
      </div>
      <div className="bento-chat-msg bento-chat-tutor">
        <span className="bento-chat-label">Tutor</span>
        <p>
          Look at what you&rsquo;re passing to <code>cout</code>. You&rsquo;re printing{" "}
          <code>ptr</code> itself — that&rsquo;s the <em>address</em> where{" "}
          <code>x</code> lives in memory.
        </p>
        <p>
          How would you tell C++ &ldquo;give me the value <em>at</em> this
          address&rdquo;?
        </p>
      </div>
      <div className="bento-chat-msg bento-chat-user">
        <span className="bento-chat-label">You</span>
        <p>Dereference it? So <code>*ptr</code>?</p>
      </div>
      <div className="bento-chat-msg bento-chat-tutor">
        <span className="bento-chat-label">Tutor</span>
        <p>
          Exactly. <code>*ptr</code> follows the pointer to the value. Try
          changing your last line:
        </p>
        <pre className="bento-chat-code">
          <code>std::cout &lt;&lt; *ptr;  <span className="ce-comment">{"// 42"}</span></code>
        </pre>
      </div>
    </div>
  );
}

function MiniEditor() {
  return (
    <div className="bento-mini-editor">
      <div className="bento-editor-chrome">
        <span className="bento-editor-tab">main.cpp</span>
        <span className="bento-editor-run">&#x25B6; Run</span>
      </div>
      <pre className="bento-editor-code">
        <code>
          <span className="ce-kw">#include</span>{" "}
          <span className="ce-str">&lt;iostream&gt;</span>
          {"\n"}
          {"\n"}
          <span className="ce-kw">int</span>{" "}
          <span className="ce-fn">main</span>() {"{"}
          {"\n"}
          {"  "}std::cout <span className="ce-kw">&lt;&lt;</span>{" "}
          <span className="ce-str">&quot;Hello, C++&quot;</span>;{"\n"}
          {"}"}
        </code>
      </pre>
    </div>
  );
}

export function BentoGrid() {
  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container">
        <Reveal>
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
            Everything you need to learn C++
          </h2>
        </Reveal>

        <Reveal>
          <div className="bento">
            <BentoCell area="tutor">
              <h3 className="bento-title">AI tutor</h3>
              <p className="bento-desc">
                Get unstuck with a tutor that gives hints — not answers.
              </p>
              <MiniChat />
            </BentoCell>

            <BentoCell area="editor">
              <h3 className="bento-title">Sandboxed editor</h3>
              <p className="bento-desc">
                Write real C++ in the browser. Compile and run instantly.
              </p>
              <MiniEditor />
            </BentoCell>

            <BentoCell area="pointers">
              <h3 className="bento-title">Pointers &amp; memory</h3>
              <p className="bento-desc">
                Pointers stop being scary once you can see what they point at.
              </p>
              <CodeChip>int* ptr = &amp;x;</CodeChip>
            </BentoCell>

            <BentoCell area="stl">
              <h3 className="bento-title">The STL in practice</h3>
              <p className="bento-desc">
                Vectors, maps, algorithms — learn the standard library by using
                it.
              </p>
              <CodeChip>std::vector&lt;int&gt;</CodeChip>
            </BentoCell>

            <BentoCell area="templates">
              <h3 className="bento-title">Templates &amp; generics</h3>
              <p className="bento-desc">
                Write code that works with any type, without the mystery.
              </p>
              <CodeChip>template&lt;typename T&gt;</CodeChip>
            </BentoCell>

            <BentoCell area="toolchain">
              <h3 className="bento-title">Compile · link · debug</h3>
              <p className="bento-desc">
                Understand what happens between &lsquo;Save&rsquo; and
                &lsquo;Run&rsquo;.
              </p>
              <CodeChip>g++ -std=c++17</CodeChip>
            </BentoCell>

            <BentoCell area="setup">
              <h3 className="bento-title">No setup required</h3>
              <p className="bento-desc">
                Runs in the browser. Nothing to install, nothing to configure.
              </p>
              <span className="bento-chip bento-chip-check">✓ 0 installs</span>
            </BentoCell>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
