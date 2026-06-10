## The idea

Chapter 8 covers every mechanism C++ provides to change the order in which statements execute. Without control flow, a program runs straight through from top to bottom — useful, but limited. With control flow, you can branch on conditions, repeat work, jump to error-handling code, and cut a loop short when you've found what you need.

This chapter introduced four families of constructs: **conditional branching** (`if`/`else`, `switch`), **unconditional jump** (`goto`), **loops** (`while`, `do while`, `for`, and the loop-control statements `break` and `continue`), **program termination** (`std::exit`, `std::abort`, `std::atexit`), and **random number generation** (`<random>` with Mersenne Twister). Together they give you full expressive power over the flow of any program.

## How it works

**Conditional branching.** `if`/`else` tests any boolean expression. The else branch is optional; else-if chains express multi-way decisions. Always use braces even for single-statement bodies to avoid the "dangling else" trap.

```cpp
int score = 75;
if (score >= 90)
    std::cout << "A\n";
else if (score >= 80)
    std::cout << "B\n";
else
    std::cout << "C or below\n";
```

`switch` is cleaner than a long else-if chain when you're testing a single integer or enumeration for equality against compile-time constants. Each `case` label must end with a `break` or `[[fallthrough]]` to prevent silent fall-through to the next case:

```cpp
int day = 2;
switch (day)
{
    case 1:  std::cout << "Monday\n";    break;
    case 2:  std::cout << "Tuesday\n";   break;
    case 3:  std::cout << "Wednesday\n"; break;
    default: std::cout << "Later\n";     break;
}
```

`goto` jumps unconditionally to a labeled statement in the same function. It is legal but almost always the wrong tool: it can skip variable initialization, create spaghetti flow, and obscure logic. Prefer loops and functions.

**Loops.** `while` tests its condition before each iteration — if the condition is false initially, the body never runs. `do while` tests after the first iteration, guaranteeing at least one execution. `for` bundles an init statement, condition, and increment expression in one line, making it the natural choice for counted loops:

```cpp
// for: counted iteration
for (int i = 0; i < 5; ++i)
    std::cout << i << ' ';

// while: condition-driven
int x = 1;
while (x < 100)
    x *= 2;

// do while: menu that always shows once
int choice;
do {
    std::cout << "Enter 1 or 2: ";
    std::cin >> choice;
} while (choice != 1 && choice != 2);
```

`break` exits the innermost loop or switch immediately. `continue` skips the rest of the current iteration and jumps to the condition (or increment in a `for` loop). Used sparingly, they simplify logic; overused, they hide it.

**Program termination.** `std::exit(code)` ends the program cleanly (flushes buffers, calls `atexit` handlers). `std::abort()` ends it abnormally (no cleanup, useful for truly unrecoverable states). `std::atexit(fn)` registers a cleanup function called by `std::exit`. These are tools for fatal errors, not normal flow.

**Random numbers.** `std::mt19937` (Mersenne Twister) paired with `std::uniform_int_distribution` is the standard pattern. Create the engine once with a seed and reuse it. A fixed seed gives reproducible output (ideal for tests); a `std::random_device` or clock-based seed gives different output each run.

```cpp
#include <random>
std::mt19937 rng{ 42u };
std::uniform_int_distribution<int> die{ 1, 6 };
int roll = die(rng);  // always 4 with seed 42
```

## Common mistakes

**Switch fallthrough.** Omitting `break` causes execution to fall through into the next case body. This is a logic bug, not a compile error. If fallthrough is intentional, write `[[fallthrough]];` to silence the warning and signal intent.

```cpp
switch (x) {
    case 1:
        std::cout << "one\n";
        // BUG: missing break — falls into case 2
    case 2:
        std::cout << "two\n";
        break;
}
// For x == 1: prints "one" AND "two"
```

**Off-by-one in loops.** The most common loop error. Using `<` versus `<=`, starting at 0 versus 1, or stopping one iteration early or late:

```cpp
// Intended: print 1 through 5
for (int i = 1; i <= 5; ++i)  // correct
    std::cout << i << '\n';

for (int i = 1; i < 5; ++i)   // wrong: misses 5
    std::cout << i << '\n';
```

**Re-seeding a PRNG in a loop.** Creating or re-seeding a `std::mt19937` on every iteration defeats the purpose — the engine restarts from the same point, producing the same value each time. Create the engine once, before the loop.

## When to use this

Reach for `if`/`else` for binary or small multi-way decisions on any expression. Switch is better than a long else-if chain when testing one integer or enum against several constants. `for` fits counted and iterator-driven loops; `while` fits condition-driven loops; `do while` fits "execute at least once" patterns like menus and input validation. Use `break` to escape a loop early when you've found what you need, and `continue` to skip invalid inputs inside a loop. Reserve `goto` for the rare case where it genuinely simplifies error cleanup and alternatives don't (and even then, reconsider). `std::exit` and `std::abort` belong in fatal-error paths, not ordinary flow. Use `std::mt19937` with a distribution for any random-number need — never use `%` on raw engine output.
