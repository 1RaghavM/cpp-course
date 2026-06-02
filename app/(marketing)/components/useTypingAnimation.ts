"use client";

import { useEffect, useState } from "react";

const INITIAL_CODE = `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> topics = {
        "variables", "functions",
        "pointers",  "templates"
    };

    for (const auto& topic : topics) {
        std::cout << "Learning: " << topic << "\\n";
    }

    return 0;
}`;

const EDIT_SEARCH = "Learning";
const EDIT_REPLACE = "Mastered";
const EDIT_START = INITIAL_CODE.indexOf(EDIT_SEARCH);
const EDIT_END = EDIT_START + EDIT_SEARCH.length;

const TYPING_MS = 22;
const DELETE_MS = 28;
const PAUSE_MS = 1800;
const FADE_MS = 500;
const RESET_MS = 400;

type Phase =
  | "typing"
  | "pause1"
  | "deleting"
  | "typing_edit"
  | "pause2"
  | "fading"
  | "resetting";

const CURSOR_HTML = '<span class="typing-cursor"></span>';

function injectCursor(html: string, charOffset: number): string {
  let count = 0;
  let i = 0;
  while (i < html.length && count < charOffset) {
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      if (end === -1) break;
      i = end + 1;
    } else if (html[i] === "&") {
      const semi = html.indexOf(";", i);
      i = (semi !== -1 ? semi : i) + 1;
      count++;
    } else {
      count++;
      i++;
    }
  }
  return html.slice(0, i) + CURSOR_HTML + html.slice(i);
}

export function useTypingAnimation() {
  const [html, setHtml] = useState("");
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let highlighter: { dispose?: () => void } | null = null;

    function schedule(fn: () => void, ms: number) {
      if (disposed) return;
      timer = setTimeout(fn, ms);
    }

    import("shiki").then(async (shiki) => {
      if (disposed) return;
      const hl = await shiki.createHighlighter({
        themes: ["github-dark"],
        langs: ["cpp"],
      });
      if (disposed) {
        hl.dispose();
        return;
      }
      highlighter = hl;

      function render(code: string, cursorAt: number): string {
        if (!code) return CURSOR_HTML;
        const raw = hl.codeToHtml(code, {
          lang: "cpp",
          theme: "github-dark",
        });
        return injectCursor(raw, cursorAt);
      }

      if (reducedMotion) {
        setHtml(
          hl.codeToHtml(INITIAL_CODE, { lang: "cpp", theme: "github-dark" }),
        );
        return;
      }

      let phase: Phase = "typing";
      let idx = 0;

      function tick() {
        if (disposed) return;

        switch (phase) {
          case "typing": {
            if (idx >= INITIAL_CODE.length) {
              phase = "pause1";
              setHtml(render(INITIAL_CODE, INITIAL_CODE.length));
              schedule(tick, PAUSE_MS);
              return;
            }
            let next = idx + 1;
            if (INITIAL_CODE[idx] === "\n") {
              while (
                next < INITIAL_CODE.length &&
                INITIAL_CODE[next] === " "
              ) {
                next++;
              }
            }
            idx = next;
            setHtml(render(INITIAL_CODE.slice(0, next), next));
            schedule(tick, TYPING_MS);
            break;
          }

          case "pause1": {
            phase = "deleting";
            idx = 0;
            tick();
            break;
          }

          case "deleting": {
            if (idx >= EDIT_SEARCH.length) {
              phase = "typing_edit";
              idx = 0;
              tick();
              return;
            }
            idx++;
            const remaining = EDIT_SEARCH.length - idx;
            const text =
              INITIAL_CODE.slice(0, EDIT_START + remaining) +
              INITIAL_CODE.slice(EDIT_END);
            setHtml(render(text, EDIT_START + remaining));
            schedule(tick, DELETE_MS);
            break;
          }

          case "typing_edit": {
            if (idx >= EDIT_REPLACE.length) {
              phase = "pause2";
              const text =
                INITIAL_CODE.slice(0, EDIT_START) +
                EDIT_REPLACE +
                INITIAL_CODE.slice(EDIT_END);
              setHtml(render(text, EDIT_START + EDIT_REPLACE.length));
              schedule(tick, PAUSE_MS);
              return;
            }
            idx++;
            const typed = EDIT_REPLACE.slice(0, idx);
            const text =
              INITIAL_CODE.slice(0, EDIT_START) +
              typed +
              INITIAL_CODE.slice(EDIT_END);
            setHtml(render(text, EDIT_START + idx));
            schedule(tick, TYPING_MS);
            break;
          }

          case "pause2": {
            phase = "fading";
            setIsFading(true);
            schedule(tick, FADE_MS);
            break;
          }

          case "fading": {
            phase = "resetting";
            setHtml("");
            schedule(tick, RESET_MS);
            break;
          }

          case "resetting": {
            setIsFading(false);
            phase = "typing";
            idx = 0;
            schedule(tick, RESET_MS);
            break;
          }
        }
      }

      tick();
    });

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      highlighter?.dispose?.();
    };
  }, []);

  return { html, isFading };
}
