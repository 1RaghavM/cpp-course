# Chapter 11 Fix Changelog

## Summary of Changes

This document tracks every fix applied to `ch_11.json` based on the audit in `ch_11_audit.md`.

---

## Factual Errors Fixed

### 11.1 Summary: int->double listed as "Promotion"

**Error:** The promotion hierarchy bullet listed `int -> double` as a "Promotion." This is incorrect -- `int` to `double` is a *standard conversion*. Promotions are only: `bool`/`char`/`short` -> `int` and `float` -> `double`.

**Fix:** Rewrote the ranking list to correctly show:
- Promotion: `bool`/`char`/`short` -> `int`, or `float` -> `double`
- Standard conversion: `int` -> `double`, or `double` -> `int`

Changed the ambiguity example from `square(3.0f)` (which is NOT ambiguous -- float promotes to double) to `square(42L)` (which IS genuinely ambiguous -- long->int and long->double are both standard conversions).

### 11.1 Summary: Wrong cross-reference for default arguments

**Error:** Stated "Default arguments (covered in Chapter 9)" -- default arguments are taught in 11.5, not Ch 9. Ch 9 covers testing/error handling.

**Fix:** Changed to "Default arguments (covered later in this chapter)".

### 11.3 Summary: float claimed ambiguous between int/double overloads

**Error:** The summary stated `float->int` and `float->double` are "both standard conversions" making `display(3.14f)` ambiguous. This is wrong. `float->double` is a *promotion* (rank 2); `float->int` is a standard conversion (rank 3). The `double` overload wins unambiguously.

**Fix:** Completely rewrote the example. Now:
- `display(3.14f)` is shown as resolving correctly to the `double` overload via float->double promotion
- `display(42L)` is shown as the ambiguous case (long->int and long->double are both standard conversions)
- Updated the "Common ambiguity traps" list to use `long` and `unsigned int` as examples instead of `float`

### 11.3 Exercise 2: Exercise premise based on float ambiguity error

**Error:** The exercise claimed passing `float` to `int`/`double` overloads is ambiguous and requires a cast. This is factually wrong (float promotes to double).

**Fix:** Replaced the `FLT` tag with `LNG` (long) tag, which IS genuinely ambiguous between `int` and `double` overloads since both require a standard conversion. Updated all starter code, solution code, prompt text, and test cases accordingly.

### 11.4 Summary: Wrong truncation value

**Error:** Stated `process(3.14)` would "silently convert 3.14 to 42." The 42 was a copy-paste from the `process(42)` call above. The actual truncation of 3.14 to int is 3.

**Fix:** Changed to "silently convert `3.14` to `3` (truncating the fractional part)".

---

## Forward Reference Violations Fixed

### 11.2 Summary: Reference syntax `f(int&)` vs `f(const int&)` (Ch 12)

**Error:** The differentiation list included "(for references) whether parameters are const-qualified" with reference syntax students haven't seen.

**Fix:** Removed the reference/const-qualified bullet entirely. Added a bullet about top-level `const` on value parameters being irrelevant (which IS available knowledge and is the more useful point for this lesson).

### 11.4 Summary: Mentions member functions, copy/move constructors, `= default`

**Error:** The "What Can Be Deleted?" section referenced constructors, member functions, and `= default` -- all Ch 13/14 concepts.

**Fix:** Replaced with a shorter, forward-looking note: "You will encounter additional uses (such as preventing copying of objects) in later chapters when classes are introduced." Removed the `= default` comparison section entirely.

### 11.4 Exercise 2: `const std::string&` parameter (Ch 12)

**Error:** `logValue(const std::string& s)` uses pass-by-reference which is Ch 12 material.

**Fix:** Changed to `logValue(std::string s)` (pass by value). Updated the title from "Type-Safe Logger with Deleted Overloads and Overloaded Templates" to "Type-Safe Logger with Deleted Overloads" (the exercise never used templates). Updated all starter code, solution code, and prompt text.

### 11.6 Exercise 2: `swapValues(T& a, T& b)` requires pass-by-reference (Ch 12)

**Error:** The entire exercise was built around a generic swap function that fundamentally requires pass-by-reference to modify the caller's variables. Students have not learned references.

**Fix:** Replaced the entire exercise with "Generic Larger-Of-Two with Overload Preference" which:
- Tests the same lesson concepts (function template + non-template overload interaction)
- Uses only pass-by-value (no references)
- Demonstrates that non-template overloads are preferred over template instantiations for exact matches
- Uses `int`, `double`, and `char` types
- No forward references to any later chapter

### 11.8 Summary: Structured bindings

**Error:** Used `auto [a, b, c] = std::tuple{...}` which is a C++17 feature not explicitly taught.

**Fix:** Replaced the structured binding with three separate `std::format` arguments in a single call, removing the tuple/structured binding entirely.

### 11.9: Entire lesson depends on `std::array` (Ch 17) and `const auto&` (Ch 12)

**Error:** Both the summary and both exercises were built around `std::array<T, N>`, which is Ch 16/17 material. The exercises also used `const std::array<int, N>&` (references, Ch 12) and `const auto&` in range-based for loops.

**Fix:**
- **Summary:** Completely rewritten to use `template <int N> int multiplyBy(int x)` and `template <int Exp> double power(double base)` as primary examples. No arrays, no references. The concepts (non-type parameters as compile-time values, separate instantiations per value, default non-type parameter values) are all preserved.
- **Exercise 1 (was "Compile-Time Array Statistics"):** Replaced with "Compile-Time Multiplier with Non-Type Template Parameter" -- uses `template <int N> int multiplyBy(int x)` to demonstrate N producing separate instantiations. No arrays, no references.
- **Exercise 2 (was "Overloaded Printers Using Non-Type Template Parameters"):** Replaced with "Compile-Time Power Function with Non-Type Exponent" -- uses `template <int Exp> double power(double base)` and `template <int N> void repeat(char ch)`. Demonstrates two different non-type template functions. No arrays, no references.

---

## Redundancy Fixes (Clamp Exercises)

### Problem

The `clamp` function appeared in 5 exercises across the chapter:
1. 11.1-Ex2: Overloaded clamp (int + double overloads)
2. 11.6-Ex1: Template clamp (single template)
3. 11.7-Ex1: Template clamp instantiation (nearly identical to 11.6-Ex1)
4. 11.10-Ex1: Header-only template clamp (identical body)
5. 11.9-Ex1: `arrayMax` variant (different name, similar concept)

### Fix

Kept the first two as they have distinct pedagogical angles (overloading vs templates):
- 11.1-Ex2: Kept (overloaded clamp -- demonstrates why you need overloads)
- 11.6-Ex1: Kept (template clamp -- shows template replacing overloads)

Replaced the other three:
- **11.7-Ex1:** Replaced with "Absolute Value Template with Explicit Instantiation" -- demonstrates implicit vs explicit instantiation syntax using `absVal`, which is the core lesson topic
- **11.10-Ex1:** Replaced with "Header-Only Template: Sign of a Value" -- uses a `sign` function (returns -1, 0, or 1) to demonstrate the header-only pattern, which is the core lesson topic
- **11.9-Ex1:** Already replaced (see forward reference fix above)

---

## 11.x Summary: decltype and trailing return type

**Error:** Used `auto clamp(T value, U lo, U hi) -> decltype(value + lo)` with trailing return type and `decltype`, neither of which has been taught.

**Fix:** Simplified to a standard `template <typename T> T clamp(T value, T lo, T hi)` with regular return type. No `decltype`, no trailing return type, no multi-type template in the summary example.

---

## Items NOT Changed (Accepted as-is)

- **11.1-Ex1:** `std::string` passed by value (slightly sub-optimal but correct and avoids Ch 12 references). KEPT.
- **11.3-Ex1:** Trace Overload Resolution exercise. Factually correct. KEPT.
- **11.5:** Both exercises. No forward reference issues. KEPT.
- **11.7-Ex2:** Overload vs Template: Absolute Maximum Finder. Factually correct and good pedagogical exercise. KEPT.
- **11.8:** Both exercises. PASS. KEPT.
- **11.10-Ex2:** Header-Only Template with Overload: Describe and Scale. PASS. KEPT.
- **11.x-Ex1:** Overloaded describe() for int, double, and bool. PASS. KEPT.
- **11.x-Ex2:** Template minOfThree with deleted char overload. PASS. KEPT.
- **UTF-8 characters** in 11.5-Ex1 test cases (em dash, euro sign, pound sign). Noted as a potential environment issue but not changed as it's outside the scope of content correctness.
- **Minor forward references** in summaries that are presented as FYI/forward looks (e.g., "C++20 concepts (a later topic)") are acceptable pedagogical practice and were not removed.
