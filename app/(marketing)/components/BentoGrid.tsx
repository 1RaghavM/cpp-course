"use client";

import { Reveal } from "./Reveal";

const CELL_ORDER = ["tutor", "editor", "pointers", "stl", "templates", "toolchain", "setup"];

function BentoCell({ area, children }: { area: string; children: React.ReactNode }) {
  const staggerClass = `bento-stagger-${CELL_ORDER.indexOf(area)}`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className={`bento-cell ${staggerClass}`} style={{ gridArea: area }} onMouseMove={onMove}>
      <div className="bento-cell-spotlight" aria-hidden="true" />
      {children}
    </div>
  );
}

function IconChat() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function MiniChat() {
  return (
    <>
      <div className="bento-mini-chat">
        <div className="bento-chat-msg bento-chat-user">
          My code prints a weird number instead of 42. What&rsquo;s wrong?
        </div>
        <div className="bento-chat-msg bento-chat-tutor">
          Look at what you&rsquo;re passing to <code>cout</code>. You&rsquo;re printing{" "}
          <code>ptr</code> itself, that&rsquo;s the <em>address</em> where <code>x</code> lives. How
          would you get the value <em>at</em> that address?
        </div>
        <div className="bento-chat-msg bento-chat-user">
          Dereference it? So <code>*ptr</code>?
        </div>
        <div className="bento-chat-msg bento-chat-tutor">
          Exactly. <code>*ptr</code> follows the pointer to the value.
        </div>
      </div>
      <div className="bento-tier-row">
        <span className="bento-tier bento-tier-1">T1 · Guiding</span>
        <span className="bento-tier bento-tier-2">T2 · Concept</span>
        <span className="bento-tier bento-tier-3">T3 · Approach</span>
        <span className="bento-tier bento-tier-4">T4 · Solution</span>
      </div>
    </>
  );
}

function MiniEditor() {
  return (
    <div className="bento-mini-editor">
      <div className="bento-editor-chrome">
        <span className="bento-std-pill">C++17</span>
        <span className="bento-std-pill bento-std-active">C++20</span>
        <span className="bento-std-pill">C++23</span>
        <span className="bento-editor-actions">
          <span className="bento-mini-run">Run</span>
          <span className="bento-mini-submit">Submit</span>
        </span>
      </div>
      <div className="bento-editor-body">
        <span className="ce-kw">auto</span> sum = std::
        <span className="ce-fn">accumulate</span>(v.
        <span className="ce-fn">begin</span>(), v.
        <span className="ce-fn">end</span>(), <span className="ce-num">0</span>
        );
      </div>
    </div>
  );
}

function CodeChip({ children }: { children: React.ReactNode }) {
  return <span className="bento-chip">{children}</span>;
}

export function BentoGrid() {
  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container">
        <Reveal>
          <div className="bento-sec-head">
            <h2>Learn by writing real C++</h2>
            <p>
              A sandboxed editor, an AI tutor that won&rsquo;t just hand you the answer, and a
              focused path through the language. No setup required.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="bento">
            <BentoCell area="tutor">
              <p className="bento-eyebrow">
                <IconChat />
                AI tutor
              </p>
              <h3 className="bento-title">Hints that build understanding, not dependence</h3>
              <p className="bento-desc">
                Stuck on an exercise? The tutor escalates through four tiers: guiding questions
                first, a full worked solution only as a last resort.
              </p>
              <MiniChat />
            </BentoCell>

            <BentoCell area="editor">
              <p className="bento-eyebrow">
                <IconCode />
                Sandboxed editor
              </p>
              <h3 className="bento-title">Compile and run real C++ in the browser</h3>
              <p className="bento-desc">
                A full editor with run, submit, and test cases. Switch the language standard and see
                compiler output instantly.
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
                Vectors, maps, algorithms. Learn the standard library by using it.
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
              <h3 className="bento-title">Compile, link, debug</h3>
              <p className="bento-desc">
                Understand what happens between &lsquo;Save&rsquo; and &lsquo;Run&rsquo;.
              </p>
              <CodeChip>g++ -std=c++17</CodeChip>
            </BentoCell>

            <BentoCell area="setup">
              <div className="bento-setup-row">
                <span className="bento-setup-icon">
                  <IconBolt />
                </span>
                <div>
                  <h3 className="bento-title" style={{ marginBottom: 6 }}>
                    No setup. Nothing to install.
                  </h3>
                  <p className="bento-desc">
                    No toolchain, no compiler flags to fight on day one. Open a browser and write
                    your first program in seconds.
                  </p>
                </div>
              </div>
            </BentoCell>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
