# Chapter 15 Audit: "More on Classes"

## Audit Criteria
1. **Forward references** -- concepts NOT yet available in Ch 15:
   - Arrays/vectors (Ch 16/17)
   - Dynamic allocation `new`/`delete` (Ch 19)
   - Smart pointers (Ch 22)
   - Operator overloading (Ch 21) -- except I/O operator overloading previewed in Ch 13
   - Inheritance (Ch 24)
   - Virtual functions (Ch 25)
   - Note: classes, structs, enums, references, pointers, function templates ARE available
2. **Exercise progression, factual errors, scope creep, code quality**

---

## Lesson 15.1 -- The hidden `this` pointer and member function chaining

### Summary

- **PASS (no forward references).** Summary discusses method chaining, `*this`, `this` pointer types, const qualifiers on `this`. All within scope.
- **Minor note:** The summary uses `std::move(s)` in the `Builder::setLabel` example. `std::move` was introduced via `<utility>` and move semantics were touched on in Ch 14 (copy constructors, copy elision). This is borderline but acceptable since Ch 14 covers temporary objects and copy elision.
- **Factual accuracy:** Correct. `this` is `ClassName* const`; on const member functions, `const ClassName* const`. Accurate.

### Exercise 1: "Chainable Counter Builder"

- **PASS.** Simple struct with `add`, `subtract`, `multiply`, `print`. All methods return `*this`. No forward references.
- **Test cases:** Correct arithmetic. `10 - 3 = 7, 7 * 4 = 28`. Zero multiply. Equal add/subtract.
- **Code quality:** Clean. Starter code is well-scaffolded.

### Exercise 2: "Counter with Fluent Interface"

- **PASS.** No stdin, hardcoded chain. Tests `increment`, `decrement`, `add`, `reset`.
- **ISSUE (test quality):** All three test cases produce identical expected output (`3\n12\n5\n`). The hidden tests add zero value -- they are just re-runs of the same deterministic program. This is a waste of test slots. At minimum, the hidden tests should use different chains (e.g., via stdin-controlled operations) to test edge cases. **Severity: medium.**
- **Code quality:** Good starter code. Solution is correct.

### Exercise 3: "Chainable String Formatter with const Print"

- **PASS (no forward references).** Uses `std::string`, `std::transform`, `std::toupper`/`std::tolower`, lambdas -- all available.
- **ISSUE (const-correctness -- does not compile):** The solution chains `printBefore()` (which returns `const TextLine&`) and then calls non-const `toUpper()` or `toLower()` on the result. The chain is: `TextLine(word1).append(word2).printBefore().toUpper().printAfter()`. Step by step:
  1. `TextLine(word1)` -- non-const temporary
  2. `.append(word2)` -- returns `TextLine&` (non-const)
  3. `.printBefore()` -- returns `const TextLine&`
  4. `.toUpper()` -- called on `const TextLine&` -- **compile error**: cannot call non-const member function on a const reference
  The C++ type system checks the static type of the expression (`const TextLine&`), not the dynamic const-ness of the underlying object. The solution's comment ("the next mutable call is valid because the underlying object is non-const") is **factually wrong**. **Severity: HIGH -- solution does not compile.**
  - **Fix:** Either (a) make `printBefore` return `TextLine&` on non-const objects by providing both const and non-const overloads (ref qualifiers: `const TextLine& printBefore() const &` and `TextLine& printBefore() &`), or (b) split the chain into two statements (call `printBefore` separately, then chain `toUpper().printAfter()`), or (c) simply make `printBefore` return `TextLine&` (non-const) -- it still prints correctly, just doesn't advertise const-ness on the return.

### Exercise 4: "String Builder with History"

- **PASS (no forward references).** Uses `std::string::insert`, `std::transform`, `std::toupper`. All available.
- **Test cases:** Correct. `"world"` + prepend `"hello "` + append `"!"` + toUpper = `"HELLO WORLD!"`, ops = 4.
- **Code quality:** Good.

---

## Lesson 15.2 -- Classes and header files

### Summary

- **PASS (no forward references).** Discusses ODR, include guards, inline, header/cpp separation. All within scope.
- **Factual accuracy:** Correct. Good example of `#ifndef` guards.

### Exercise 1: "Inline vs Out-of-Line: Annotate a Rectangle Class"

- **PASS.** Single-file exercise demonstrating inline keyword on out-of-class definitions.
- **Test cases:** Correct. 4x6: area=24, perimeter=20. 5x5: square=yes. 1x1000: area=1000, perimeter=2002.
- **Code quality:** Good.

### Exercise 2: "Chainable Temperature Logger with Header-Style Separation"

- **FORWARD REFERENCE: `std::vector`** -- This exercise uses `std::vector<double>` as a private member and calls `.push_back()`, `.size()`, `.begin()`, `.end()`. Vectors are Ch 16/17 material. **Severity: HIGH.**
- **FORWARD REFERENCE: `std::min_element` / `std::max_element`** -- These algorithms iterate over a range via iterators, which is a Ch 16+ concept. However, `<algorithm>` usage with begin/end is arguably covered by std::string usage in earlier chapters. Still, the primary issue is `std::vector` itself.
- **Test cases:** Correct arithmetic.
- **Code quality:** Good aside from the forward reference.

---

## Lesson 15.3 -- Nested types (member types)

### Summary

- **PASS (no forward references).** Covers nested enums, nested classes, nested type aliases. All within scope.
- **Factual accuracy:** Correct. Good examples.
- **Minor inaccuracy:** "the nested class can see public members of the outer class (but not private members unless it is a friend)" -- in C++11 and later, a nested class IS implicitly a friend of the enclosing class and CAN access private members. This is a **factual error**. The C++ standard (since C++11) states nested classes have access to all members of the enclosing class. **Severity: medium.**

### Exercise 1: "Traffic light with a nested enum"

- **PASS.** Simple nested enum class, switch-based cycling. No forward references.
- **Test cases:** Correct. 0 advances = Red, 1 = Green, 3 = Red (full cycle).
- **Code quality:** Good.

### Exercise 2: "Deck of cards with nested suit enum and method chaining"

- **PASS.** Combines nested enum with `*this` chaining. `std::to_string` is used for rank numbers (available).
- **Test cases:** Correct. Ace of Spades (3,1), 7 of Diamonds (1,7), Queen of Hearts (2,12).
- **Code quality:** Good. Uses `static_cast` for int-to-enum conversion.

---

## Lesson 15.4 -- Introduction to destructors

### Summary

- **FORWARD REFERENCE in summary example:** The summary example uses `new int[size]` and `delete[] data` in the `Buffer` class example. Dynamic allocation (`new`/`delete`) is Ch 19 material. The summary also mentions "heap objects" destroyed by `delete`. **Severity: medium** -- the summary is teaching the concept of destructors so discussing heap briefly is somewhat necessary, but the code example with `new`/`delete` is premature.
- **FORWARD REFERENCE:** Mentions `std::unique_ptr` and `std::lock_guard` -- these are Ch 22+ material. Mentioning them by name is fine for context, but students haven't seen them. **Severity: low** (name-drop only).
- **Rule of Five mention:** Mentions "Rule of Five" (copy constructor, copy assignment, move constructor, move assignment) -- move semantics are not fully covered yet. **Severity: low** (informational mention only, not requiring implementation).
- **Factual accuracy:** Otherwise correct.

### Exercise 1: "Track object lifetimes with a destructor"

- **PASS.** No heap allocation, no forward references. Just prints on construct/destruct.
- **ISSUE (test quality):** All three test cases produce identical expected output. Same problem as 15.1 exercise 2. No stdin means no variation. **Severity: low** (acceptable for a demonstration exercise, but wasted test slots).
- **Code quality:** Good.

### Exercise 2: "RAII integer array wrapper"

- **FORWARD REFERENCE: `new int[size]` and `delete[]`** -- Dynamic allocation is Ch 19 material. The exercise explicitly requires `new` and `delete[]`. **Severity: HIGH.**
- **Test cases:** Correct arithmetic. 4 elements overwritten: 1+2+3+4=10. 3 elements at fill=5, overwritten: 10+20+30=60. Single element overwritten: 7.
- **Code quality:** Solution is correct but violates the Rule of Three/Five (no copy constructor/assignment defined). If the object were copied, double-free would occur. However, since the exercise is specifically teaching RAII, this is a known simplification.

---

## Lesson 15.5 -- Class templates with member functions

### Summary

- **PASS (no forward references).** Discusses class template syntax, template instantiation, multiple template parameters. All within scope (function templates are Ch 11).
- **Factual accuracy:** Correct.

### Exercise 1: "Generic Stack class template"

- **ISSUE (fixed-size array as data member):** The solution uses `T data[N]{}` (a C-style array as a class member). While C-style arrays are a fundamental type and technically legal here, arrays as a topic are Ch 16. However, a fixed-size array as a struct member with index access is simple enough and is more about the template than about arrays. **Severity: low-medium** -- borderline. The non-type template parameter `std::size_t N` is covered in Ch 11.9.
- **ISSUE (uses `std::istringstream`):** The starter code includes `<sstream>` and uses `std::istringstream`. String streams have not been formally introduced in the prior chapters. **Severity: low** -- it is in the provided starter code, not something the student writes.
- **Test cases:** Correct. Stack LIFO ordering verified.
- **Code quality:** Good.

### Exercise 2: "Pair template with chained comparisons"

- **PASS.** Combines class templates with method chaining. No forward references.
- **ISSUE (unused include):** Starter code includes `<sstream>` but it is not used in the solution. **Severity: trivial.**
- **Test cases:** Correct. `pairMin` and `pairMax` verified with positive, equal, and negative values.
- **Code quality:** Good. Out-of-class template definitions are correct.

---

## Lesson 15.6 -- Static member variables

### Summary

- **PASS (no forward references).** Covers `static`, `inline static`, `constexpr static`.
- **Factual accuracy:** Correct. Good coverage of C++17 `inline static`.

### Exercise 1: "Instance Counter with Static Member"

- **FORWARD REFERENCE: `std::vector<Robot*>` with `new` and `delete`** -- The starter code and solution use `new Robot{}` and `delete robots.back()`. Dynamic allocation is Ch 19. `std::vector` is Ch 16/17. **Severity: HIGH.**
- **Test cases:** Correct. 3 creates + 1 destroy = 2 alive. All destroyed = 0. Destroy on empty = no-op.
- **Code quality:** The exercise conflates two concepts (static members AND manual memory management). The dynamic allocation could be avoided by using scope-based lifetime (creating objects in nested blocks).

### Exercise 2: "Unique ID Generator with Static Counter"

- **FORWARD REFERENCE: `std::vector<Ticket>`** -- uses `std::vector` with `.reserve()` and `.emplace_back()`. Vectors are Ch 16/17. **Severity: HIGH.**
- **ISSUE (encapsulation):** `m_id` is declared as a `public` member in the solution, which goes against the data-hiding principles taught in Ch 14. The `id()` getter is provided but `m_id` is still public. **Severity: low** (since the prompt says to add a getter, the public `m_id` is just sloppy in the solution).
- **Test cases:** Correct. IDs 1 through N verified.

---

## Lesson 15.7 -- Static member functions

### Summary

- **PASS (no forward references).** Covers static member functions, no `this`, factory pattern.
- **ISSUE (summary uses `std::println`):** The example code uses `std::println` from `<print>`, which is a C++23 feature. While technically available in modern compilers, the curriculum has been using `std::cout` throughout. This may confuse students. **Severity: low.**
- **Factual accuracy:** Correct.

### Exercise 1: "Instance Counter" (Widget)

- **FORWARD REFERENCE: `std::vector<Widget>`** -- `std::vector` with `.clear()`. Vectors are Ch 16/17. **Severity: HIGH.**
- **ISSUE (near-duplicate):** This exercise is essentially the same concept as 15.6 Exercise 1 (Robot instance counter) and 15.x Exercise 1 (Tracked instance counter). Three exercises across the chapter test the same static counter + constructor/destructor pattern with trivially different class names. **Severity: medium (redundancy).**
- **Test cases:** Correct.

### Exercise 2: "Widget Factory Counter"

- **FORWARD REFERENCE: `std::vector<Widget*>` with `new`/`delete`** -- Same as 15.6 Exercise 1. Dynamic allocation is Ch 19. **Severity: HIGH.**
- **Test cases:** Correct.
- **Code quality:** Good. Tests both `s_created` (monotonic) and `s_alive` (tracks lifetime).

### Exercise 3: "Temperature Factory"

- **PASS (no forward references).** Pure class template with static factory methods. No vectors, no dynamic allocation.
- **Test cases:** Correct. C 100 -> 212F. F 32 -> 0C. C 0 -> 32F.
- **Code quality:** Good. Private constructor + static factories is a clean pattern.

### Exercise 4: "Temperature Log with Static Summary"

- **FORWARD REFERENCE: `std::vector<TempLog>`** -- The solution uses `std::vector`. **Severity: HIGH.**
- **Note:** The starter code does not include `<vector>`, but the solution does. The exercise could be rewritten to not require storing objects at all -- just construct and discard.
- **Test cases:** Correct. Average verified.
- **ISSUE (design):** The exercise creates `TempLog` objects and stores them in a vector, but the individual `m_temp` members are never read after construction. The vector is unnecessary; the static members accumulate everything. The exercise could simply construct temporaries in a loop. **Severity: low (design smell).**

---

## Lesson 15.8 -- Friend non-member functions

### Summary

- **PASS.** Covers friend declarations, `operator<<`, tradeoffs.
- **SCOPE CONCERN:** Mentions "operator overloading" -- while I/O operator overloading was previewed in Ch 13 (per the audit rules), `operator+`, `operator==`, `operator!=` are full operator overloading (Ch 21). The summary text discusses them as use cases. **Severity: low** in the summary, but the exercises may be problematic.
- **Factual accuracy:** Correct.

### Exercise 1: "Friend operator<< and operator+ for a Distance Class"

- **FORWARD REFERENCE: `operator+` overloading** -- Operator overloading (beyond I/O) is Ch 21 material. This exercise requires implementing `operator+` as a friend non-member. **Severity: HIGH.**
- **Mitigation:** The friend keyword is the lesson topic, and using `operator+` as the vehicle is a natural pairing. However, per the audit rules, operator overloading except I/O (`<<`/`>>`) is Ch 21.
- **Test cases:** Correct. Carry normalization verified (150 cm = 1m 50cm). Exact 100 carry. No carry.
- **Code quality:** Good.

### Exercise 2: "Box volume comparison with friend operator<<"

- **PASS.** Only uses `operator<<` (I/O overloading, previewed in Ch 13) and a regular friend function `totalVolume`. No arithmetic operator overloading.
- **Test cases:** Correct. Volume calculations verified.
- **Code quality:** Good.

### Exercise 3: "Friend operator== and operator!= for a Rectangle Class"

- **FORWARD REFERENCE: `operator==` and `operator!=` overloading** -- These are comparison operator overloads, which are Ch 21 material. **Severity: HIGH.**
- **ISSUE (confusing prompt):** The prompt says "`area()` is private -- call it through a friend function or expose it only to `operator<<`" but then suggests adding a `getArea` friend function. This is over-engineered and confusing. If `area()` needs to be printed, just make it public. **Severity: medium (pedagogical confusion).**
- **Test cases:** Correct. Equal, unequal, and swapped dimensions verified.

### Exercise 4: "Temperature class with friend operator<< and static conversion helper"

- **PASS.** Uses `operator<<` (I/O overloading, allowed) and a regular friend function `hotter`.
- **ISSUE (floating-point comparison):** The `hotter` function compares doubles with `>` and `<` directly. Floating-point equality comparison (`0 C` vs `32 F`) may fail due to precision. `(32 - 32) * 5 / 9 = 0.0` is exact in this case, but the general approach is fragile. **Severity: low** (test cases are carefully chosen to avoid precision issues).
- **ISSUE (output format):** The solution prints `100°C` using `std::cout << t.value`. For `double` values that are whole numbers, the default `<<` formatting will print `100` not `100.0`. The expected output `100°C` matches this. Consistent. **PASS.**
- **Test cases:** Correct.

---

## Lesson 15.9 -- Friend classes and friend member functions

### Summary

- **PASS (no forward references).** Covers friend classes, friend member functions, one-way/non-transitive/non-inherited nature.
- **Factual accuracy:** Correct.

### Exercise 1: "Rectangle and Inspector"

- **PASS.** Simple friend class declaration. No forward references, no operator overloading.
- **Test cases:** Correct.
- **Code quality:** Clean and focused.

### Exercise 2: "BankAccount and Auditor with Static Totals"

- **PASS.** Friend member function + static member variable. No forward references.
- **ISSUE (ordering):** The exercise requires `Auditor` to be defined before `BankAccount` so the `friend void Auditor::report(const BankAccount&)` declaration is valid. The solution correctly handles this with a forward declaration and deferred definition. Good pedagogical exercise.
- **Test cases:** Correct. Interleaved deposits and reports verified.
- **Code quality:** Good.

---

## Lesson 15.10 -- Ref qualifiers

### Summary

- **PASS (mostly).** Covers `&` and `&&` ref qualifiers on member functions.
- **ISSUE:** Summary says "This concept connects directly to the move semantics preview from **Static member variables**" -- there is no move semantics preview in the static member variables lesson. This appears to be an incorrect cross-reference. **Severity: low (misleading cross-reference).**
- **Factual accuracy:** Otherwise correct. The `std::optional::value()` reference is appropriate.

### Exercise 1: "Ref-qualified getter: safe reference vs. moved value"

- **PASS.** Clean exercise on ref qualifiers. No forward references.
- **ISSUE (test quality):** All three test cases produce identical output (no stdin, deterministic program). Same problem as other exercises. **Severity: low.**
- **Code quality:** Good.

### Exercise 2: "Builder with ref-qualified build(): lvalue copies, rvalue moves"

- **PASS.** Uses `std::string_view` (covered in Ch 5), `std::move` (used in Ch 14 constructors). No forward references.
- **ISSUE (ref qualifier not fully tested):** The `main` function only calls `qb.build()` on an lvalue (`qb` is a named variable). The `&&` overload is never called by the test harness. The exercise asks students to implement both overloads, but only the `const &` one is actually exercised. **Severity: medium** (the `&&` overload is dead code in the test).
- **Test cases:** Correct output for the `const &` path.
- **Code quality:** Good.

---

## Lesson 15.x -- Chapter 15 summary and quiz

### Summary

- **PASS.** Good recap of all chapter topics. Code example combines static counter, destructor, and chaining with ref qualifiers.
- **Factual accuracy:** Correct.

### Exercise 1: "Instance Counter with Destructor"

- **FORWARD REFERENCE: `std::vector<Tracked>`** -- Uses `std::vector`. **Severity: HIGH.**
- **ISSUE (duplicate concept):** This is the THIRD instance-counter exercise in the chapter (after 15.6 Ex1 and 15.7 Ex1). **Severity: medium (severe redundancy).**
- **ISSUE (copy semantics):** When using `push_back(Tracked(i))` (as suggested by the starter code's comment "push_back Tracked(1) through Tracked(n)"), the copy constructor will be invoked. If copies happen, `s_alive` will be incremented for the copy but not for the original destruction during the push. The solution uses `reserve` + `emplace_back` to avoid this, which is a subtle workaround. However, if a student uses `push_back`, the count may be wrong because the compiler-generated copy constructor increments nothing, but the destructor of the temporary will decrement `s_alive`. **Severity: HIGH** -- the exercise is fragile with `std::vector` and copy semantics. Without a properly defined copy constructor, `push_back` could lead to incorrect counts.
  - Specifically: `Tracked` has a user-defined destructor but no user-defined copy constructor. The implicitly-generated copy constructor will NOT increment `s_alive`. So: `push_back(Tracked(1))` -> constructor (+1), copy into vector (no increment), temporary destructor (-1). Net: `s_alive` is 0 after push_back. This is a **silent bug** in the exercise design.
  - The solution avoids this by using `emplace_back`, which constructs in-place. But students are not told about `emplace_back` and may use `push_back`.

### Exercise 2: "Generic Accumulator with Friend and Chaining"

- **PASS.** Combines class template, friend function, method chaining, ref qualifiers. No forward references (no vector, no dynamic allocation -- the accumulator just stores a running total).
- **ISSUE (ref qualifier on methods):** The prompt specifies `Accum<T>& add(T val) &` and `Accum<T>& scale(T factor) &` with lvalue ref qualifiers. However, the solution uses these, and `main` calls them on lvalue `ai` and `ad`, so this is fine.
- **Test cases:** Correct. 2+3+5=10, 10*4=40. 7*1=7. 1+2+3+4+5=15, 15*3=45.
- **Code quality:** Good capstone exercise combining multiple chapter concepts.

---

## Summary of Findings

### HIGH Severity Issues

| # | Lesson | Exercise | Issue |
|---|--------|----------|-------|
| 1 | 15.1 | Ex3 "Chainable String Formatter" | **Solution does not compile.** `printBefore()` returns `const TextLine&`, then non-const `toUpper()`/`toLower()` is called on it. This is a const violation. |
| 2 | 15.2 | Ex2 "Chainable Temperature Logger" | Uses `std::vector<double>` -- vectors are Ch 16/17. |
| 3 | 15.4 | Ex2 "RAII integer array wrapper" | Uses `new`/`delete` -- dynamic allocation is Ch 19. |
| 4 | 15.6 | Ex1 "Instance Counter with Static Member" | Uses `std::vector<Robot*>` with `new`/`delete` -- Ch 16/17 and Ch 19. |
| 5 | 15.6 | Ex2 "Unique ID Generator" | Uses `std::vector<Ticket>` -- Ch 16/17. |
| 6 | 15.7 | Ex1 "Instance Counter (Widget)" | Uses `std::vector<Widget>` -- Ch 16/17. |
| 7 | 15.7 | Ex2 "Widget Factory Counter" | Uses `std::vector<Widget*>` with `new`/`delete` -- Ch 16/17 and Ch 19. |
| 8 | 15.7 | Ex4 "Temperature Log with Static Summary" | Uses `std::vector<TempLog>` -- Ch 16/17. |
| 9 | 15.8 | Ex1 "Friend operator+ for Distance" | `operator+` overloading is Ch 21 (not I/O). |
| 10 | 15.8 | Ex3 "Friend operator== and operator!=" | `operator==`/`operator!=` overloading is Ch 21 (not I/O). |
| 11 | 15.x | Ex1 "Instance Counter with Destructor" | Uses `std::vector<Tracked>` (Ch 16/17) AND has copy-semantics bug: `push_back` would silently produce wrong counts because copy constructor does not increment static counter. |

### MEDIUM Severity Issues

| # | Location | Issue |
|---|----------|-------|
| 1 | 15.1 Ex2 | All 3 test cases produce identical output (no variation, wasted test slots). |
| 2 | 15.3 Summary | Factual error: says nested class cannot access private members of enclosing class without friendship. Since C++11, nested classes implicitly have access. |
| 3 | 15.7 Ex1 | Near-duplicate of 15.6 Ex1 (same instance-counter concept, third time in chapter with 15.x Ex1). |
| 4 | 15.8 Ex3 | Confusing prompt around private `area()` + friend `getArea()` -- over-engineered. |
| 5 | 15.10 Ex2 | The `&&` overload of `build()` is never called by the test harness (only lvalue path tested). |
| 6 | 15.x Ex1 | Third instance-counter exercise in the chapter -- severe redundancy. |

### LOW Severity Issues

| # | Location | Issue |
|---|----------|-------|
| 1 | 15.4 Summary | Mentions `std::unique_ptr`, `std::lock_guard`, Rule of Five -- name-drops only, acceptable. |
| 2 | 15.5 Ex1 | C-style array as class member is borderline (arrays are Ch 16), but usage is simple. |
| 3 | 15.5 Ex2 | Unused `<sstream>` include in starter code. |
| 4 | 15.6 Ex2 | `m_id` is public in solution despite having a getter -- minor encapsulation lapse. |
| 5 | 15.7 Summary | Uses `std::println` (C++23) in example; rest of curriculum uses `std::cout`. |
| 6 | 15.8 Ex4 | Floating-point comparison with `>` / `<` in `hotter()` -- works for chosen test cases but fragile. |
| 7 | 15.10 Summary | Incorrect cross-reference to "move semantics preview from Static member variables" -- no such content exists in that lesson. |
| 8 | 15.4 Ex1, 15.10 Ex1 | All test cases produce identical output (deterministic, no stdin variation). |

### Redundancy Analysis

The chapter has **three** exercises that are essentially "static counter incremented in constructor, decremented in destructor, printed":
1. 15.6 Ex1 -- "Instance Counter with Static Member" (Robot)
2. 15.7 Ex1 -- "Instance Counter" (Widget)
3. 15.x Ex1 -- "Instance Counter with Destructor" (Tracked)

Recommendation: Keep one (preferably the most complete version from 15.7 Ex2 "Widget Factory Counter" which adds `s_created` vs `s_alive` distinction), and replace the other two with exercises that test different concepts.

### Forward Reference Summary

The most pervasive forward reference is `std::vector`, used in **8 exercises**. This is the single biggest issue in the chapter. Most of these exercises could be rewritten to use:
- Fixed-size C-style arrays (if small, known count)
- Scope-based object lifetime (creating objects in nested `{}` blocks)
- Simple loops without storage
- `std::optional` (covered in Ch 12.15) for single-object optional ownership

The `new`/`delete` forward reference appears in **4 exercises** and is harder to avoid when teaching destructors/RAII, though the destructor lesson could demonstrate RAII with file handles (`std::fstream`, already available) or simply with print-on-destruct patterns.

The `operator+`/`operator==`/`operator!=` forward references in lesson 15.8 could be fixed by restricting friend exercises to `operator<<` (allowed per Ch 13 preview) and regular friend functions (not operators).
