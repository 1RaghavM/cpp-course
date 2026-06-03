# Chapter 14 Audit: Introduction to Classes

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Lessons reviewed:** 18 (14.1 through 14.x)
**Prior lessons available:** Ch 0-12 complete, Ch 13.1 only

---

## 1. Forward References

### 1A. References to concepts NOT yet available (post-Ch 14)

| Lesson | Issue | Severity |
|--------|-------|----------|
| **14.1 summary** | Mentions "operator overloading" and "inheritance" as upcoming topics. Acceptable as forward-looking teaser, not teaching the concept. | **OK (no fix needed)** |
| **14.2 summary** | Final sentence: "constructors, destructors, operator overloading, and inheritance all build directly on what is introduced here." Acceptable forward-looking reference. | **OK (no fix needed)** |
| **14.3 summary** | Mentions "operator overloading" in final paragraph as something that builds on member functions. Forward-looking, not teaching. | **OK (no fix needed)** |
| **14.5 summary** | Mentions "protected -- accessible from the class and its derived classes (covered when inheritance is introduced)." Correctly deferred. | **OK (no fix needed)** |
| **14.7 exercise 2 (Player Profile)** | Uses `std::vector<Player>`. **`std::vector` is Ch 16/17 material** and is NOT in the prior_lesson_titles. | **HIGH -- forward reference to vector** |
| **14.8 summary** | Mentions "Member functions returning references to data members (covered in the previous lesson) can accidentally break encapsulation." Correct back-reference. | **OK** |
| **14.10 summary** | "Members of a type with no default constructor (covered when inheritance is introduced)" -- correctly deferred. | **OK** |
| **14.11 exercise 2 (Temperature Log)** | Uses `std::vector<TempReading>`. **`std::vector` is Ch 16/17 material** and is NOT in the prior_lesson_titles. | **HIGH -- forward reference to vector** |
| **14.14 summary** | "When your class owns a heap-allocated resource (a topic that connects to later chapters on dynamic memory), you must write a copy constructor that allocates a fresh copy" -- correctly deferred. | **OK** |
| **14.14 exercise 2 (Student Grade Book)** | Uses C-style array `int grades[5]` and `int g[5]` which is acceptable since fixed-size C arrays have been used in 14.3 exercise 2 (TemperatureLog) already. However, C-style arrays are NOT in the prior_lesson_titles (arrays are Ch 16/17). | **MEDIUM -- C-style arrays not formally covered** |
| **14.15 exercise 1 (Track Constructor Calls)** | Uses `static` data members (`static int ctor_count`, `static int copy_count`). Static members are **Ch 15 material** and not in prior_lesson_titles. | **HIGH -- forward reference to static members** |

### 1B. Internal ordering issues within Ch 14

| Lesson | Issue | Severity |
|--------|-------|----------|
| **14.1 summary** | Uses constructors with member initializer lists, `private` access specifiers, and `const` member functions in the "Minimal Example" code. These are NOT yet formally taught -- constructors are 14.9, access specifiers are 14.5, const member functions are 14.4. The lesson 14.1 is supposed to be an OOP *introduction*. | **HIGH -- premature use of constructors, access specifiers, and const in lesson 1** |
| **14.1 exercise 1 (Temperature Class)** | Requires students to write a constructor with member initializer list, private members, and const member functions. All three are taught later in Ch 14 (14.5, 14.9, 14.10). | **HIGH -- exercise uses concepts not yet taught** |
| **14.1 exercise 2 (Rectangle Class)** | Same issues: constructor with member initializer list, private members, const member functions. | **HIGH -- exercise uses concepts not yet taught** |
| **14.2 summary** | Uses aggregate initialization with `Cat c{"Mochi", 3}` which is fine (public members). But also references access specifiers and `const` in detail, which are upcoming lessons. Summary text is acceptable since it's an introduction; the code example keeps members public. | **LOW -- acceptable as conceptual intro** |
| **14.2 exercise 2 (Rectangle with private + constructor)** | Requires constructor and private members. Constructors are 14.9; however access specifiers are 14.5, which is still 3 lessons away. | **MEDIUM -- private members used before 14.5** |
| **14.3 exercise 2 (TemperatureLog)** | Uses a C-style array `double readings[10]` as a data member. C-style arrays are not in prior lessons. | **MEDIUM -- C-style arrays not formally covered** |
| **14.5 summary** | Uses `explicit` keyword in BankAccount constructor example. `explicit` is not taught until 14.16. | **MEDIUM -- premature use of explicit in summary example** |
| **14.7 summary** | Mentions `std::vector` in passing ("For a `std::string` or `std::vector`, that copy has real cost"). Conceptual reference, no code. | **LOW** |
| **14.8 summary** | Uses `explicit` keyword in BoundedCounter example. `explicit` is taught in 14.16. | **LOW -- example code, not an exercise requirement** |
| **14.9 summary** | Uses `std::move` in constructor example. `std::move` is a move-semantics concept not covered until later chapters. | **MEDIUM -- std::move not covered** |

### 1C. std::move usage audit

`std::move` appears in solution code for:
- 14.1 exercise 1 (solution_code -- not required by prompt, but present)
- 14.7 exercise 2 (Player Profile solution)
- 14.8 exercise 2 (BoundedCounter solution)
- 14.9 exercise 1 (Book solution)
- 14.9 exercise 2 (Sensor solution)
- 14.11 exercise 1 (Item solution)
- 14.11 exercise 2 (TempReading solution)
- 14.12 exercise 1 (Book solution)
- 14.12 exercise 2 (Sensor solution)
- 14.15 exercise 1 (Widget summary code)
- 14.17 exercise 2 (Temperature solution)

**Verdict:** `std::move` is not covered in prior chapters (it is Ch 22/move semantics). While solution code using `std::move` is an optimization and solutions still compile without it, the summaries teaching it as "prefer this style" (14.1, 14.9) is misleading for students at this stage. **MEDIUM severity across many lessons.**

---

## 2. Exercise Progression

### Progression Map

| Lesson | Exercise 1 | Exercise 2 | Concepts Practiced |
|--------|-----------|-----------|-------------------|
| 14.1 | Temperature (constructor + private + const) | Rectangle (constructor + private + const + loop) | **Too advanced for lesson 1** |
| 14.2 | Book (public aggregate + const method) | Rectangle (private + constructor + const + display) | Basic classes, public/private |
| 14.3 | Rectangle (member functions: area, perimeter, scale) | TemperatureLog (array member, add/min/max/avg) | Mutating + const member functions |
| 14.4 | Thermometer (const object + const getters) | Rectangle (const ref param + const getters) | Const correctness |
| 14.5 | TemperatureSensor (private state + set/get commands) | Counter (private state + increment/decrement/reset) | Access specifiers, encapsulation |
| 14.6 | Temperature (getter + validated setter) | Student (name + grade + letterGrade) | Access functions with validation |
| 14.7 | Sensor (const/non-const reference overloads) | Player (vector + reference accessors + top player) | Reference return, const overloads |
| 14.8 | Percentage (clamped setter) | BoundedCounter (named, max, reset tracking) | Encapsulation, invariants |
| 14.9 | Book (constructor + member init list + print) | Sensor (parameterized + default constructor + stats) | Constructor basics |
| 14.10 | Rectangle (const member via init list) | BankAccount (const + default member init override) | Member initializer lists |
| 14.11 | Item (default + parameterized, input parsing) | TempReading (single constructor with defaults) | Default constructors, default args |
| 14.12 | Book (delegation chain) | Sensor (4-level delegation chain) | Delegating constructors |
| 14.13 | Rectangle (temporary to free function) | Point (closest_to_origin via temporaries) | Temporary objects |
| 14.14 | Temperature (trace copy constructor) | Student (copy constructor + grades array) | Copy constructor |
| 14.15 | Sensor (static counters for ctor/copy calls) | Point (midpoint factory, elision diagnostics) | Copy elision |
| 14.16 | Wallet (explicit constructor) | Rectangle (explicit square constructor + scale) | explicit keyword |
| 14.17 | Rectangle (constexpr aggregate) | Temperature (constexpr class + factory) | constexpr classes |
| 14.x | (no exercises) | | Chapter summary |

### Progression Issues

| Issue | Severity |
|-------|----------|
| **14.1 exercises are far too advanced for the first lesson.** They require constructors (14.9), member initializer lists (14.10), private members (14.5), and const member functions (14.4). These should be simple conceptual exercises or use only public members with aggregate init. | **HIGH** |
| **14.2 exercise 2 requires private + constructor** before those are formally taught (14.5 and 14.9). | **MEDIUM** |
| **14.9 (constructors) comes AFTER 14.5 (access specifiers)**, yet access specifier exercises already use constructors. The ordering assumes students can write constructors before the constructor lesson. | **HIGH -- fundamental ordering problem** |
| Exercise variety is reasonable after lesson 14.5 -- Temperature, Rectangle, Book, Sensor, Counter, Student, Player, BankAccount, etc. Good domain diversity. | **OK** |
| Gradual complexity increase from 14.5 onward is well-paced. | **OK** |
| The command-parsing exercises (14.5, 14.8) provide good interactive practice. | **OK** |

---

## 3. Factual Errors

| Lesson | Issue | Severity |
|--------|-------|----------|
| **14.1 summary** | States "the only built-in difference is default access: `struct` members are `public` by default, `class` members are `private`." Technically, there is also a difference in default inheritance access (public vs private). Minor omission acceptable at this introductory level. | **LOW** |
| **14.2 summary** | "Members declared before any specifier are **private by default** in a `class`" -- **correct**. | **OK** |
| **14.2 summary** | Uses `Cat c{"Mochi", 3}` with aggregate initialization on a class with all public members and no user-declared constructors. This is correct for C++20 aggregates (user-declared constructors disqualify, but there are none here). However, the code also uses `std::println` and `std::format` which require C++23/C++20 respectively. | **LOW -- C++ standard feature availability** |
| **14.4 summary** | "A const member function receives the implicit `this` pointer as a pointer-to-const" -- **correct**. | **OK** |
| **14.5 summary BankAccount example** | Uses `throw std::invalid_argument`. Exceptions are not in prior lessons (not formally covered). However, this is just an illustrative example in the summary, not an exercise requirement. | **LOW** |
| **14.10 summary** | "Members are initialized in the order they are **declared in the class**, not the order they appear in the initializer list." -- **correct and important**. | **OK** |
| **14.11 summary** | "A constructor with all defaulted parameters counts as *the* default constructor; having both `Sensor()` and `Sensor(int = 0, double = 0.0)` creates an ambiguous call" -- **correct**. | **OK** |
| **14.12 summary** | "Delegation chains must not be circular... is undefined behavior" -- technically it would be ill-formed/compile error rather than UB in practice, but the warning is directionally correct. | **LOW** |
| **14.14 summary** | "Without the reference, passing the argument would itself trigger a copy, causing infinite recursion" for copy constructor parameter -- **correct**. | **OK** |
| **14.14 exercise 2 (Student Grade Book)** | The copy constructor initializes `count` from `src.count` via the member initializer list, then copies `name` in the body via assignment. This means `name` is default-constructed first, then assigned. While the lesson 14.10 teaches that initializer lists are preferred over body assignment, the exercise solution itself uses body assignment for `name`. Inconsistent with the teaching. | **MEDIUM -- solution contradicts init list teaching** |
| **14.15 summary** | "Mandatory copy elision (C++17+): When you initialize an object directly from a temporary (a prvalue), the copy is guaranteed to be elided" -- **correct**. | **OK** |
| **14.14 exercise 1 expected output** | The expected output for the sample test case shows `Constructed: 36.6C` then `Copy constructor: 36.6C` x2, then `Passed by value`, then **`Constructed: 36.6C`** then `Copy constructor: 36.6C` then `Returned by value`. The `Constructed` line appears for `makeTemperature`'s local variable. But the prompt description says line 5 should be "printed by the copy constructor when `makeTemperature` copies its local object into the caller" -- yet the test expects `Constructed` (for the local) before `Copy constructor` (for the return copy). The prompt's 6-line description does not match the 7-line expected output. | **HIGH -- prompt says 6 lines, test expects 7 lines** |

---

## 4. Code Quality

### Compilation Issues

| Lesson | Issue | Severity |
|--------|-------|----------|
| **14.1 summary code** | Uses `std::format` (C++20) and `std::move` (C++11 but conceptually later). Will compile with C++20 but students may not be on C++20. | **LOW** |
| **14.2 summary code** | Uses `std::println` (C++23). Many compilers/toolchains do not yet support this. | **MEDIUM -- C++23 dependency** |
| **14.3 summary code** | Uses `std::println` (C++23). Same issue. | **MEDIUM** |
| **14.3 summary code** | Uses designated initializers `Circle c { .radius = 5.0 }` (C++20). Acceptable for C++20 target. | **LOW** |
| **14.3 exercise 1 solution** | Uses designated initializers `Rectangle r { .width = w, .height = h }` (C++20). The starter code uses this too. | **LOW** |
| **14.5 solution** | Uses `std::format` (C++20). Solution code compiles with C++20. | **OK for C++20 target** |
| **14.11 exercise 1 (Item) solution** | The input parsing logic uses `std::cin.peek()` to distinguish between "name only" and "name + quantity" lines. This approach is fragile: `peek()` returns `'\n'` or space depending on buffering, and the solution checks for `' '` or `'\t'`. On some platforms, the `'\n'` after `DEFAULT` may already be consumed when reading the next token. The solution may fail on certain input formats. | **MEDIUM -- fragile input parsing** |
| **14.11 exercise 2 (TempReading) solution** | Same fragile `peek()`-based parsing. Additionally uses `std::cin.tellg()` and `std::cin.seekg()` which don't work reliably with standard input on all platforms. | **HIGH -- tellg/seekg unreliable on stdin** |
| **14.15 exercise 1 solution** | Uses `static` members and out-of-class definitions (`int Sensor::ctor_count = 0;`). Static members are not taught until Ch 15. | **HIGH -- requires untaught concept** |

### Test Case Issues

| Lesson | Issue | Severity |
|--------|-------|----------|
| **14.11 exercise 1** | The requirement says "use two separate constructors: `Item() = default` and `Item(std::string name, int qty = 1)`" but also says in requirement 1 "Define a single constructor `Item(std::string name = \"unknown\", int qty = 0)`". Requirements 1 and 2 **contradict each other**. Requirement 1 says single constructor with `qty = 0` default; requirement 2 says two constructors with `qty = 1` default. The solution follows requirement 2. | **HIGH -- contradictory requirements** |
| **14.14 exercise 1** | Prompt describes 6 output lines but test expects 7 lines (includes the `Constructed` line from `makeTemperature`'s local object). The prompt's numbered description misses a line. | **HIGH -- prompt/test mismatch** |
| **14.14 exercise 2** | Test expects the copy constructor message **before** "Original:" line. But the prompt says the output should be 6 lines starting with "Original:". The test case shows `Copy constructor called for: Alice` as line 1, then `Original: Alice avg=80.00` as line 2. The prompt lists the "copy constructor" output as line 2 of 6, but the test places it as line 1 because the copy happens at `Student copy = original` before any print statement. The prompt's numbering is misleading but the test is logically correct. | **MEDIUM -- prompt description ordering doesn't match test** |
| **14.15 exercise 2 (Point Factory)** | Test expects exactly 2 "Copied" lines when passing `p` and `q` by value to `midpoint`. This is correct only if copy elision is NOT applied to lvalue arguments (which it isn't -- elision only applies to prvalues/NRVO). However, the expected output does NOT include a "Copied" line for `Point m = midpoint(p, q)` return, confirming mandatory elision on the prvalue return. **Correct behavior.** | **OK** |
| **14.17 exercise 2** | `static_assert(Temperature::fromFahrenheit(212.0).celsius() == 100.0)` -- this relies on floating-point arithmetic producing exactly `100.0` from `(212.0 - 32.0) * 5.0 / 9.0`. Let's verify: `180.0 * 5.0 / 9.0 = 900.0 / 9.0 = 100.0`. This is exact in IEEE 754 double. | **OK** |
| **14.17 exercise 2** | `static_assert(Temperature::fromCelsius(0.0).fahrenheit() == 32.0)` -- `0.0 * 9.0 / 5.0 + 32.0 = 32.0`. Exact. | **OK** |

---

## 5. Summary of Findings by Severity

### HIGH (must fix)

1. **14.1 exercises require constructors, private members, and const member functions** -- all taught later in Ch 14 (14.4, 14.5, 14.9, 14.10). Students hitting this lesson first cannot complete these exercises with only prior knowledge. **Fix:** Replace with exercises using only public members and aggregate initialization, or reorder Ch 14 so constructors come first.

2. **Fundamental ordering problem: constructors (14.9) come after access specifiers (14.5)**, but exercises in 14.2-14.5 already require constructors. The learncpp.com order puts constructors late, but the exercises assume them early. **Fix:** Either reorder lessons so constructors come before access specifiers, or rewrite exercises in 14.2-14.8 to not require user-defined constructors.

3. **14.7 exercise 2 and 14.11 exercise 2 use `std::vector`** -- not covered until Ch 16/17. **Fix:** Replace with C-style fixed-size arrays (or better, restructure to avoid containers entirely).

4. **14.15 exercise 1 uses `static` data members** -- not covered until Ch 15. **Fix:** Use global variables for counters instead, or move this exercise to Ch 15.

5. **14.11 exercise 1 has contradictory requirements** (requirement 1 says single constructor, requirement 2 says two constructors with different defaults). **Fix:** Pick one approach and rewrite consistently.

6. **14.14 exercise 1 prompt describes 6 output lines but test expects 7.** The `Constructed` line from inside `makeTemperature` is missing from the prompt's description. **Fix:** Update prompt to describe all 7 expected output lines.

7. **14.11 exercise 2 solution uses `tellg()`/`seekg()` on stdin** -- unreliable on many platforms and compilers. **Fix:** Use line-based parsing (`std::getline` + `std::istringstream`) or a simpler input format.

### MEDIUM (should fix)

1. **14.3 exercise 2 and 14.14 exercise 2 use C-style arrays** (`double readings[10]`, `int grades[5]`) -- not formally covered in prior chapters. Arrays are Ch 16 material. Since these are fixed-size and simple, this is less severe than vector usage, but still a gap.

2. **14.2 exercise 2 requires private members + constructor** before either is formally taught (14.5, 14.9).

3. **14.5 and 14.8 summary examples use `explicit` keyword** before it is taught in 14.16.

4. **`std::move` used pervasively in solution code and summaries** without being taught (it's Ch 22 material). While solutions compile without it, teaching it as "prefer this style" is premature.

5. **Multiple summaries use `std::println` (C++23)** which many compilers don't support yet (14.2, 14.3, 14.4, 14.7, 14.8, 14.13, 14.17 summary, 14.x summary).

6. **14.14 exercise 2 prompt description ordering** doesn't match actual test output ordering (copy constructor message appears before "Original:" print).

7. **14.14 exercise 2 solution** uses body-assignment for `name` instead of member initializer list, contradicting 14.10's teaching.

8. **14.11 exercise 1 solution** uses fragile `std::cin.peek()` parsing that may break on some platforms.

9. **14.9 summary** teaches `std::move` as the correct pattern for string parameters in constructors, but `std::move` has not been covered.

### LOW (minor, consider fixing)

1. Summary mentions of `std::vector` in passing (14.7) -- acceptable as conceptual reference.
2. Minor omission about default inheritance access in struct vs class distinction (14.1).
3. 14.12 summary says circular delegation is "undefined behavior" -- technically ill-formed, not UB.
4. Use of designated initializers (C++20) in examples and exercises (14.3).
5. Use of `std::format` (C++20) throughout -- acceptable if C++20 is the target standard.
6. Use of exceptions (`throw`) in illustrative examples (14.5) without prior teaching.

---

## 6. Recommendations

### Critical Restructure Needed

The most impactful issue is the **ordering mismatch between lessons and exercises**. The lesson order follows learncpp.com (OOP intro -> classes -> member functions -> const -> access specifiers -> ... -> constructors), but exercises from lesson 14.1 onward assume constructor knowledge. Two approaches:

**Option A (recommended): Reorder lessons** so constructors (14.9-14.10) come right after the initial class introduction (14.1-14.2), before access specifiers. This matches how exercises naturally need constructors to initialize private data.

**Option B: Rewrite early exercises** to use only aggregate initialization with all-public structs until constructors are formally introduced at 14.9. Exercises 14.1-14.8 would use `struct` with public members and brace-init.

### Vector Dependencies

Remove `std::vector` from exercises 14.7.2 and 14.11.2. Replace with fixed-size C-style arrays or restructure the exercises to process items one at a time without storing them.

### Static Members

Move exercise 14.15.1 (static counters) to after Ch 15, or replace static members with a different counting mechanism (e.g., pass-by-reference counters to functions).

### std::move

Remove `std::move` from all solution code and summary examples, or add a brief note that pass-by-value + move is an optimization pattern covered later and that passing by `const&` is equally correct at this stage.
