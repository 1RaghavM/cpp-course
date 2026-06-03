# Chapter F Fixes Applied

**Date:** 2026-06-03
**Source audit:** `scripts/regenerated/chapters/ch_f_audit.md`

---

## F.1 Summary Fixes

### 1. Fixed "explicit instantiation" claim (MEDIUM)
- **Before:** "templates, which generate code at compile-time but require explicit instantiation"
- **After:** "templates, which generate different code for different types at compile-time. In contrast, a constexpr function is a single piece of code that can be evaluated at compile-time or runtime depending on context."
- **Why:** Function templates are implicitly instantiated at the call site. "Explicit instantiation" is a separate advanced feature and the original phrasing was misleading.

### 2. Fixed "cannot allocate dynamic memory" claim (LOW)
- **Before:** "Notably, you cannot use I/O, allocate dynamic memory, or modify global state."
- **After:** "Notably, you cannot use I/O or modify global state. (C++20 does allow dynamic memory allocation within a constexpr evaluation, as long as all allocated memory is deallocated before the evaluation completes.)"
- **Why:** C++20 permits transient dynamic memory allocation in constexpr contexts. Since the platform targets C++20 (consteval is taught), the blanket prohibition was inaccurate.

---

## F.1 Exercise Fixes

### 3. Added n=0 test case to Digit Sum (Exercise F.1.2) (LOW)
- **Added:** Hidden test case with `stdin: "0"`, `expected_stdout: "0\n30\n"`
- **Why:** Edge case for `digitSum(0)` was untested. A naive `while (n > 0)` loop returns 0 correctly, but the test case ensures this behavior is verified.

### 4. Added std::abs hint to Digit Sum prompt (LOW)
- **Added to prompt:** "Note: `std::abs` is not guaranteed to be `constexpr` in C++20, so handle the absolute value manually (e.g., `if (n < 0) n = -n;`)."
- **Added to constraints:** "`digitSum(0)` should return `0`"
- **Why:** Students might try `std::abs` and get a compile error in constexpr context. The hint steers them toward the manual approach.

---

## F.2 Summary Fixes

### 5. Replaced std::println with std::cout (HIGH)
- **Before:** `#include <print>` and `std::println("{} {}", compile_time, runtime_result);`
- **After:** `#include <iostream>` and `std::cout << compile_time << ' ' << runtime_result << '\n';`
- **Why:** `std::println` is C++23 (`<print>` header). Students have only used `std::cout`. Consistency with curriculum.

### 6. Replaced __builtin_sqrt example with safe_abs example (MEDIUM)
- **Before:** `fast_sqrt` using `__builtin_sqrt` (GCC/Clang extension) with a fake `return x` compile-time branch
- **After:** `safe_abs` example showing `std::is_constant_evaluated()` branching with a manual absolute value. Both branches use `(n < 0) ? -n : n` with a comment explaining that real-world code would differ.
- **Why:** `__builtin_sqrt` is non-standard. The `return x` placeholder was factually wrong for a square root. The new example is self-contained, standard-compliant, and demonstrates the same concept.

### 7. Replaced "algorithms and containers" with vaguer phrasing (LOW)
- **Before:** "Most standard library algorithms and containers when their implementations are constexpr-qualified"
- **After:** "Many standard library functions, when their implementations are constexpr-qualified"
- **Why:** Students have not encountered algorithms or containers (Ch 16+). The vaguer phrasing avoids setting expectations about unknown concepts.

### 8. Added C++20 note to std::is_constant_evaluated (LOW)
- **Added:** "(C++20, defined in `<type_traits>`)" after mentioning the function.
- **Why:** Helps students know which header to include and that this is a C++20 feature.

### 9. Fixed "compile at constant time" phrasing
- **Before:** "most ordinary function bodies compile at constant time"
- **After:** "most ordinary function bodies work at compile time"
- **Why:** "compile at constant time" is nonsensical; should be "work at compile time."

---

## F.2 Exercise Added (HIGH)

### 10. New exercise: "Constexpr Array Sum with Loops"
- **Concept tested:** Local variables and loops inside constexpr functions (the core new content of F.2)
- **Function:** `sumRange(int start, int end)` -- sum all integers from start to end inclusive
- **Why added:** F.2 had zero exercises despite introducing expanded constexpr body rules (loops, local variables). This exercise directly reinforces those concepts.
- **Test cases:** 4 (small range, single element, inverted range returns 0, negative to positive range)
- **Compile-time check:** `constexpr int compile_result = sumRange(1, 100);` outputs 5050

---

## F.3 Summary Fixes

### 11. Removed "policy-based metaprogramming" jargon (LOW)
- **Before:** "generating lookup tables, compile-time string hashing, policy-based metaprogramming"
- **After:** "generating lookup tables, compile-time configuration values, compile-time factorial tables"
- **Why:** "Policy-based metaprogramming" references advanced template metaprogramming concepts not covered. "Compile-time string hashing" implies advanced string usage in constexpr contexts. Replaced both with simpler, self-explanatory examples.

### 12. Replaced auto parameter with explicit template syntax (LOW)
- **Before:** `consteval auto force_consteval(auto val) { return val; }`
- **After:** `template <typename T>\nconsteval T force_consteval(T val) { return val; }`
- **Why:** The `auto` parameter syntax (abbreviated function templates) is a distinct C++20 feature that may not have been explicitly taught. Explicit template syntax was covered in Ch 11.6 and is clearer.

### 13. Fixed "result may or may not be const" imprecision (LOW)
- **Before:** "constexpr -- may evaluate at compile time or runtime; result may or may not be const."
- **After:** "constexpr -- function may evaluate at compile time or runtime. When applied to a variable, the variable is implicitly const and must be initialized with a constant expression."
- **Why:** The original phrasing was confusing. For constexpr variables, the result IS const. The distinction between constexpr-on-functions vs constexpr-on-variables needed to be explicit.

---

## F.3 Exercise Added (HIGH)

### 14. New exercise: "Consteval Compile-Time Factorial"
- **Concept tested:** Writing a `consteval` function; understanding that runtime values cannot be passed to it
- **Function:** `consteval long long factorial(int n)` with precomputed values selected at runtime via `k`
- **Key pedagogical point:** Students cannot pass `k` directly to `factorial()` -- they must precompute all needed values as constexpr variables and select among them at runtime. This drives home the consteval restriction.
- **Test cases:** 4 (select fact(5), select fact(10), select fact(0), invalid selection)
- **Uses `long long`:** factorial(12) = 479001600 fits in `int`, but `long long` is used to avoid issues if students experiment with larger values.

---

## Summary of All Changes

| # | Severity | Lesson | Type | Description |
|---|----------|--------|------|-------------|
| 1 | MEDIUM | F.1 | Summary | Fixed "explicit instantiation" -> implicit instantiation contrast |
| 2 | LOW | F.1 | Summary | Fixed "cannot allocate dynamic memory" for C++20 |
| 3 | LOW | F.1 | Test case | Added n=0 test to digit sum exercise |
| 4 | LOW | F.1 | Prompt | Added std::abs constexpr hint to digit sum |
| 5 | HIGH | F.2 | Summary | Replaced std::println with std::cout |
| 6 | MEDIUM | F.2 | Summary | Replaced __builtin_sqrt with standard safe_abs example |
| 7 | LOW | F.2 | Summary | Replaced "algorithms and containers" phrasing |
| 8 | LOW | F.2 | Summary | Added C++20 note for is_constant_evaluated |
| 9 | LOW | F.2 | Summary | Fixed "compile at constant time" typo |
| 10 | HIGH | F.2 | Exercise | Added "Constexpr Array Sum with Loops" exercise |
| 11 | LOW | F.3 | Summary | Removed metaprogramming/string hashing jargon |
| 12 | LOW | F.3 | Summary | Replaced auto parameter with explicit template |
| 13 | LOW | F.3 | Summary | Fixed "result may or may not be const" |
| 14 | HIGH | F.3 | Exercise | Added "Consteval Compile-Time Factorial" exercise |
