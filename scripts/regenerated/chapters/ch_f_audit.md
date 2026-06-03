# Chapter F Audit: Constexpr Functions

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Lessons audited:** 3 (F.1, F.2, F.3)
**Exercises audited:** 2 (both in F.1)

---

## Lesson F.1: Constexpr Functions

### Summary Audit

**Forward references:** NONE FOUND. The summary sticks to fundamental types, basic arithmetic, control flow, and constexpr variables (Ch 5). No mention of references, pointers, classes, arrays, or inheritance. PASS.

**Factual accuracy:**

1. **ISSUE (Minor inaccuracy):** The summary says constexpr functions differ from templates because templates "require explicit instantiation." This is misleading. Function templates are instantiated *implicitly* at the call site in most cases (covered in Ch 11.7 "Function template instantiation"). Explicit instantiation is a separate, advanced feature. The intended contrast (constexpr = same function evaluated at compile-time vs runtime; templates = code generation) is valid, but the phrasing is wrong.
   - **Recommendation:** Change to something like "templates generate different code for different types at compile-time, while constexpr functions evaluate the *same* code at compile-time or runtime depending on context."

2. **ISSUE (Slightly misleading):** "you cannot... allocate dynamic memory" -- This was true before C++20 but constexpr functions CAN allocate dynamic memory in C++20 as long as it is deallocated within the same constant evaluation. Since the platform targets C++20 (consteval is mentioned), this is a minor inaccuracy.
   - **Recommendation:** Either clarify "you cannot allocate dynamic memory that persists beyond the evaluation" or simply omit this detail to avoid confusion at this level.

3. **ISSUE (Missing `constexpr` on recursive function):** The fibonacci example is technically correct for C++14+ (which relaxed constexpr rules). However, a note that C++11 constexpr only allowed a single return statement would add historical context. Not required but helpful.

**Scope creep:** NONE. Content is tightly focused on constexpr basics.

**Quality:** Good introduction. Clear dual-mode (compile-time/runtime) explanation. The fibonacci example is simple and effective.

### Exercise F.1.1: Power Function with Constexpr

**Forward references:** NONE. Uses only `int`, arithmetic, control flow, `iostream`, `constexpr`. PASS.

**Factual / logic errors:**

1. **PASS.** The exercise correctly tests compile-time (constexpr variable) and runtime (cin input) evaluation of the same function.

**Prompt clarity:** CLEAR. Requirements are well-enumerated. The negative exponent handling (return 0) is explicitly stated.

**Test case audit:**

| Test | stdin | Expected stdout | Verdict |
|------|-------|----------------|---------|
| Sample: Basic powers | `2 5` | `32\n1024\n` | PASS. power(2,5)=32, power(2,10)=1024. |
| Hidden: Zero exponent | `7 0` | `1\n1024\n` | PASS. power(7,0)=1, compile-time=1024. |
| Hidden: Negative exponent | `3 -2` | `0\n1024\n` | PASS. Negative exponent returns 0, compile-time=1024. |

**Starter code audit:**

1. **ISSUE (Minor):** Uses `using namespace std;` which contradicts the project convention of preferring explicit `std::` qualification. However, this is consistent with how learncpp.com teaches beginners and is acceptable for a learning platform.

2. **PASS.** The `constexpr int compile_result = power(2, 10);` line in the starter code is valid and will correctly force compile-time evaluation.

3. **PASS.** Starter code compiles once the student fills in the TODO. Structure is clear.

**Progression:** This is a good first exercise -- straightforward iterative/recursive computation that demonstrates the core constexpr concept.

### Exercise F.1.2: Constexpr Digit Sum Calculator

**Forward references:** NONE. Uses only `int`, arithmetic (`%`, `/`), control flow (loops/conditionals), `iostream`, `constexpr`. PASS.

**Factual / logic errors:**

1. **ISSUE (Test case error -- CRITICAL):** The sample test case expects `digitSum(9876) = 30`. Let's verify: 9+8+7+6 = 30. PASS -- the expected value is correct.

2. **ISSUE (Potential negative-number edge case):** The prompt says "uses their absolute value" for negative numbers. The student needs to handle this, e.g., by negating if `n < 0` or using `n = (n < 0) ? -n : n`. Note: `std::abs` is constexpr in C++23 but NOT guaranteed constexpr in C++20. The student will need a manual absolute value approach, which is fine but could be noted.
   - **Recommendation:** Consider adding a hint in the prompt that `std::abs` may not be constexpr and suggest manual negation.

3. **ISSUE (Edge case: n=0):** The digit sum of 0 should be 0. A naive while loop (`while (n > 0)`) will return 0 for input 0, which is correct. However, there is no test case for `n=0`. 
   - **Recommendation:** Add a test case for `stdin: "0"` with expected output `"0\n30\n"`.

**Test case audit:**

| Test | stdin | Expected stdout | Verdict |
|------|-------|----------------|---------|
| Sample: Positive | `1234` | `10\n30\n` | PASS. 1+2+3+4=10, 9+8+7+6=30. |
| Hidden: Negative input | `-567` | `18\n30\n` | PASS. 5+6+7=18, compile-time=30. |
| Hidden: Single digit | `5` | `5\n30\n` | PASS. Single digit returns itself, compile-time=30. |

**Starter code audit:**

1. Same `using namespace std;` observation as Exercise F.1.1. Acceptable.
2. **PASS.** Structure mirrors Exercise 1, reinforcing the compile-time/runtime duality pattern.

**Progression:** Good second exercise. Slightly more complex logic (loop + modular arithmetic + absolute value handling) builds on the first exercise's foundation.

---

## Lesson F.2: Constexpr Functions (Part 2)

### Summary Audit

**Forward references:**

1. **ISSUE (Minor -- `std::println`):** The example code uses `std::println` which is a C++23 feature (from `<print>`). While not a forward reference to later chapters, this is potentially confusing since:
   - The platform's lessons up to Ch 11 use `std::cout` exclusively
   - Students have NOT been taught `std::println` or `<print>`
   - **Recommendation:** Replace with `std::cout` to stay consistent with what students know.

2. **ISSUE (Scope creep -- "standard library algorithms and containers"):** The bullet point "Most standard library algorithms and containers when their implementations are constexpr-qualified" references concepts (algorithms, containers) the student has not encountered yet (Ch 16+). While technically not a "forward reference" since no specific type is named, it sets expectations about things they don't know.
   - **Recommendation:** Remove or replace with "many standard library functions" without mentioning algorithms/containers specifically.

**Factual accuracy:**

1. **ISSUE (Minor):** The `fast_sqrt` example uses `__builtin_sqrt` which is a compiler extension (GCC/Clang). This is non-standard C++ and may not compile on all platforms. More importantly, the compile-time branch just returns `x` (with a comment "simplified placeholder"), which is factually wrong for a square root. This example is more confusing than helpful.
   - **Recommendation:** Replace with a simpler, self-contained example that doesn't rely on compiler extensions or fake implementations.

2. **ISSUE (Minor):** "`std::is_constant_evaluated()` returns `true` when the call is in a constant-expression context" -- This is correct but `std::is_constant_evaluated()` is C++20. Should be explicitly noted as C++20 since students might try it and get errors depending on their compiler standard setting.

3. **PASS.** The `digit_sum` example is clean and correct. However, note that it doesn't handle negative numbers (the while loop condition `n > 0` returns 0 for negative inputs), which is inconsistent with Exercise F.1.2's requirement to handle negatives. Not an error per se, but a missed opportunity for consistency.

**Scope creep:** The mention of "standard library algorithms and containers" is slight scope creep. Otherwise contained well.

**Quality:** Good content overall. The dual-context explanation is well-phrased. The `std::is_constant_evaluated()` topic is appropriate for Part 2.

### Exercises

**No exercises for F.2.** This lesson has zero exercises.

**ISSUE (Progression gap):** F.2 introduces several important new concepts (`std::is_constant_evaluated()`, expanded constexpr body rules) but has no exercises to reinforce them. At minimum, one exercise could have the student write a constexpr function using loops and local variables (reinforcing the "more than simple arithmetic" point), or use `std::is_constant_evaluated()` for branching behavior.

---

## Lesson F.3: Constexpr Functions (Part 3) and Consteval

### Summary Audit

**Forward references:**

1. **ISSUE (Minor -- `auto` parameter in consteval):** The `force_consteval` example uses `consteval auto force_consteval(auto val)` which uses abbreviated function templates (C++20). While `auto` for type deduction was covered in Ch 10.8 and function templates in Ch 11.6, the `auto` parameter syntax (abbreviated function templates) is a distinct feature that may not have been explicitly taught. However, since Ch 11 covers templates, this is borderline acceptable.
   - **Recommendation:** Either add a brief note that `auto` in a parameter list creates an implicit template, or replace with an explicit template syntax: `template <typename T> consteval T force_consteval(T val) { return val; }`.

2. **PASS.** No references to classes, structs, references, pointers, arrays, or inheritance.

**Factual accuracy:**

1. **ISSUE (Minor imprecision):** "constexpr -- may evaluate at compile time or runtime; result may or may not be const." The phrasing "result may or may not be const" is confusing in this context. For constexpr variables, the result IS const. For constexpr functions, the return value's constness depends on how it's used. This should be clarified.
   - **Recommendation:** Rephrase to: "constexpr -- function may evaluate at compile time or runtime; constexpr variables are implicitly const."

2. **ISSUE (Minor):** The summary says `consteval` functions are "implicitly `inline`" -- this is correct and worth noting. PASS.

3. **ISSUE (Mention of "metaprogramming"):** The phrase "policy-based metaprogramming" in the `consteval` use-case list references advanced template metaprogramming concepts the student hasn't seen. This is unnecessary jargon.
   - **Recommendation:** Remove "policy-based metaprogramming" from the list. "Compile-time string hashing" and "generating lookup tables" are sufficient examples.

4. **ISSUE (Mention of "string hashing"):** "Compile-time string hashing" implies `std::string` or C-style strings in constexpr context, which is advanced. Students know `std::string` (Ch 5.7) but haven't used it in constexpr contexts. This is borderline.
   - **Recommendation:** Replace with a simpler example like "compile-time configuration values" or "compile-time factorial tables."

**Scope creep:** Minor -- the metaprogramming reference. Otherwise well-contained.

**Quality:** Good coverage of consteval. The comparison table (constexpr vs consteval vs constinit) is useful.

### Exercises

**No exercises for F.3.** This lesson has zero exercises.

**ISSUE (Critical progression gap):** The core new concept of this lesson -- `consteval` -- has ZERO exercises. This is a significant gap. Students cannot practice:
- Writing a `consteval` function
- Understanding the compile error when passing runtime values to `consteval`
- Using `consteval` vs `constexpr` in appropriate contexts

**Recommendation:** Add at least one exercise requiring students to write a `consteval` function and observe what happens with runtime vs compile-time arguments.

---

## Cross-Lesson Findings

### Exercise Coverage

| Lesson | Exercises | Verdict |
|--------|-----------|---------|
| F.1 | 2 | Adequate |
| F.2 | 0 | INSUFFICIENT -- new concepts untested |
| F.3 | 0 | INSUFFICIENT -- core concept (consteval) untested |

**Total: 2 exercises for 3 lessons.** This is the weakest exercise coverage of any chapter audited. The chapter introduces three distinct concepts (constexpr functions, expanded constexpr bodies, consteval) but only tests the first.

### Progression Quality

The two F.1 exercises have good internal progression (simple power function -> slightly more complex digit sum). However, the chapter-level progression is broken because F.2 and F.3 have no exercises at all.

### Forward Reference Summary

| Issue | Severity | Location |
|-------|----------|----------|
| `std::println` / `<print>` (C++23, not taught) | Medium | F.2 summary example |
| "algorithms and containers" mention | Low | F.2 summary bullet |
| `auto` parameter (abbreviated template) | Low | F.3 summary example |
| "policy-based metaprogramming" jargon | Low | F.3 summary |
| "compile-time string hashing" | Low | F.3 summary |

**No exercises contain forward references.** All exercise forward-reference checks PASS.

### Factual Error Summary

| Issue | Severity | Location |
|-------|----------|----------|
| Templates "require explicit instantiation" (wrong) | Medium | F.1 summary |
| "cannot allocate dynamic memory" (C++20 allows transient) | Low | F.1 summary |
| `__builtin_sqrt` compiler extension in example | Medium | F.2 summary |
| Fake sqrt implementation (`return x`) | Medium | F.2 summary |
| "result may or may not be const" (imprecise) | Low | F.3 summary |

### Missing Test Cases

| Exercise | Missing Case | Expected |
|----------|-------------|----------|
| F.1.2 Digit Sum | `stdin: "0"` | `"0\n30\n"` |

### Recommended Actions (Priority Order)

1. **HIGH:** Add exercises to F.2 (1-2 exercises on loops/locals in constexpr) and F.3 (1 exercise on consteval)
2. **HIGH:** Replace `std::println` with `std::cout` in F.2 example
3. **MEDIUM:** Fix "explicit instantiation" phrasing in F.1 summary
4. **MEDIUM:** Replace `fast_sqrt` example in F.2 with something that doesn't use compiler extensions
5. **MEDIUM:** Remove "policy-based metaprogramming" jargon from F.3
6. **LOW:** Add n=0 test case to digit sum exercise
7. **LOW:** Note that `std::abs` may not be constexpr in hint for digit sum exercise
8. **LOW:** Clarify C++20 dynamic memory allowance in F.1 or omit the claim
