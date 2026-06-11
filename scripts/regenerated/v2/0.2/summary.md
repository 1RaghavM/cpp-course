## The idea

A computer is a machine that executes instructions. The instructions it actually understands are written in machine code — sequences of binary numbers that tell the processor to move data, perform arithmetic, or jump to a different part of the instruction stream. No human writes machine code directly for serious work; it is tedious, error-prone, and completely illegible.

A programming language is a notation for writing instructions that a human can read and reason about, but that can be reliably converted into machine code a computer can execute. Think of it as a contract between you and a translation tool: you write in the language according to its rules, and the translation tool produces working machine code on your behalf.

Programs, at their core, are just sequences of those instructions. A program to sort a list of numbers is ultimately a sequence of primitive operations — load this value, compare these two values, swap them if a condition holds — expressed in a form that both the programmer and the translation toolchain can work with.

## How it works

There are two broad categories of how programming languages get turned into something a computer can run: compilation and interpretation.

An interpreter reads your source code and executes it on the fly, instruction by instruction, using its own runtime. Python works this way. The interpreter is itself a program, running on the CPU, that reads your code and carries out its intent. This means you can run Python code immediately without an explicit preparation step, but it also means the interpreter is doing extra work at runtime.

A compiler translates your entire source code into machine code (or something close to it) before the program runs. The output of the compiler is an executable file. When you run that file, the CPU executes machine code directly — no middleman. C++ uses this model. Compilation happens once, producing a faster and leaner artifact, but it introduces a distinct step between writing code and running it.

This distinction has practical consequences you will encounter in chapter 0:

- Writing C++ code does not immediately run anything. You must compile it first.
- Compiler errors appear before the program runs, not during.
- The executable you produce from your source code can run on any compatible machine without the original source.

## Common mistakes

A common mistake is blurring the line between source code and executable. Your `.cpp` file is not a program you run — it is instructions for the compiler. The compiler produces the runnable artifact. When a friend says "send me your program," they mean the executable, not the `.cpp` file. When a bug occurs, it occurs in the running executable, but you fix it in the source code and recompile.

Another misunderstanding is thinking that programming languages are arbitrary inventions with no logic behind their differences. Each language makes deliberate tradeoffs. Python optimizes for expressiveness and rapid prototyping; the interpreter costs some runtime speed. C++ optimizes for runtime performance and precise hardware control; the compilation step and explicit memory management are the price. Neither is universally better — they serve different needs.

A third mistake beginners make is assuming that a program they understand perfectly will behave exactly as they expect. Computers follow the instructions literally — not the intent behind them. If your instructions have a logical flaw, the machine executes the flawed instructions faithfully. This is why debugging exists: the distance between your intent and your instructions.

## When to use this

Understanding the compilation model is the foundation for everything in this course. Every time a lesson tells you to compile your code, you now know what that step is doing: translating human-readable C++ into a machine-executable artifact. Every time a lesson explains a compiler error, you know the error is the compiler telling you that your source code violates the rules of the language — caught before the program runs at all.

This mental model also explains why certain categories of bugs exist in C++ that do not exist in languages with garbage collection or runtime type checking. C++ trusts you to write correct instructions. The compiler enforces a ruleset, but within those rules you have a great deal of latitude. That latitude comes with responsibility.
