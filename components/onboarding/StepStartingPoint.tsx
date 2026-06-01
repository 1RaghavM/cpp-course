"use client";

import type { Action, Background, ModuleId } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = {
  background: Background;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

function BranchNew({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <h1 className="ob-heading">We&rsquo;ll start at the beginning.</h1>
      <p className="ob-subtext">
        First program, then variables, then we build up. No setup, no prior knowledge assumed.
      </p>
      <button
        type="button"
        className="ob-primary-btn"
        onClick={() => dispatch({ type: "SET_START_MODULE", module: "variables" })}
      >
        Let&rsquo;s go
      </button>
    </>
  );
}

function BranchOtherLang({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <h1 className="ob-heading">You already code. Want the C++-specific track?</h1>
      <p className="ob-subtext">
        Skip &ldquo;what&rsquo;s a loop.&rdquo; Start where C++ actually differs &mdash; types,
        compilation, and memory.
      </p>
      <div className="ob-options-stack">
        <OptionCard
          label="Yes, skip to what's different"
          onSelect={() =>
            dispatch({ type: "SET_START_MODULE", module: "variables", fastTrack: true })
          }
        />
        <OptionCard
          label="No, walk me through everything"
          onSelect={() =>
            dispatch({ type: "SET_START_MODULE", module: "variables", fastTrack: false })
          }
        />
      </div>
    </>
  );
}

const SELF_SELECT: { label: string; module: ModuleId }[] = [
  { label: "Memory & pointers", module: "pointers" },
  { label: "Classes & RAII", module: "classes" },
  { label: "STL & templates", module: "vectors-maps" },
];

function BranchSomeCpp({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <h1 className="ob-heading">Where do you want to jump in?</h1>
      <p className="ob-subtext">Not sure? Take a 5-question check and we&rsquo;ll place you.</p>
      <div className="ob-options-stack">
        {SELF_SELECT.map((opt) => (
          <OptionCard
            key={opt.module}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_START_MODULE", module: opt.module })}
          />
        ))}
        <OptionCard
          label="Place me with a quick check"
          onSelect={() => dispatch({ type: "START_PLACEMENT" })}
        />
        <OptionCard
          label="Actually, start me from the basics"
          onSelect={() => dispatch({ type: "SET_START_MODULE", module: "variables" })}
        />
      </div>
    </>
  );
}

export function StepStartingPoint({ background, dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={3} total={3} />
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      {background === "new" && <BranchNew dispatch={dispatch} />}
      {background === "other_lang" && <BranchOtherLang dispatch={dispatch} />}
      {background === "some_cpp" && <BranchSomeCpp dispatch={dispatch} />}
    </div>
  );
}
