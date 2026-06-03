# Chapter 10 Fix Changelog

All changes applied to `ch_10_fixed.json` based on audit findings in `ch_10_audit.md`.

---

## Summary Fixes

### 10.1 — Implicit type conversion (3 fixes)

1. **Removed `auto` usage** — replaced `auto c = a / b;` with `double c = a / b;`. `auto` is not introduced until lesson 10.8.

2. **Fixed "promotion hierarchy" label** — the hierarchy `bool < char < ... < long double` was mislabeled as "the numeric promotion hierarchy." Renamed to "the usual arithmetic conversion ranking" with a note that this is a simplification. Added clarification that numeric promotions are a narrow subset (small integrals to `int`, `float` to `double`).

3. **Fixed `-Wall -Wextra` narrowing warning claim** — original said `-Wall -Wextra` emits "implicit conversion warnings for narrowing." Corrected to note that `-Wall -Wextra` catches some issues (sign-compare), but `-Wconversion` is needed for broader narrowing warnings.

4. **Fixed cross-reference** — "In lesson 10-2 you'll learn explicit casts" was wrong (10.2 is promotions). Changed to "In lesson 10.6 you will learn how to use `static_cast`."

### 10.2 — Floating-point and integral promotion (1 fix)

1. **Removed `auto` usage** — replaced `auto result = a + b;` with `int result = a + b;`. `auto` is not introduced until lesson 10.8.

### 10.4 — Narrowing conversions, list initialization, and constexpr initializers (2 fixes)

1. **Fixed "covered in a later lesson" claim** — `static_cast` was already introduced in lesson 4.12. Changed to: "as you first saw in lesson 4.12, and lesson 10.6 covers it in more depth."

2. **Fixed cross-reference format** — changed "lesson 10-2" to "lesson 10.2" for consistency.

### 10.5 — Arithmetic conversions (1 fix)

1. **Added "simplified" label to hierarchy** — the ranking `bool < char < ... < long double` is presented as a simplification with an explicit note that actual rules depend on signedness and don't form a strict linear chain.

### 10.6 — Explicit type conversion (casting) and static_cast (1 fix)

1. **Fixed cross-reference format** — changed "lesson 10-4" to "lesson 10.4" for consistency.

### 10.7 — Typedefs and type aliases (3 fixes)

1. **Removed `std::vector` and `std::pair`** — these are Ch 16 material. Replaced all examples with types the student already knows: `unsigned long long`, `std::string`, `std::uint32_t`, plain `int`/`double`.

2. **Removed template alias example** — `template<typename T> using Grid = ...` requires Ch 11 knowledge. Replaced with a forward-looking note: "You will see `using` with templates in Chapter 11."

3. **Removed `const char*`** — pointers are Ch 12. Replaced with `std::string` and simpler type examples.

### 10.8 — Type deduction for objects using the auto keyword (3 fixes)

1. **Removed `auto&` reference discussion** — references are Ch 12. Removed the bullet about `auto` stripping references and `auto&` syntax.

2. **Removed iterator example** — `auto it = vec.begin()` references vectors (Ch 16) and iterators. Removed entirely.

3. **Fixed cross-reference** — "Explicit casts (10-7)" was wrong; 10.7 is typedefs. Changed to "Explicit casts (10.6)."

### 10.9 — Type deduction for functions (3 fixes)

1. **Fixed invalid syntax** — `decltype(auto) h() -> decltype(auto) { return (x); }` does not compile. You cannot combine `decltype(auto)` deduction with a trailing return type.

2. **Removed reference-heavy `decltype(auto)` section** — the original explained `int&` return types, lvalue expressions, and value categories, all of which require understanding references (Ch 12). Replaced with a brief preview that defers the full explanation to Ch 12.

3. **Added `#include <string>` to code example** — the `greet()` example uses `std::string` but was missing the include.

---

## Exercise Fixes

### 10.1.2 — Narrowing and bool Coercion (solution fix)

**Problem:** Exercise is about *implicit* narrowing, but solution used `static_cast<int>(d)` and `static_cast<bool>(n)` (explicit casts).

**Fix:** Changed solution to use implicit narrowing: `int i = d;` and `bool b = n;`. Updated prompt to say "copy initialization" to be precise. This correctly demonstrates implicit conversion behavior.

### 10.2.2 — Promotion Arithmetic Checker (minor wording fix)

**Problem:** Prompt said "overflows a signed char" which is misleading since overflow never occurs (promotion prevents it).

**Fix:** Changed to "exceeds the range of a signed char."

### 10.4.2 — Safe Brace Init with constexpr (solution fix)

**Problem:** Solution used `char c { static_cast<char>(kCode) };` which undermines the lesson's point that `constexpr` values don't need a cast in brace-init.

**Fix:** Changed to `char c { kCode };` with comment explaining the constexpr exemption. Updated prompt hint to emphasize "no `static_cast` required."

### 10.5.2 — Signed/Unsigned Surprise (prompt + solution fix)

**Problem:** `static_cast<int>(u)` is undefined behavior when `u > INT_MAX`. Solution also used `#pragma GCC diagnostic` and `// NOLINT` — advanced constructs not taught.

**Fix:**
- Constrained `u` to `[0, 100]` in the prompt, making `static_cast<int>(u)` safe.
- Removed all `#pragma` and `// NOLINT` from solution.
- For the mixed comparison, used `static_cast<unsigned int>(s) < u` to replicate what the compiler does with `s < u`, avoiding the sign-compare warning in the solution while demonstrating the same behavior.

### 10.6.1 — Integer Division to Floating-Point Result (replaced)

**Problem:** Nearly identical to exercise 10.1.1 (both read two ints, print integer and float division). Pedagogically redundant.

**Fix:** Replaced with "Cast-Based Signed/Unsigned Inspector" — an exercise that practices `static_cast` between signed and unsigned types, with safe input constraints ([0, 1000]).

### 10.7.2 — Refactor: typedef to using (minor fix)

**Problem:** `PlayerName` alias was declared but never used in the solution.

**Fix:** Removed unused `PlayerName` alias from the solution. (The starter code still has it for the student to convert as practice, but the solution only keeps aliases that are actually used.)

### 10.8.2 — Auto Arithmetic and Literal Suffixes (exercise fix)

**Problem:** The `0u + a` pattern teaches signed/unsigned mixing — exactly the anti-pattern lesson 10.5 warned against. If either input is negative, the result wraps.

**Fix:**
- Changed the sum computation from `0u + a + b` (unsigned) to plain `a + b` (int). Removed the unsigned sum entirely.
- Constrained inputs to "non-negative" in the prompt.
- Updated expected outputs: sum line now shows `sizeof` 4 (int) instead of the unsigned trick.
- Removed the "no casts allowed" constraint since it was only there to justify the `0u` trick.

### 10.9.2 — Trailing Return Types and decltype(auto): Safe Array Accessor (replaced)

**Problem:** Used pointers (`const int*`, `int*`), C-style arrays (`int data[5]`), and references via `decltype(auto)` returning `int&`. All three are forward references to Ch 12/17.

**Fix:** Replaced with "Trailing Return Types — Multi-Step Calculator" — an exercise that practices trailing return type syntax (`auto f(...) -> T`) using only types the student knows: `int`, `long long`, `double`, `std::string`. Three chained functions (square, halve, classify) demonstrate the syntax without any pointers, arrays, or references.

### 10.x.1 — Safe Statistics Calculator (replaced)

**Problem:** Used `std::vector` (Ch 16) and range-based for with `auto&` (Ch 12/16). Both are forward references the student cannot understand.

**Fix:** Replaced with "Capstone: Grade Calculator" — reads exactly three scores (no arrays/vectors needed), computes sum, average (with `static_cast`), max (with if/else), and letter grade (via a function with trailing return type). Exercises type aliases, `auto`, `static_cast`, list-initialization, and trailing return types — all Ch 10 concepts, no forward references.
