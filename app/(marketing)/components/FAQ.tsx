"use client";

import { Reveal } from "./Reveal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export function FAQ() {
  return (
    <section className="hp-section hp-section-border">
      <div className="hp-container" style={{ maxWidth: "770px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "var(--text-h2)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "var(--color-fg)",
                margin: 0,
              }}
            >
              FAQ
            </h2>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--color-fg-muted)",
                margin: "12px 0 0",
              }}
            >
              Find answers to common questions
              <br />
              about the roadmap, pricing, and access.
            </p>
          </div>
        </Reveal>
        <Accordion defaultValue={["setup"]}>
          <AccordionItem value="setup">
            <AccordionTrigger>Do I need to install a compiler or set anything up?</AccordionTrigger>
            <AccordionContent>
              No. cpproad runs in your browser. There&apos;s a built-in editor where you write and
              run real C++ without installing a compiler, IDE, or anything else. You hit Run and see
              the output right there. The point is to get you writing code in your first few minutes
              instead of losing a weekend to setup.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="beginners">
            <AccordionTrigger>I&apos;ve never written a line of code. Is C++ too hard to start with?</AccordionTrigger>
            <AccordionContent>
              C++ has a reputation for being unforgiving, and that&apos;s fair, but cpproad is built
              for starting from zero. It begins with the absolute basics and only introduces the
              intimidating stuff (pointers, memory, templates) once the foundation is there. You
              won&apos;t get dropped in the deep end, and when something doesn&apos;t click, the AI
              tutor is right there to explain it another way.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tutor">
            <AccordionTrigger>What&apos;s the AI tutor, and how is it different from just asking ChatGPT?</AccordionTrigger>
            <AccordionContent>
              The tutor lives inside the lesson and the editor, so it already knows what you&apos;re
              working on and what you&apos;ve covered. Instead of pasting code into a separate chat
              and re-explaining everything, you ask in place and it helps with that exact problem.
              It&apos;s there to unstick you and explain concepts, not to hand you the answer so you
              skip the learning.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="hands-on">
            <AccordionTrigger>Do I actually write code, or is it just videos and quizzes?</AccordionTrigger>
            <AccordionContent>
              You write code. Every concept is something you immediately type, run, and watch work
              (or break) in the sandbox. cpproad is built around doing rather than watching, because
              reading about pointers and actually using them are two very different things.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="different">
            <AccordionTrigger>How is this different from free stuff like YouTube or learncpp.com?</AccordionTrigger>
            <AccordionContent>
              Those are great references, but they leave you to figure out the order, the setup, and
              whether you actually understood anything. cpproad is one structured path: write code,
              run it, get unstuck by the tutor, move on. All in one place with nothing to assemble
              yourself. You&apos;re paying for the path and the practice loop, not for the existence
              of C++ information.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="coverage">
            <AccordionTrigger>What does the roadmap actually cover?</AccordionTrigger>
            <AccordionContent>
              It takes you from the very basics (your first program, variables, control flow) through
              functions and the core language, and up into more advanced territory like templates.
              Each section builds on the last so there are no gaps, and by the end you&apos;re
              comfortable with the parts of C++ that real code actually uses.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="timeline">
            <AccordionTrigger>How soon can I write a real program?</AccordionTrigger>
            <AccordionContent>
              You write and run real code from the first lesson, so basically right away. Getting
              comfortable across the whole path is self-paced and depends on the time you put in, but
              there&apos;s no &quot;watch 10 hours before you touch code&quot; phase. You&apos;re
              building from day one.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="stuck">
            <AccordionTrigger>What if I get stuck and there&apos;s no one to ask?</AccordionTrigger>
            <AccordionContent>
              That&apos;s exactly what the AI tutor is for. When a concept won&apos;t click or your
              code won&apos;t compile, you ask right inside the editor and get an explanation aimed
              at where you actually are. You&apos;re never stuck staring at an error with nowhere to
              turn.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
