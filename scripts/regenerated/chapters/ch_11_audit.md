# Chapter 11 Audit: Function Overloading and Function Templates

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03

---

## Lesson 11.1 — Introduction to function overloading

### Summary

- **Forward reference (minor):** The promotion hierarchy lists `int -> double` as "Promotion." This is incorrect. `int` to `double` is a *standard conversion*, not a promotion. Promotions are: `bool/char/short -> int` and `float -> double`. The lesson's own example in 11.2 and 11.3 gets this right, but 11.1's summary bullet misstates it.
- **Forward reference issue:** `square("hi")` passes a string literal (`const char*`), not a `std::string`. The `std::string` overload would be selected via an implicit *user-defined conversion* (the `std::string(const char*)` constructor), not an exact match. This is technically correct behavior but misleading in a lesson that has not yet explained user-defined conversions. More importantly, it subtly references the `std::string` constructor conversion mechanism which is a user-defined conversion (Ch 14 territory for the concept of constructors as converters). Acceptable at this level but worth noting.
- **Factual error:** "Default arguments (covered in Chapter 9)" — default arguments are not covered in Chapter 9. Looking at the prior_lesson_titles, Ch 9 covers testing, error handling, assertions. Default arguments are covered later in this chapter (11.5). This is a factual error in the cross-reference.
- **Forward reference (OK):** Mentions "function templates (coming next in this chapter)" — this is a valid forward-reference within the chapter.
- No references/pointers, classes/structs, arrays/vectors, operator overloading, or inheritance. PASS on those checks.

### Exercise 1: "Overloaded describe() for int, double, and string"

- **Code quality:** Solution compiles. Starter code is well-structured. The `std::string` overload takes by value rather than `const std::string&` — acceptable for a first exercise but slightly sub-optimal practice.
- **Test cases:** 3 cases. Cover positive, negative, zero, rounding, single-char strings. Adequate coverage.
- **Forward references:** Uses `std::string` (covered in Ch 5). PASS.
- **Verdict:** PASS

### Exercise 2: "Overloaded clamp() Applied to a Mixed List"

- **Code quality:** Solution compiles. Clean, straightforward. Tag-based dispatch is appropriate.
- **Test cases:** 3 cases. Cover boundary values, N=1 edge case, mixed types, values far outside range. Good coverage.
- **Forward references:** None. PASS.
- **Potential issue:** The solution includes `#include <string>` but never uses `std::string`. Harmless but unnecessary.
- **Verdict:** PASS

---

## Lesson 11.2 — Function overload differentiation

### Summary

- **Forward reference issue:** Mentions `f(int&)` vs `f(const int&)` with references. References are Ch 12 material. The bullet says "(for references) whether parameters are const-qualified" — while this is factually correct, it introduces reference syntax that students have not seen yet. This is a MINOR forward reference violation.
- **Forward reference (OK):** "function templates (coming next in this chapter)" — valid intra-chapter forward look.
- **Factual accuracy:** The `show(42L)` example claims `long -> ambiguous! neither int nor double wins`. This is correct — `long` to `int` and `long` to `double` are both standard conversions, creating ambiguity. PASS.
- **Content quality:** Good. Builds on 11.1 without redundancy.

### Exercises

- No exercises for this lesson. Acceptable for a shorter conceptual lesson.
- **Verdict:** PASS (no exercises to audit)

---

## Lesson 11.3 — Function overload resolution and ambiguous matches

### Summary

- **Factual error:** The summary states "float->int and float->double are both standard conversions" for why `display(3.14f)` is ambiguous. This is INCORRECT. `float` to `double` is a *promotion* (not a standard conversion). `float` to `int` is a standard conversion. Since promotion ranks higher than standard conversion, `display(3.14f)` should resolve to the `double` overload without ambiguity. The compiler would select `display(double)` via float-to-double promotion. **This is a significant factual error.**
- **Forward reference:** Mentions `nullptr` "(covered in earlier chapters)" — `nullptr` is not in the prior_lesson_titles list. It is typically covered alongside pointers (Ch 12). **Forward reference violation** if nullptr hasn't been taught. However, it's only mentioned in passing as advice, not used in code. MINOR.
- **Forward reference (OK):** References earlier lessons within Ch 11 correctly.
- **Content quality:** The three-stage simplification (exact match, promotion, standard conversion) is a reasonable pedagogical simplification.

### Exercise 1: "Trace Overload Resolution Stages"

- **Code quality:** Solution compiles. Clean design.
- **Factual concern:** The exercise correctly demonstrates that `short` and `char` promote to `int` (not `long long`). This is accurate.
- **Test case issue:** The sample test expects `int overload: 65` for tag `c 65`. The value 65 is the ASCII code for 'A'. When cast to `char` and then promoted to `int`, the overload prints `65`. This is correct. However, note that the `setprecision(2)` is applied globally in `main()` via `std::cout << std::fixed << std::setprecision(2)`, which means the `int` overload output will NOT be affected (integers don't use fixed/setprecision). BUT the double overload uses `std::cout` which already has `std::fixed` set. The solution's `describe(double)` prints the double value which will be formatted with 2 decimal places. Sample expects `double overload: 3.14` — with `std::fixed` and `setprecision(2)`, `3.14` would print as `3.14`. PASS.
- **Requirement contradiction:** Requirement 6 says "Do not use static_cast at the call sites for i and d" but the solution uses `static_cast<short>` and `static_cast<char>` for tags `s` and `c`, which is expected and correct for those tags. PASS.
- **Verdict:** PASS (exercises are fine; the summary has the factual error noted above)

### Exercise 2: "Safe Numeric Printer with Cast-to-Resolve Ambiguity"

- **Code quality:** Solution compiles. Well-structured.
- **Factual concern about the premise:** The prompt states that passing `float` to `print_value(int)` / `print_value(double)` is ambiguous. As noted in the summary error above, `float` to `double` is a promotion and would be preferred over `float` to `int` (a standard conversion). The exercise's premise of needing a cast to resolve `float` ambiguity is **factually wrong** — the compiler would select `print_value(double)` via promotion. The exercise still works mechanically (the cast is harmless), but the pedagogical rationale is incorrect.
- **Factual concern about UINT:** The prompt states that `unsigned int` to `int` or `double` are "both standard conversions." `unsigned int` to `int` is indeed a standard conversion (potentially narrowing). `unsigned int` to `double` is also a standard conversion. These ARE the same rank, so ambiguity is correct here. PASS on this specific point.
- **Test cases:** 3 cases. Good coverage including edge values.
- **Verdict:** PASS mechanically, but the `FLT` rationale is factually incorrect (see above)

---

## Lesson 11.4 — Deleting functions

### Summary

- **Factual error (minor):** States "process(3.14) would silently convert 3.14 to 42." The conversion would be `3.14` (double) to `3` (int via truncation), not `42`. The `42` appears to be a copy-paste from the `process(42)` call above. **Factual error — should say "silently convert 3.14 to 3"** (or more precisely, truncate to int).
- **Forward reference:** Mentions "member functions" and "copy and move constructors" under "What Can Be Deleted?" — these are Ch 13/14 concepts. This is a MINOR forward reference as it's presented as an FYI list, not a teaching point.
- **Forward reference:** Mentions "Template specializations" — not yet covered at this point in Ch 11. Templates are introduced in 11.6. This is a MINOR internal forward reference within the chapter.
- **Forward reference (OK):** References `= default` "(seen with constructors)" — constructors are Ch 13/14. Same MINOR category.
- **Content quality:** The key insight about deleted functions still participating in overload resolution is well-explained.

### Exercise 1: "Block Implicit Conversions with Deleted Overloads"

- **Code quality:** Solution compiles. Clean.
- **Design issue:** The exercise is somewhat underwhelming — the deleted overloads are never actually called (they're commented out). The student only ever exercises the `int` path. The exercise demonstrates the concept of writing `= delete` declarations but doesn't let the student observe the compile error. This is a pedagogical weakness but understandable given the Judge0 execution model.
- **Test cases:** 3 cases. All only exercise the `int` path. Adequate for what the exercise actually tests.
- **Verdict:** PASS (but pedagogically weak)

### Exercise 2: "Type-Safe Logger with Deleted Overloads and Overloaded Templates"

- **Title issue:** The title says "Overloaded Templates" but the exercise uses overloaded *functions* (not templates). No templates are involved. The title is misleading.
- **Code quality:** Solution compiles. Clean. Uses `const std::string&` parameter (good practice).
- **Forward reference:** Uses `const std::string&` (reference syntax). References are Ch 12. **Forward reference violation.** However, `const std::string&` is idiomatic and students may have seen it in passing. The concern is that students won't understand *why* it's `const std::string&` vs `std::string`.
- **Test cases:** 3 cases. Good coverage including boundary integers and N=1.
- **Verdict:** PASS with notes above

---

## Lesson 11.5 — Default arguments

### Summary

- **Forward reference issue:** The summary says "Default arguments (covered in Chapter 9)" referencing something from *within the summary itself* — it says "As covered in Introduction to function overloading," which was 11.1. But 11.1 said default arguments were "covered in Chapter 9" which is wrong (see 11.1 audit). The 11.5 lesson itself is where default arguments are actually taught. Internally consistent here.
- **Forward reference:** Mentions "constructors or conversion operators" under `= delete` discussion. Constructors/conversion operators are Ch 13/14+. MINOR forward reference.
- **Code quality in example:** Uses `std::format` which requires C++20. Acceptable for this course.
- **Factual accuracy:** Rules about rightmost defaults, single-declaration constraint — all correct.
- **Content quality:** Good. Clear examples and rules.

### Exercise 1: "Format a Receipt Line with Default Arguments"

- **Code quality:** Solution compiles. Uses `std::format` (C++20). Clean.
- **Potential issue:** The `em dash` character `—` in the output format is a Unicode character (U+2014). This could cause encoding issues in some Judge0 configurations. If the Judge0 environment doesn't handle UTF-8 properly, test cases will fail. Worth verifying.
- **Test cases:** 3 cases. Cover 2-arg, 3-arg, 4-arg calls; non-dollar symbols; discount calculations.
- **Test case concern:** The hidden test uses `€` and `£` symbols — these are multi-byte UTF-8 characters. If the test environment doesn't support UTF-8, this will fail.
- **Verdict:** PASS (with UTF-8 caveat)

### Exercise 2: "Overloaded Shape Area with Default Rounding"

- **Code quality:** Solution compiles. Uses `std::format`, `std::round`, `static_cast<int>`. Clean.
- **Potential overload ambiguity issue:** `describeArea(double radius, bool rounded = false)` and `describeArea(double width, double height, bool rounded = false)` — these are distinguishable by parameter count (2 vs 3, or 1 vs 2 without defaults). However, calling `describeArea(5.0)` is unambiguous (only the circle version matches with 1 required arg). Calling `describeArea(5.0, true)` COULD be ambiguous: it matches the circle version as `(radius=5.0, rounded=true)` AND the rectangle version as `(width=5.0, height=???)` — no, the rectangle requires at least 2 doubles before the optional bool. `describeArea(5.0, true)` matches circle(double, bool) with 2 args. For rectangle, it would need `(double, double, bool)` — `true` converting to `double` for `height` is possible but that would be 2 args vs 3 required-minimum. Actually the rectangle overload needs at minimum `width` and `height`, so `describeArea(5.0, true)` with 2 args cannot match the rectangle. PASS — no ambiguity.
- **Test cases:** 3 cases. Cover mixed shapes, rounding on/off, small values. Good coverage.
- **Verdict:** PASS

---

## Lesson 11.6 — Function templates

### Summary

- **Internal ordering:** This is the first lesson on templates in Ch 11. Lessons 11.1-11.5 covered overloading. Templates start here. No internal forward reference issues.
- **Forward reference:** Mentions "C++20 concepts (a later topic)" — this is fine as a forward look.
- **Forward reference:** Uses `auto` in structured bindings context within examples — `auto` type deduction was covered in Ch 10 (10.8, 10.9). PASS.
- **Factual accuracy:** Template argument deduction rules, instantiation behavior, relationship to overloads — all correct.
- **Code quality in example:** Uses `std::format` and `std::println`. Clean.

### Exercise 1: "Clamp a Value Between Two Bounds"

- **Code quality:** Solution compiles. Clean template implementation.
- **Redundancy note:** This is the THIRD clamp exercise in Chapter 11 (after 11.1 Exercise 2 and this one). The repetition is intentional — progressing from overloaded clamp to template clamp — but could feel repetitive to students.
- **Test cases:** 3 cases. Cover below range (int), within range (double), above range (char). Good type diversity.
- **Verdict:** PASS

### Exercise 2: "Overloaded Print and a Generic Swap"

- **Code quality:** Solution compiles. The `swapValues` template uses pass-by-reference (`T&`). References are Ch 12 material. **Forward reference violation.** The exercise *requires* pass-by-reference to swap values in place, which is core to the exercise design. This is a significant forward reference issue — students haven't learned about references yet.
- **Test cases:** 3 cases. Cover basic swap, identical values, negative doubles. Good coverage.
- **Output concern:** For doubles, `std::format("{}", 9.2)` may produce `9.2` or `9.199999999999999` depending on implementation. The expected output assumes `9.2`. With `std::format`, the default precision for floating-point should produce the shortest representation that round-trips, so `9.2` is likely correct. PASS.
- **Output concern:** For `3.0` swapped with `3.0`, expected output is `Swapped: 3 3`. `std::format("{}", 3.0)` would produce `3` (shortest round-trip representation in C++20). Correct.
- **Verdict:** FAIL on forward reference (references/pass-by-reference required but not yet taught)

---

## Lesson 11.7 — Function template instantiation

### Summary

- **Factual accuracy:** Implicit vs explicit instantiation, type deduction rules, code bloat trade-off — all correct and well-explained.
- **Forward reference (OK):** References earlier Ch 11 lessons correctly.
- **No prohibited forward references detected.** PASS.

### Exercise 1: "Clamp Any Numeric Type with a Function Template"

- **Code quality:** Solution compiles. Clean.
- **Redundancy:** This is the FOURTH clamp exercise in the chapter (11.1-Ex2, 11.6-Ex1, 11.7-Ex1). The progression is: overloaded clamp -> template clamp -> template instantiation clamp. While the pedagogical angle differs each time (overloading, then templates, then instantiation), the actual code is nearly identical. **Excessive repetition.** Students may disengage.
- **Test cases:** 3 cases. Cover below/above range, within range, boundary with negative. Adequate.
- **Verdict:** PASS (but repetition concern)

### Exercise 2: "Overload vs Template: Absolute Maximum Finder"

- **Code quality:** Solution compiles. Interesting design that demonstrates template vs non-template resolution.
- **Ordering concern:** The solution carefully orders operations so that the `[overload called]` print appears between the template results and the overload result. The solution calls `absMax<int>(a,b)` and `absMax(c,d)` first, prints their results, THEN calls `absMax(e,f)` which triggers the overload's `[overload called]` print. This is a subtle ordering dependency that the starter code doesn't make obvious. Students might call all three first and store results, causing `[overload called]` to print before the template lines. **The starter code's TODO comments don't clearly communicate this ordering requirement.**
- **Factual accuracy:** `absMax<int>(a,b)` forces template instantiation even though a non-template overload exists. This is correct — explicit template arguments bypass non-template overloads. Good teaching point.
- **Test cases:** 3 cases. Cover mixed signs, both negative with zero, first-dominates. The tie-goes-to-first rule is tested implicitly (6,6 case). Good.
- **Verdict:** PASS (with ordering clarity concern)

---

## Lesson 11.8 — Function templates with multiple template types

### Summary

- **Forward reference:** Uses structured bindings `auto [a, b, c] = std::tuple{...}` in the example. Structured bindings are a C++17 feature that hasn't been explicitly taught in prior lessons. While `auto` was covered in Ch 10, structured bindings are a distinct feature. MINOR forward reference.
- **Forward reference:** Mentions "abbreviated function templates (C++20)" with `auto` parameters. This is appropriate as a forward look since it's introduced as a shorthand for what was just taught.
- **Factual accuracy:** Multiple template parameters, auto return type deduction, abbreviated function templates — all correct.
- **Content quality:** Good progression from single to multiple type parameters.

### Exercise 1: "Compare and Label Two Mixed-Type Values"

- **Code quality:** Solution compiles. Clean. Simple and focused.
- **Floating-point comparison concern:** The exercise uses `>` to compare mixed types (int vs double). Due to floating-point representation, `5 vs 5.0` might not behave as expected in edge cases, but for the test values given it's fine.
- **Test case concern:** Hidden test expects `5 vs 5: equal` for input `5 5.0`. When `5.0` is read as double and printed via `std::cout << 5.0`, the output is `5` (not `5.0`). This depends on the default stream formatting. With default `std::cout`, `5.0` prints as `5`. PASS.
- **Test case concern:** Hidden test expects `0 vs 0: equal` for input `0 0`. The second value `0` is read as `int`, so this calls `compareValues(double, int)` where `double` is `0.0` and `int` is `0`. Output: `0 vs 0: equal`. The first `0` is a double printed as `0`. Correct.
- **Verdict:** PASS

### Exercise 2: "Overloaded Scale and Mixed-Type Scale with Templates"

- **Code quality:** Solution compiles.
- **Potential ambiguity issue:** Both `template<typename T> auto scale(T, T)` and `template<typename T, typename U> auto scale(T, U)` exist. When called with `scale(int, int)`, both templates are viable — the single-type version deduces `T=int`, and the two-type version deduces `T=int, U=int`. The single-type version is MORE specialized (a partial ordering rule), so the compiler should prefer it. This is correct C++ behavior but subtle. PASS.
- **Test case concern:** Hidden test expects `scale(3, 2) = 6` for `M 3.0 2`. Input `3.0` is read as `double`, factor `2` as `int`. `scale(3.0, 2)` returns `double(6.0)`. `std::cout << 6.0` with default formatting prints `6`. Expected is `6`. PASS.
- **Test cases:** 3 cases. Cover same-type, mixed-type, N=1, whole-number double results. Good.
- **Verdict:** PASS

---

## Lesson 11.9 — Non-type template parameters

### Summary

- **Forward reference:** Uses `std::array` in examples. `std::array` is typically covered in Ch 16/17 (arrays/vectors). The prior_lesson_titles do NOT include any array/vector lesson. **Forward reference violation.** The entire lesson's examples and exercises rely on `std::array`, which students haven't been taught yet. This is a SIGNIFICANT forward reference issue.
- **Forward reference:** Mentions `concepts` as a constraint — acceptable as a brief forward look.
- **Forward reference:** Uses range-based for loop (`for (const auto& val : arr)`) — this uses a reference (`const auto&`). References are Ch 12. MINOR.
- **Factual accuracy:** Non-type template parameter rules, allowed value categories, relationship to overloading — all correct.
- **Content quality:** Good explanation of the concept, but the reliance on `std::array` is problematic given the curriculum ordering.

### Exercise 1: "Compile-Time Array Statistics with Non-Type Template Parameter"

- **Forward reference:** Entire exercise depends on `std::array<int, N>`. Students have not been taught `std::array`. **FAIL on forward reference.**
- **Forward reference:** Uses `const std::array<int, N>&` — reference syntax (Ch 12). **FAIL.**
- **Forward reference:** Uses range-based for loop with `const auto&` — reference syntax. **FAIL.**
- **Code quality:** Solution compiles. The switch-based dispatch from runtime N to compile-time N is clever but complex for this level.
- **Test cases:** 3 cases. Cover mixed values, single element, all negative. Good.
- **Verdict:** FAIL (multiple forward references: std::array, references)

### Exercise 2: "Overloaded Printers Using Non-Type Template Parameters"

- **Forward reference:** Same as Exercise 1 — relies entirely on `std::array` and reference syntax. **FAIL.**
- **Code quality:** Solution compiles. Complex dispatch pattern.
- **Test cases:** 3 cases. Cover repeated mode, reversed with single element, reversed with identical values. Good.
- **Verdict:** FAIL (same forward reference issues as Exercise 1)

---

## Lesson 11.10 — Using function templates in multiple files

### Summary

- **Forward reference:** Example uses `std::concepts` (`std::floating_point`). Concepts are not covered in Ch 0-11. MINOR forward reference (presented as FYI).
- **Forward reference:** Example uses `const auto&` parameter — reference syntax (Ch 12). MINOR.
- **Factual accuracy:** Template definitions in headers, ODR exception for template instantiations, `extern template` — all correct.
- **Content quality:** Good practical advice. Clear explanation of why splitting templates across .cpp files fails.

### Exercise 1: "Header-Only Template: Clamp a Value"

- **Code quality:** Solution compiles. Clean.
- **Redundancy:** This is the FIFTH clamp exercise in the chapter (11.1-Ex2, 11.6-Ex1, 11.7-Ex1, 11.10-Ex1). Different pedagogical angle (header-only), but the function body is identical every time. **Severe repetition problem.**
- **Test cases:** 3 cases. Cover outside-range clamping, boundary equality, within-range. Adequate.
- **Verdict:** PASS (but excessive clamp repetition across chapter)

### Exercise 2: "Header-Only Template with Overload: Describe and Scale"

- **Code quality:** Solution compiles. Clean. Good combination of template + overloaded functions.
- **Test cases:** 3 cases. Cover positive/negative results, zero results, mixed. Good.
- **Verdict:** PASS

---

## Lesson 11.x — Chapter 11 summary and quiz

### Summary

- **Forward reference:** The summary example uses `auto clamp(T value, U lo, U hi) -> decltype(value + lo)` with trailing return type and `decltype`. `decltype` has not been explicitly taught in prior chapters (it's not in the prior_lesson_titles). MINOR forward reference.
- **Content quality:** Comprehensive summary that ties together all chapter topics. Well-organized.
- **Factual accuracy:** Summary statements are accurate.

### Exercise 1: "Overloaded describe() for int, double, and bool"

- **Code quality:** Solution compiles. Uses `std::boolalpha`. Clean.
- **Note:** This is similar to 11.1-Exercise 1 (describe for int/double/string) but swaps string for bool. Acceptable for a quiz exercise that tests recall.
- **Test cases:** 3 cases. Cover positive/negative, zero double, both bool values. Good.
- **Verdict:** PASS

### Exercise 2: "Template minOfThree with a Deleted char Overload"

- **Code quality:** Solution compiles. Good combination of template + deleted overload.
- **Factual concern:** The deleted overload `char minOfThree(char, char, char) = delete;` is a non-template function. When `minOfThree('a', 'b', 'c')` is called, the non-template deleted overload is preferred over the template instantiation `minOfThree<char>`. This is correct behavior — the exercise's design is sound.
- **Test cases:** 3 cases. Cover middle minimum, negative minimum, all-equal. Good.
- **Verdict:** PASS

---

## Cross-Cutting Findings

### 1. Forward Reference Violations (by severity)

| Severity | Lesson | Issue |
|----------|--------|-------|
| **HIGH** | 11.9 (both exercises) | `std::array` not taught until Ch 16/17; entire lesson depends on it |
| **HIGH** | 11.6-Ex2 | `swapValues(T& a, T& b)` requires pass-by-reference (Ch 12) |
| **MEDIUM** | 11.9 summary + exercises | `const std::array<int, N>&` uses reference syntax (Ch 12) |
| **MEDIUM** | 11.4-Ex2 | `logValue(const std::string& s)` uses reference syntax (Ch 12) |
| **LOW** | 11.2 summary | Mentions `f(int&)` vs `f(const int&)` reference qualifiers (Ch 12) |
| **LOW** | 11.3 summary | Mentions `nullptr` (likely Ch 12) |
| **LOW** | 11.4 summary | Mentions member functions, copy/move constructors (Ch 13/14) |
| **LOW** | 11.8 summary | Uses structured bindings (not explicitly taught) |
| **LOW** | 11.x summary | Uses `decltype` (not explicitly taught) |

### 2. Factual Errors

| Severity | Lesson | Error |
|----------|--------|-------|
| **HIGH** | 11.1 summary | Lists `int -> double` as a "Promotion" — it is a standard conversion. Promotions are small-to-int and float-to-double only. |
| **HIGH** | 11.3 summary | Claims `float -> int` and `float -> double` are "both standard conversions" making `display(3.14f)` ambiguous. In fact, `float -> double` is a promotion (rank 2) and `float -> int` is a standard conversion (rank 3), so the double overload wins unambiguously. |
| **HIGH** | 11.3-Ex2 | Exercise premise claims `float` is ambiguous between `int` and `double` overloads. Same error as above — `float` promotes to `double`. |
| **MEDIUM** | 11.4 summary | Says `process(3.14)` would convert to `42` — should say it would convert to `3` (truncation). |
| **LOW** | 11.1 summary | Says "Default arguments (covered in Chapter 9)" — default arguments are covered in 11.5, not Ch 9. |

### 3. Exercise Progression

The overall progression is logical:
1. 11.1: Basic overloading (write overloads)
2. 11.2: Differentiation rules (no exercises — conceptual)
3. 11.3: Resolution + ambiguity (trace resolution, use casts)
4. 11.4: Deleted functions (block types, combine with overloads)
5. 11.5: Default arguments (default params, combine with overloads)
6. 11.6: Templates intro (write template, combine with overloads)
7. 11.7: Instantiation (observe instantiation, template vs overload preference)
8. 11.8: Multiple type params (mixed-type templates)
9. 11.9: Non-type params (compile-time values)
10. 11.10: Multi-file templates (header-only)
11. 11.x: Summary quiz (combines overloading + templates + delete)

**Repetition problem:** The `clamp` function appears in FIVE exercises (11.1-Ex2, 11.6-Ex1, 11.7-Ex1, 11.10-Ex1, and a variant in 11.9-Ex1 as `arrayMax`). While each has a different pedagogical angle, the function body is essentially identical. Recommend replacing at least 2-3 of these with different algorithms (e.g., `abs`, `sign`, `isInRange`, `countIf`).

### 4. Code Quality Summary

- All solutions compile (assuming C++20/23 with `<print>` and `<format>` support).
- `std::println` and `std::print` are C++23 features — ensure Judge0 supports them. Several exercises use `<print>` header.
- UTF-8 characters (em dash `—`, `€`, `£`) in 11.5-Ex1 test cases may cause issues in some environments.
- No memory safety issues, no undefined behavior in solutions.
- All test case expected outputs match solution behavior upon manual trace.

### 5. Test Case Coverage

Most exercises have 3 test cases (1 sample, 2 hidden). Coverage is generally good, including:
- Boundary values
- Negative numbers
- Zero values
- N=1 edge cases
- Mixed type dispatching

**Missing coverage:**
- No exercise tests what happens with very large numbers (overflow).
- No exercise tests empty input or malformed input (acceptable for this course level).

---

## Recommendations

1. **Fix the float promotion error** in 11.3 summary and 11.3-Ex2. `float -> double` is a promotion, not a standard conversion. Either fix the explanation or change the example to use `long` (which genuinely IS ambiguous between `int` and `double`).
2. **Fix the "Chapter 9" cross-reference** in 11.1 summary — default arguments are 11.5, not Ch 9.
3. **Fix "42" typo** in 11.4 summary — `process(3.14)` truncates to `3`, not `42`.
4. **Redesign lesson 11.9** to avoid `std::array` dependency. Use simpler non-type template examples that don't require arrays (e.g., `template<int N> int multiply(int x) { return x * N; }` or `template<int Exp> double power(double base)`).
5. **Replace 2-3 clamp exercises** with different algorithms to reduce repetition.
6. **Remove or rework 11.6-Ex2** to avoid requiring pass-by-reference. Alternatively, swap could return a pair/tuple instead (though that introduces its own forward references). Or replace with a non-swap exercise.
7. **Remove reference syntax** from 11.4-Ex2 (`const std::string&` -> `std::string` by value). Minor performance cost but avoids forward reference.
