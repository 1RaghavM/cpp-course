# Chapter 10 Audit: Type Conversion, Type Aliases, and Type Deduction

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Verdict:** Several forward-reference violations, factual inaccuracies, and test-case fragility issues. Details below per lesson.

---

## Lesson 10.1 — Implicit type conversion

### Summary audit

**ISSUE [forward-reference / ordering]: `auto` used before it is taught.**
The summary code example uses `auto c = a / b;` but `auto` is not introduced until lesson 10.8. At this point in the curriculum the student has never seen `auto`. Replace with an explicit type (`double c = a / b;`).

**ISSUE [factual]: Promotion hierarchy is misleading.**
The summary shows: `bool -> int -> long -> long long -> float -> double -> long double`. This conflates the *promotion* hierarchy with the *usual arithmetic conversion* hierarchy. Specifically:
- `int -> long -> long long` are not *promotions*; they are *numeric conversions*. Integral promotion only goes up to `int` (or `unsigned int`). The broader ranking is the "usual arithmetic conversion" ranking, not the "promotion" ranking.
- `float` does not rank higher than `long long` in the promotion sense. The usual arithmetic conversions treat floating-point types as dominating integer types, but calling the entire chain "promotions" is technically wrong. Promotion is specifically: small integral types -> `int`, and `float` -> `double`. The summary should distinguish these more carefully, or at minimum label the hierarchy as "usual arithmetic conversion ranking" rather than "numeric promotion hierarchy."

**ISSUE [factual]: `-Wall -Wextra` claim about narrowing warnings.**
The summary states `-Wall -Wextra` emits "implicit conversion warnings for narrowing." In practice, `-Wconversion` (not included in `-Wall -Wextra`) is needed for most implicit narrowing warnings. `-Wall -Wextra` catches sign-compare and some float truncation, but not the general case. The claim is misleading.

### Exercise 10.1.1 — Integer vs. Floating-Point Division

**PASS [code quality]:** Compiles. Test cases are correct and well-chosen.

**ISSUE [forward-reference]: `auto` used in the exercise prompt.**
The prompt says "Promote 'a' to double before dividing" and the solution uses `static_cast<double>(a)`. The prompt code comment says "promote 'a' to double before dividing" which is fine, but the *summary* code that the student just read used `auto`. Since `auto` is not introduced until 10.8, the student may try to copy the summary pattern. Minor issue but worth noting.

**PASS [test cases]:** All three test cases verified correct. `7/2=3`, `3.500000`, `1`; `10/4=2`, `2.500000`, `2`; `9/3=3`, `3.000000`, `0`. Correct.

### Exercise 10.1.2 — Narrowing and bool Coercion

**ISSUE [solution uses static_cast but prompt says "implicit narrowing"].**
The prompt says: "Store `d` in an `int` variable (implicit narrowing - truncation, not rounding)." But the solution uses `int i = static_cast<int>(d);`, which is *explicit* narrowing. For an exercise about *implicit* conversion, the solution should use `int i = d;` (copy initialization) to demonstrate the implicit narrowing. Alternatively, the prompt should say "use static_cast." The same issue applies to the bool conversion: the solution uses `bool b = static_cast<bool>(n);` instead of `bool b = n;`.

**ISSUE [factual / test case]: Truncation of -2.8.**
The expected output for input `-2.8` has `truncated int: -2`. This is correct: `static_cast<int>(-2.8)` truncates toward zero, yielding `-2`. However, `int i = -2.8;` (implicit narrowing) also truncates toward zero to `-2`. Correct behavior.

**PASS [test cases]:** Verified: `3.9 -> 3`, `4.90`, `zero`; `7.1 -> 7`, `8.10`, `nonzero`; `-2.8 -> -2`, `-1.80`, `nonzero`. All correct.

---

## Lesson 10.2 — Floating-point and integral promotion

### Summary audit

**ISSUE [forward-reference]: `auto` used in code example.**
`auto result = a + b;` appears in the summary code. `auto` is not taught until 10.8. Replace with `int result = a + b;`.

**PASS [factual]:** The explanation of integral promotion (small types -> `int` before arithmetic) is correct. The `sizeof` example is accurate. The distinction between promotion and conversion is clearly stated.

### Exercise 10.2.1 — Integral Promotion Detective

**PASS [code quality]:** Compiles. Straightforward exercise.

**ISSUE [test cases — redundancy]:** All three test cases have identical expected output (no stdin). The second and third test cases ("Verify variable sizes unchanged" and "Consistent output on repeated run") are functionally identical to the first. They add no testing value. At least one test case should test something different (e.g., verify a specific expression's value, not just sizeof).

### Exercise 10.2.2 — Promotion Arithmetic Checker

**PASS [code quality]:** Compiles correctly. Good use of `static_cast<char>` in starter code.

**PASS [factual]:** The explanation about char overflow being safe due to promotion is correct. `sizeof(static_cast<char>(a + b))` correctly returns 1 because sizeof evaluates the type, not the value.

**ISSUE [factual nuance]: "overflows a signed char" claim.**
The prompt note says "60 + 80 = 140, which overflows a signed char (max 127)." The value 140 does not overflow *during the addition* because promotion means the addition happens in `int` space. The note says this correctly ("because of promotion the addition happens in `int` space") but the word "overflows" in the first clause is technically misleading — overflow never occurs. Better wording: "140 exceeds the range of a signed char."

**PASS [test cases]:** `60+80=140`, `10+20=30`, `100+100=200` all correct for promoted int arithmetic.

---

## Lesson 10.3 — Numeric conversions

### Summary audit

**PASS [factual]:** Truncation toward zero is correctly described. The distinction between truncation and rounding is accurate. The `static_cast` usage is appropriate (though static_cast is formally covered in 10.6, it was introduced in 4.12 per prior_lesson_titles, so this is acceptable).

**PASS [no forward references]:** No use of `auto`, vectors, templates, classes, or pointers.

### Exercise 10.3.1 — Truncation Inspector

**ISSUE [test case fragility — floating-point formatting].**
The expected output for input `3.141592653589793` includes `difference: -1.19209e-08`. The exact formatting of scientific notation with `std::defaultfloat` is implementation-defined. Different compilers/stdlib implementations may produce `-1.19209e-008` (Windows MSVC uses 3-digit exponents by default) or slight differences in significant digits. This test may fail on some Judge0 configurations.

Similarly, for input `-7.998`, the expected difference `1.43051e-07` and `float value: -7.99800014` depend on the exact float representation. The float value of `-7.998` as a 32-bit float is approximately `-7.99800014495849609375`, so printing with 8 decimal places gives `-7.99800014` — this is correct for IEEE 754 on the Judge0 platform, but the exact last digit could vary with different rounding modes.

**PASS [code quality]:** Solution compiles and is logically correct.

### Exercise 10.3.2 — Safe Range Checker

**PASS [code quality]:** Compiles correctly. Good use of `static_cast<int>(static_cast<int8_t>(n))` to avoid printing `int8_t` as a character.

**PASS [factual]:** Range checks for int8_t ([-128, 127]) and int16_t ([-32768, 32767]) are correct.

**PASS [test cases]:** `100 8 -> fits/100`, `200 8 -> overflow`, `-32768 16 -> fits/-32768` all correct.

---

## Lesson 10.4 — Narrowing conversions, list initialization, and constexpr initializers

### Summary audit

**ISSUE [factual]: "static_cast<T> (covered in a later lesson)" is incorrect at this point.**
The summary says "Use `static_cast<T>(expr)` (covered in a later lesson) when you genuinely need a narrowing conversion." But `static_cast` was already introduced in lesson 4.12 ("Introduction to type conversion and static_cast") which is in the prior_lesson_titles. It was also used extensively in 10.3. Saying "covered in a later lesson" is confusing — it should say "as you've already seen" or reference 10.6 as a deeper treatment. Lesson 10.6 covers it in more depth, but 10.4 should not claim it hasn't been covered yet.

**PASS [no forward references]:** No `auto`, vectors, templates, classes, or pointers used.

### Exercise 10.4.1 — Detect the Narrowing

**PASS [code quality]:** Compiles. Clean, straightforward range-check exercise.

**PASS [test cases]:** `42/fits, 200/narrows, -5/fits`; `-128/fits, 127/fits, 128/narrows`; `1000/narrows, -200/narrows, -129/narrows` — all correct.

### Exercise 10.4.2 — Safe Brace Init with constexpr

**ISSUE [solution inconsistency with lesson content].**
The lesson says: "if the value is a `constexpr` and the compiler can prove at compile time that it fits in the destination type, brace initialization allows it" and shows `char c1 { small };` (no cast needed). But the solution uses `char c { static_cast<char>(kCode) };`. The whole point of the lesson is that the `static_cast` is *unnecessary* when the initializer is `constexpr` and fits. The solution should be `char c { kCode };` (no cast) to demonstrate the constexpr exemption the lesson just taught. Using `static_cast` undermines the pedagogical point.

**PASS [test cases]:** `3->100`, `0->97`, `25->122` all correct (97+input).

---

## Lesson 10.5 — Arithmetic conversions

### Summary audit

**ISSUE [factual]: Conversion hierarchy rank ordering is imprecise.**
The summary states: `bool < char < short < int < long < long long < float < double < long double`. This is a simplification. The actual C++ standard's "usual arithmetic conversions" rules are more nuanced:
- If either operand is a floating-point type, the other is converted to that floating-point type (with float < double < long double).
- For integer types, the rules involve *integer conversion rank* and signedness, not a simple linear ordering. For instance, `unsigned int` vs `long` depends on whether `long` can represent all values of `unsigned int`.

The simplified hierarchy is pedagogically useful but the summary should note it is a simplification. Currently it presents it as authoritative.

**ISSUE [factual]: `(uint)-1 = 4294967295, +1 wraps to 0` comment.**
The code comment says `// prints 0: (uint)-1 = 4294967295, +1 wraps to 0`. This is correct for 32-bit unsigned int. The arithmetic is: `(unsigned int)(-1) + (unsigned int)(1) = 4294967295 + 1 = 0` (mod 2^32). Correct.

**PASS [no forward references]:** `std::size_t` is mentioned but was covered in lesson 4.6.

### Exercise 10.5.1 — Expression Type Detective

**PASS [code quality]:** Compiles correctly. Good exercise for understanding sizeof results.

**ISSUE [test cases — redundancy]:** All three test cases have identical expected output (no stdin). Same problem as exercise 10.2.1. Two of three tests are pure duplicates.

### Exercise 10.5.2 — Signed/Unsigned Surprise

**ISSUE [factual / portability]: `static_cast<int>(u)` for signed comparison is unsafe.**
The solution does `if (s < static_cast<int>(u))` for the "signed comparison." But if `u` exceeds `INT_MAX`, this cast is undefined behavior (or at minimum implementation-defined). The prompt guarantees nothing about `u`'s range. For the given test cases it works (u=1, u=7, u=3), but the approach is not generally safe. A note or guard should be added.

**ISSUE [code quality]: Pragma GCC diagnostic in solution.**
The solution uses `#pragma GCC diagnostic push/pop` and `// NOLINT` comments. These are advanced constructs not taught in the curriculum at this point. The solution should simply let the comparison happen and accept the warning, or use a comment explaining it. Students will copy solution code and be confused by pragmas.

**PASS [test cases]:** `-1 1 -> 0, s<u, mixed: s>=u`; `3 7 -> 10, s<u, mixed: s<u`; `-5 3 -> 4294967294, s<u, mixed: s>=u`. Verified:
- `-5` as unsigned = 4294967291. 4294967291 + 3 = 4294967294. Correct.
- For `3 7`: `3 + 7 = 10` (both positive, no wrapping). `3 < 7` is true both signed and mixed. Correct.

---

## Lesson 10.6 — Explicit type conversion (casting) and static_cast

### Summary audit

**PASS [factual]:** Correct description of `static_cast`. Correctly advises against C-style casts.

**ISSUE [minor]: Summary says "lesson 10-4" but the lesson numbering uses dots (10.4).**
Internal cross-references inconsistently use hyphens (10-4, 10-7) vs dots. Should be standardized to match the actual lesson numbers (10.4, 10.7).

**PASS [no forward references]:** No vectors, templates, classes, or pointers. No `auto`.

### Exercise 10.6.1 — Integer Division to Floating-Point Result

**PASS [code quality]:** Compiles. Clean exercise.

**PASS [test cases]:** `7/3 -> Integer: 2, Double: 2.333333`; `10/4 -> Integer: 2, Double: 2.500000`; `1/7 -> Integer: 0, Double: 0.142857`. All correct.

**ISSUE [pedagogical redundancy]:** This exercise is nearly identical to exercise 10.1.1 (Integer vs. Floating-Point Division). Both read two ints, print integer division, print floating-point division with 6 decimal places. The only difference is the output label format and that 10.1.1 also prints the remainder. Students will feel like they are doing the same exercise twice.

### Exercise 10.6.2 — Character Code Inspector

**PASS [code quality]:** Compiles. Good exercise for static_cast<int>/static_cast<char>.

**PASS [test cases]:** `A -> 65, D`; `M -> 77, P`; `W -> 87, Z`. All correct.

---

## Lesson 10.7 — Typedefs and type aliases

### Summary audit

**ISSUE [forward-reference]: `std::vector` and `std::pair` used extensively.**
The summary code examples use `std::vector<std::pair<int, int>>` and `std::vector<std::vector<T>>` (alias template example). `std::vector` is not introduced until Chapter 16, and `std::pair` is not introduced until later. These are forward references. The lesson should use simpler types that the student has already seen (e.g., `unsigned long long`, `const char*`, or `std::string`).

**ISSUE [forward-reference]: Template alias shown (`template<typename T> using Grid = ...`).**
Templates are not covered until Chapter 11. The alias template example introduces both `template<typename T>` syntax and `std::vector<std::vector<T>>` — two concepts not yet taught. This should be removed or replaced with a note that says "you'll see this in Chapter 11."

**ISSUE [forward-reference]: `const char*` used in summary.**
Pointers (`const char*`) are not covered until Chapter 12. While it appears only in a passing mention of "long type names," it is still a forward reference.

### Exercise 10.7.1 — Distance Unit Aliases

**PASS [code quality]:** Compiles. Good exercise for type aliases.

**PASS [test cases]:** `3.5km -> 3500.00m`, `10.0mi -> 16.09km`; `1.0km -> 1000.00m`, `1.0mi -> 1.61km`; `0.0km -> 0.00m`, `26.2mi -> 42.16km`. Verified: 26.2 * 1.60934 = 42.164708, rounds to 42.16. Correct.

### Exercise 10.7.2 — Refactor: typedef to using

**PASS [code quality]:** Compiles. Good exercise for converting typedef to using.

**ISSUE [minor]: `PlayerName` alias is declared but never used.**
The solution defines `using PlayerName = std::string;` but it is never used in the code. The exercise should either use it or remove it.

**PASS [test cases]:** `7 250 -> Player 7: 250 pts`; `1 0 -> Player 1: 0 pts`; `100 -50 -> Player 100: -50 pts`. All correct.

---

## Lesson 10.8 — Type deduction for objects using the auto keyword

### Summary audit

**PASS [factual]:** `auto` deduction rules are correctly described. The note about stripping top-level `const` and references is accurate.

**ISSUE [forward-reference]: `auto` references (`auto&`) mentioned.**
The summary says "`auto` also strips references. To deduce a reference type, write `auto&`." References are not covered until Chapter 12. While mentioning the existence is borderline acceptable, providing `auto&` syntax gives students a tool they cannot fully understand yet.

**ISSUE [forward-reference]: Iterator example.**
The summary mentions "iterator types (`auto it = vec.begin();`)" — iterators and vectors are Chapter 16/17 material.

**ISSUE [minor]: "Explicit casts (10-7)" cross-reference.**
The cross-reference says "10-7" but the explicit cast lesson is 10.6. Lesson 10.7 is about typedefs/aliases. This is a factual error in the cross-reference.

### Exercise 10.8.1 — Decode the Deduced Types

**ISSUE [test case fragility / correctness]: `float` printing of `3.14`.**
Expected output has `3.14 4` for the float value. But `3.14` read as `double` then cast to `float` is `3.14000010490417...`. When printed with default precision (6 significant digits), `std::cout << f_val` would output `3.14` (since default precision is 6 and the value rounds to `3.14` at 3 significant figures... actually default precision is 6 significant digits, so `3.14000` would display as `3.14`). Let me verify: `static_cast<float>(3.14)` = approximately `3.1400001049041748046875`. With default cout precision of 6 significant digits: `3.14` (trailing zeros are dropped in default mode). This is correct.

**ISSUE [test case]: Hidden test "large long long" — `2.71828` as float.**
Input is `2.71828`. `static_cast<float>(2.71828)` = approximately `2.71828007698059082031`. With default precision (6 significant digits): `2.71828`. Expected output shows `2.71828 4`. This is correct.

**PASS [code quality]:** Solution compiles.

### Exercise 10.8.2 — Auto Arithmetic and Literal Suffixes

**ISSUE [factual / dangerous pattern]: `0u + a + b` does NOT produce `unsigned int` safely.**
The exercise says "Compute their sum as an unsigned int — add `0u` to the first operand before adding the second (this forces unsigned int deduction)." But `0u + a` where `a` is a signed `int` triggers the same signed/unsigned mixing problem taught in lesson 10.5. If `a` is negative, `0u + a` wraps to a large unsigned value. The exercise constrains inputs to "fits in 32-bit int" but does not say non-negative. If either input is negative, the sum would be a wrapped unsigned value.

For test case `6 4`: `0u + 6 + 4 = 10`. Fine.
For test case `100000 100000`: `0u + 100000 + 100000 = 200000`. Fine.
For test case `7 2`: `0u + 7 + 2 = 9`. Fine.

All test inputs happen to be positive, so this works. But the exercise teaches a **dangerous pattern** without warning — using `0u +` to force unsigned is exactly the signed/unsigned mixing anti-pattern lesson 10.5 warned against. This is pedagogically contradictory.

**PASS [test cases]:** Given the positive test inputs, all outputs are correct.

---

## Lesson 10.9 — Type deduction for functions

### Summary audit

**ISSUE [forward-reference]: References used extensively.**
The `decltype(auto)` section discusses returning `int&` (references), lvalue expressions, and "preserving value category." References are not taught until Chapter 12. This is a significant forward reference. Students have no framework to understand what a reference is, what `int&` means, or why `(x)` yields an lvalue reference.

**ISSUE [forward-reference]: `decltype(auto) h() -> decltype(auto)` syntax.**
The example `decltype(auto) h() -> decltype(auto) { return (x); }` is syntactically invalid. You cannot combine `decltype(auto)` as a return type with a trailing return type. The function should be either:
- `decltype(auto) h() { return (x); }` (using `decltype(auto)` deduction), or
- `auto h() -> int& { return x; }` (using trailing return type).

This is a **factual error** — the code does not compile.

### Exercise 10.9.1 — Auto Return Type: Temperature Converter

**PASS [code quality]:** Solution compiles. Good exercise for `auto` return types.

**PASS [test cases]:** `100C -> 212.0, hot`; `0C -> 32.0, freezing`; `22C -> 71.6, comfortable`. Verified: 22 * 9/5 + 32 = 71.6. Correct.

### Exercise 10.9.2 — Trailing Return Types and decltype(auto): Safe Array Accessor

**ISSUE [forward-reference]: Pointers used (`const int* arr`, `int* arr`).**
Both function signatures use pointer parameters. Pointers are Chapter 12 material. At this point in the curriculum, the student has never seen `const int*` or `int*` syntax. This is a direct forward reference.

**ISSUE [forward-reference]: C-style arrays used (`int data[5]{10, 20, 30, 40, 50}`).**
C-style arrays are Chapter 17 material (or arguably Chapter 16 with `std::array`). Students have not been taught array declaration or subscript access.

**ISSUE [forward-reference]: References via `decltype(auto)`.**
The exercise requires understanding that `decltype(auto)` returns a reference (`int&`) when `return arr[i]` is used. References are Chapter 12. The student cannot reason about why `ref_get(data, r) *= 2;` modifies the original array without understanding references.

**PASS [code quality]:** Solution compiles and is technically correct.

**PASS [test cases]:** `2 4 -> 30, 100`; `9 0 -> -1, 20`; `0 4 -> 10, 100`. All correct.

---

## Lesson 10.x — Chapter 10 summary and quiz

### Summary audit

**PASS [factual]:** The summary accurately recaps the chapter content. Cross-references are correct.

**PASS [code quality]:** The combined example compiles and demonstrates aliases, auto, arithmetic conversion, and static_cast together.

### Exercise 10.x.1 — Safe Statistics Calculator

**ISSUE [forward-reference]: `std::vector` used.**
Both the starter code and solution use `#include <vector>` and `std::vector<Score>`. Vectors are Chapter 16/17 material. The student has never been taught how to declare, size, or iterate over a vector.

**ISSUE [forward-reference]: Range-based for loop (`for (auto& s : scores)`) used.**
Range-based for loops with `auto&` require understanding of both ranges (Chapter 16) and references (Chapter 12). Neither has been taught.

**PASS [test cases]:** `5 10 20 30 40 50 -> Sum: 150, Average: 30.00, Above average: 40.0%`; `1 42 -> Sum: 42, Average: 42.00, Above average: 0.0%`; `4 7 7 7 7 -> Sum: 28, Average: 7.00, Above average: 0.0%`. Verified: 2/5 scores above 30 = 40%. Correct.

### Exercise 10.x.2 — Unit Converter Chain

**PASS [code quality]:** Compiles. Clean capstone exercise.

**PASS [no forward references]:** Uses only `int`, `double`, type aliases, `auto`, trailing return types, and `static_cast`. No vectors, arrays, pointers, references, or templates.

**PASS [test cases]:** `6 -> Feet: 6, Centimetres: 182.88, Millimetres: 1828`; `1 -> Feet: 1, Centimetres: 30.48, Millimetres: 304`; `100 -> Feet: 100, Centimetres: 3048.00, Millimetres: 30480`. Verified: 6*30.48=182.88, 182.88*10=1828.8, truncated to 1828. Correct.

---

## Exercise Progression Assessment

The progression is mostly logical:
1. 10.1 introduces implicit conversions -> exercises on integer vs float division and narrowing
2. 10.2 dives into promotions -> exercises on sizeof and promotion behavior
3. 10.3 covers numeric conversions -> truncation and range checking
4. 10.4 covers narrowing + brace init -> range detection and constexpr exemption
5. 10.5 covers arithmetic conversions -> sizeof detective and signed/unsigned mixing
6. 10.6 covers explicit casts -> integer-to-float division (redundant with 10.1.1) and char codes
7. 10.7 covers type aliases -> unit conversion and typedef refactoring
8. 10.8 covers auto for objects -> type deduction and literal suffix tricks
9. 10.9 covers auto for functions -> temperature converter and array accessor
10. 10.x provides capstone -> statistics calculator and unit converter chain

**Concern:** Exercise 10.6.1 is nearly a duplicate of 10.1.1. Consider replacing it with a different cast scenario (e.g., casting between signed/unsigned, or char-to-int conversions with more nuance).

**Concern:** Exercises 10.9.2 and 10.x.1 have significant forward-reference problems (pointers, arrays, vectors, references) that make them unsuitable for students at this point in the curriculum.

---

## Summary of Issues by Severity

### CRITICAL (blocks learning or produces wrong results)

| # | Lesson | Issue |
|---|--------|-------|
| 1 | 10.9 summary | `decltype(auto) h() -> decltype(auto)` does not compile — invalid syntax combining `decltype(auto)` with trailing return type |
| 2 | 10.9.2 exercise | Requires pointers, C-style arrays, and references — three concepts from Ch 12/17 not yet taught |
| 3 | 10.x.1 exercise | Requires `std::vector` (Ch 16), range-based for with `auto&` (Ch 12/16) |
| 4 | 10.7 summary | `std::vector`, `std::pair`, and template alias syntax — all forward references to Ch 11/16 |

### HIGH (factual errors or misleading content)

| # | Lesson | Issue |
|---|--------|-------|
| 5 | 10.1 summary | `auto` used before it is introduced (10.8) |
| 6 | 10.2 summary | `auto` used before it is introduced (10.8) |
| 7 | 10.1 summary | "Numeric promotion hierarchy" label is incorrect; this is the usual arithmetic conversion ranking |
| 8 | 10.4 summary | Says `static_cast` is "covered in a later lesson" but it was already taught in 4.12 |
| 9 | 10.4.2 solution | Uses `static_cast<char>(kCode)` when the whole lesson point is that `constexpr` values don't need a cast in brace-init |
| 10 | 10.8 summary | Cross-reference "Explicit casts (10-7)" is wrong — 10.7 is typedefs, 10.6 is casts |
| 11 | 10.5.2 solution | `static_cast<int>(u)` is UB if `u > INT_MAX`; not safe in general |
| 12 | 10.8.2 exercise | Teaches `0u + a` as a pattern, directly contradicting 10.5's warning about signed/unsigned mixing |

### MEDIUM (pedagogical or quality concerns)

| # | Lesson | Issue |
|---|--------|-------|
| 13 | 10.1 summary | `-Wall -Wextra` claim about narrowing warnings; actually needs `-Wconversion` |
| 14 | 10.1.2 solution | Uses `static_cast` in an exercise about *implicit* narrowing |
| 15 | 10.6.1 exercise | Nearly identical to 10.1.1 — redundant |
| 16 | 10.7.2 solution | `PlayerName` alias declared but never used |
| 17 | 10.8 summary | `auto&` and iterator examples reference Ch 12/16 material |
| 18 | 10.9 summary | `decltype(auto)` section requires understanding of references (Ch 12) |
| 19 | 10.5.2 solution | Uses `#pragma GCC diagnostic` and `// NOLINT` — advanced constructs not taught |

### LOW (test case redundancy or minor issues)

| # | Lesson | Issue |
|---|--------|-------|
| 20 | 10.2.1 tests | All 3 test cases are identical (no-input deterministic output) |
| 21 | 10.5.1 tests | All 3 test cases are identical (no-input deterministic output) |
| 22 | 10.3.1 tests | Scientific notation formatting is implementation-defined; may fail on some platforms |
| 23 | 10.6 summary | Inconsistent cross-reference format: "10-4" vs "10.4" |
