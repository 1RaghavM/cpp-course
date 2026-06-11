## The idea

Writing a C++ program involves more steps than typing code and pressing a button. Between your idea and a running program, there is a sequence of distinct activities: writing source code, compiling it, and then running the result. Each step has its own tools, vocabulary, and failure modes.

C++ development is best understood as a workflow, not a single action. Think of it like writing a recipe and then cooking from it. The recipe (source code) describes what to do. Compiling is like having a professional chef review the recipe for ambiguities and errors before anything goes near the stove. Running the compiled output is the actual cooking. The recipe and the meal are different things; changing the recipe does not change a meal you already cooked. To update the meal, you must cook a new one from the updated recipe.

This analogy also captures the distinction between the source file and the executable. They are two different artifacts at two different stages of the workflow. A lot of early confusion — "I changed the code but the behavior is the same" — comes from conflating them.

## How it works

The typical C++ development cycle looks like this:

**Step 1: Write source code.** You create one or more `.cpp` files using a text editor or integrated development environment (IDE). An IDE is a program that combines a text editor, a compiler, a debugger, and various helper tools into one application. Examples include Visual Studio, CLion, and VS Code (with extensions). At this stage your file is just text — the computer cannot run it yet.

**Step 2: Compile.** You invoke the compiler, either directly via the command line or by pressing a button in your IDE. The compiler reads your `.cpp` files, checks them for syntactic and semantic correctness according to the C++ standard, and produces object files — chunks of machine code that are not yet a complete runnable program.

**Step 3: Link.** The linker takes the object files produced by the compiler, plus any libraries your code uses, and combines them into a single executable. In many development environments, compiling and linking happen as a single button press, but they are conceptually separate steps with separate failure modes. Link errors are different from compile errors.

**Step 4: Run.** You execute the resulting binary. On Windows this is a `.exe` file; on Linux and macOS it is usually a file with no extension. The program runs, processes any input, does its work, and produces output. This is the first time your code actually executes — nothing in steps 1 through 3 causes your program to run.

**Step 5: Debug and repeat.** When the program does not behave as expected, you investigate — using print statements, a debugger, or reasoning through the code — fix the source file, and start again from step 2. This cycle repeats until the program is correct.

The most important insight from this workflow is that compilation and execution are completely separate phases. The compiler does not run your program. It produces a translation of your program into machine code that the CPU can execute. The distinction between things that happen at compile time and things that happen at runtime recurs throughout C++ and becomes especially important when you encounter concepts like templates, constant expressions, and static assertions in later chapters.

## Common mistakes

A common mistake is thinking that changing source code and re-running without recompiling will produce different behavior. It will not. The executable is a snapshot of your code at the moment you last compiled it. Changing the `.cpp` file does not change the binary. You must recompile every time you change the source. Some IDEs remind you of this; others run the old binary silently.

Another mistake is confusing the three main types of errors: compile errors, linker errors, and runtime errors. Compile errors catch violations of C++ syntax and type rules — these are the easiest to fix because the compiler reports the file name and line number. Linker errors catch missing or inconsistent definitions — harder to diagnose because the error refers to symbol names rather than source lines. Runtime errors are the hardest: the program compiled and linked successfully but behaves incorrectly or crashes during execution. Each type of error requires a different investigative strategy, and knowing which stage of the workflow failed is the first step in fixing the problem.

A third misunderstanding is expecting the compiler's error messages to always point at the actual cause of the problem. The compiler often detects a symptom several lines after the real mistake. A missing closing brace on line 10 might cause a cascade of errors appearing on lines 15 through 40. Reading only the first error message and fixing only that before recompiling is almost always the most efficient approach, because a single root cause can produce dozens of downstream errors.

## When to use this

Understanding the development workflow matters immediately and continually. Every lesson from here forward assumes you can write code, compile it, and run it. When an exercise says "compile and run this," you need to know exactly what that sequence means and how to do it in your chosen environment.

This workflow understanding also makes you a faster debugger. When something goes wrong, knowing whether the error occurred at compile time, link time, or runtime tells you where to start looking. That triage skill is one of the most durable things a developer internalizes early, because it applies equally to a ten-line learning exercise and to a million-line production system.
