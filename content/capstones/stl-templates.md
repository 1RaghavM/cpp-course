# Capstone: Polynomial Workshop

This capstone braids the STL, lambdas, raw dynamic memory, and operator overloading into one small command-line tool: a polynomial workshop. Each polynomial lives inside your own `Polynomial` class, backed by a `std::vector<double>` of coefficients, and the program reads commands from standard input to build, evaluate, combine, differentiate, and tabulate polynomials.

## What you'll build

Your program reads one command per line from standard input until end-of-file. Empty lines are ignored. The supported commands are:

- `POLY n c0 c1 ... cn` — define a polynomial of degree `n` with coefficients in ascending order. Print `#K: <pretty form>` where `K` is the slot it was stored in (zero-based, in insertion order).
- `EVAL id x` — print the polynomial at index `id` evaluated at `x` using an overloaded `operator()`.
- `ADD a b` and `MUL a b` — store and print the sum or product of `#a` and `#b`, implemented as `operator+` and `operator*`.
- `DERIV a` — store and print the derivative of `#a`.
- `LIST` — print `count=<n> nonconst=<m>` (where `m` is how many stored polynomials have degree ≥ 1), then every polynomial sorted by ascending degree (ties broken by slot index) as `#K [deg D]: <pretty form>`.
- `TABLE id x0 x1 step` — print a value table over `[x0, x1]` with the given `step`, one row per sample, using `new[]`/`delete[]` to manage the buffers.

The pretty form is a textbook polynomial: terms in descending degree, the unit coefficient on a non-constant term is hidden (write `x`, not `1x`), zero coefficients are skipped, and a polynomial that simplifies to zero prints as `0`. Trailing zero coefficients are dropped at construction time.

## Milestone 1: Define and print polynomials

**Goal:** Build `Polynomial` around a `std::vector<double>` of coefficients and overload `operator<<` so each `POLY` command echoes back `#K: <pretty form>`.

**Acceptance criteria:** `POLY 1 3 1` prints `#0: x + 3`. `POLY 3 0 -1 0 2` prints `#0: 2x^3 - x`. Trailing zero coefficients are trimmed, so `POLY 3 0 0 0 0` prints `#0: 0`.

**Hint:** Walk the coefficient vector from highest index to lowest, with a `first` flag deciding between a leading `-` and an infix ` - ` / ` + `.

## Milestone 2: Evaluate with operator()

**Goal:** Overload `operator()(double x)` so `EVAL id x` prints the polynomial's value at `x`. Horner's method is the cleanest path and pairs naturally with `crbegin()` / `crend()`.

**Acceptance criteria:** For `x^2 + 1`, `EVAL 0 2` prints `5` and `EVAL 0 -3` prints `10`. For `2x^3 + 3x^2 + 4x + 5`, `EVAL 0 0`, `EVAL 0 1`, and `EVAL 0 -1` print `5`, `14`, and `2`. `2x` at `0.5` prints `1`.

**Hint:** Print integer-valued doubles without a decimal point. Rounding to three decimal places before formatting avoids stray `-0` outputs.

## Milestone 3: Combine with operator+ and operator*

**Goal:** Overload `operator+` and `operator*` so `ADD` and `MUL` produce a new polynomial and print it. The arithmetic is schoolbook: align coefficient indices for addition, double-loop with `out[i + j] += a[i] * b[j]` for multiplication.

**Acceptance criteria:** `(x - 1)` and `(x + 1)` add to `2x` and multiply to `x^2 - 1`. Adding `x^2 + 1` to the constant `3` yields `x^2 + 4`, multiplying them yields `3x^2 + 3`. Opposite polynomials sum to `0` (no `+ 0` or `0x` ever leaks into output).

**Hint:** After every operation, drop trailing zero coefficients again so the printer never has to ask "is this term really there?".

## Milestone 4: Derivatives and a sorted catalog

**Goal:** Add a `derivative()` member that returns a new `Polynomial`, and implement `LIST` so it prints a degree-sorted index of the store. `LIST` must use STL algorithms — `std::sort` with a lambda comparator, `std::count_if` with a lambda predicate, and `std::for_each` to print — rather than hand-rolled loops.

**Acceptance criteria:** Three repeated `DERIV` calls on `2x^3 + 3x^2 + 4x + 5` produce `6x^2 + 6x + 4`, `12x + 6`, and `12`. After storing `7`, `x^2`, and `-3x + 1`, `LIST` prints `count=3 nonconst=2` followed by the three polynomials sorted by ascending degree (ties broken by slot index).

**Hint:** Sort a vector of indices, not the polynomial store itself — you need the original slot numbers stable for printing.

## Milestone 5: Value tables on dynamic memory

**Goal:** Implement `TABLE id x0 x1 step`. Allocate two `double[]` buffers with `new[]` (one for x values, one for y values), fill them, print each `x -> y` row, and release them with `delete[]`. Compute the row count as `round((x1 - x0) / step) + 1` so floating-point step counts stay stable.

**Acceptance criteria:** `TABLE 0 -2 2 1` on `x^2 + 1` prints five rows from `-2 -> 5` through `2 -> 5`. `TABLE 0 0 1 0.25` on `2x` prints five rows from `0 -> 0` through `1 -> 2`. The degenerate range `TABLE 0 4 4 1` on the constant `3` prints exactly one row, `4 -> 3`.

**Hint:** Format the numbers in `TABLE` the same way `EVAL` does — share one helper so the output stays consistent across commands.

## Stretch goals

- Add `SUB a b` and `SCALE id k` (scalar multiply).
- Add `ROOTS id` that brackets and bisects real roots for low-degree polynomials.
- Implement `operator==` and a `FIND` command that uses `std::find` to look up a polynomial by value.
- Parse pretty-printed polynomials back from a single string.

## Topics you'll use

- (18.1) Sorting an array using selection sort
- (18.2) Introduction to iterators
- (18.3) Introduction to standard library algorithms
- (19.1) Dynamic memory allocation with new and delete
- (19.2) Dynamically allocating arrays
- (20.6) Introduction to lambdas (anonymous functions)
- (20.7) Lambda captures
- (21.1) Introduction to operator overloading
- (21.4) Overloading the I/O operators
- (21.5) Overloading operators using member functions
- (21.9) Overloading the subscript operator
- (21.10) Overloading the parenthesis operator
- (23.6) Container classes
- (23.7) std::initializer_list
