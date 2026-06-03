# Chapter 5 Audit: Constants and Strings

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Lessons audited:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.x

---

## Critical Issues

### CRIT-1: Lesson 5.5 Ex1 "Compile-Time Circle Constants" -- solution will not compile

The solution contains fatal arithmetic errors in both the expected output and the `static_assert` statements.

- `PI_SCALED = 314`, `RADIUS = 5`
- `scaled_area(5)` returns `PI_SCALED * 5 * 5 = 314 * 25 = 7850` -- but expected output says `785`
- `scaled_circumference(5)` returns `2 * PI_SCALED * 5 = 3140` -- but expected output says `314`
- `static_assert(area_num == 785)` will **fail at compile time** (actual value is 7850)
- `static_assert(circ_num == 314)` will **fail at compile time** (actual value is 3140)

The prompt text, expected output, solution code, and all three test cases are mutually inconsistent. The formulas in the prompt are correct (`PI_SCALED * r * r` and `2 * PI_SCALED * r`) but the numeric answers are off by a factor of 10. **Fix:** change expected output to `7850` and `3140`, update the `static_assert` values, and update all three test cases.

### CRIT-2: Lesson 5.4 Ex1 "Compile-Time Unit Conversions" -- integer overflow on max test case

Hidden test case uses `meters = 10000`. The solution computes `um = meters * um_per_m` where both are `int`. `10000 * 1000000 = 10,000,000,000` which exceeds `INT_MAX` (2,147,483,647). This is **signed integer overflow = undefined behavior**. The expected output `Micrometers: 10000000000` is unreachable with `int` arithmetic.

**Fix:** Either change `um_per_m` and `um` to `long long`, or reduce the max test input to 2147 (the largest value where `meters * 1000000` fits in `int`).

### CRIT-3: Lesson 5.7 Ex2 "Const and Mutable Greeting Builder" -- forward reference to `for` loops (Ch 8)

The exercise requires a `for` loop (`for (int i{0}; i < level; ++i)`). Loops are not taught until Chapter 8. Students at this point in the curriculum have no knowledge of loop syntax. The prompt explicitly says "Use a `for` loop that runs exactly `level` times." This is not a background concept students can guess -- it requires specific syntax knowledge.

**Fix:** Restructure the exercise to avoid loops. Since `level` is 1-5, the exercise could use repeated `+=` with an `if` chain (if/else is available from 4.10), or redesign the exercise entirely.

### CRIT-4: Lesson 5.9 Ex2 "Constexpr Greeting Prefix Validator" -- forward reference to `for` loops (Ch 8)

The starter code and solution both contain `for (int i = 0; i < n; ++i)`. The exercise inherently requires iterating over N lines, which needs a loop construct not yet taught.

**Fix:** Either redesign to process a single line (no loop needed) or accept that this is a forward reference and add a comment in the starter code explaining the loop syntax, since students cannot be expected to write it from scratch.

---

## Major Issues

### MAJ-1: Lesson 5.3 Ex1 and Ex2 -- missing `<cstdio>` include; no input mechanism in starter code

Both exercises in 5.3 use `std::scanf` in their solution code but include only `<print>` and `<cstdint>`. `std::scanf` is declared in `<cstdio>`, which is not included. The starter code also provides no way for the student to read input -- no `<iostream>` and no `<cstdio>` is included.

**Fix:** Either switch solutions to use `std::cin` (and add `<iostream>` to the starter code) or add `<cstdio>` to both the starter code and solution includes.

### MAJ-2: Lesson 5.3 Ex2 and 5.x Ex2 -- forward reference to bitwise operators (Ch 6)

Both exercises require bitwise AND (`&`) and bit-shift operators (`>>`, `<<`). Bitwise operators are taught in Chapter 6 (lesson 6.3). The 5.3 Ex2 RGB exercise uses `(color & RED_MASK) >> 16`, and the 5.x Ex2 bitmask exercise uses `n & READ`. Students have not been introduced to these operators.

**Fix:** For 5.3 Ex2, the exercise is integral to demonstrating hex/binary so it may be acceptable with explicit explanation of the `&` and `>>` operators in the prompt. For 5.x Ex2, consider removing or replacing with a non-bitwise exercise since it's a quiz and shouldn't introduce new operators.

### MAJ-3: Lesson 5.x Ex2 "Classify a Binary Bitmask" -- forward reference to ternary operator (Ch 6)

The solution uses the conditional/ternary operator (`isSet ? "set" : "not set"`). The ternary operator is covered in Chapter 6. Students could use `if`/`else` instead (available from 4.10), but the solution should model what students can write.

**Fix:** Replace the ternary in the solution with an `if`/`else` block.

### MAJ-4: Lesson 5.2 Ex2 "Receipt Calculator" -- pointless `HUNDRED` constant

The requirements mandate declaring `constexpr double HUNDRED = 100.0` but it is never used in any computation. The solution casts it to void with `(void)HUNDRED;` to suppress the unused-variable warning. This is pedagogically confusing -- students will be puzzled about what `HUNDRED` is for.

**Fix:** Either remove the `HUNDRED` requirement entirely, or redesign the exercise so `HUNDRED` is actually used (e.g., rounding to nearest cent: `std::round(total * HUNDRED) / HUNDRED`).

---

## Minor Issues

### MIN-1: Lesson 5.6 summary -- forward reference to `std::string_view` (Lesson 5.8)

The 5.6 summary states: "Strings require `constexpr`-compatible types like `std::string_view` rather than `std::string`." This references `std::string_view` which is not introduced until lesson 5.8. Students reading in order will encounter an unfamiliar type name.

**Fix:** Either remove the specific mention of `std::string_view` or add "(covered in a later lesson in this chapter)" after it.

### MIN-2: Lesson 5.2 summary and Ex2 -- within-chapter forward reference to `constexpr`

Lesson 5.2 (Literals) uses `constexpr` in its example code and requires it in Exercise 2. The `constexpr` keyword is not formally taught until lessons 5.4-5.6. Lesson 5.1 mentions `constexpr` briefly as "covered later" but does not teach its semantics.

**Fix:** Change the 5.2 Ex2 requirement from `constexpr` to `const`, or accept this as intentional scaffolding within the chapter.

### MIN-3: Lesson 5.9 Ex2 -- Unicode em-dash in expected output

The expected output contains a Unicode em-dash character (U+2014) in the string `"Greeting — body: "`. The solution uses the `—` escape sequence. This is an unusual requirement for a beginner C++ exercise and may cause encoding issues on some systems or with some Judge0 configurations.

**Fix:** Replace the em-dash with a plain ASCII hyphen-minus or double-hyphen (`--`).

### MIN-4: Lesson 5.4 Ex2 "Screen Resolution Stats" -- `#include <string>` is unnecessary

The starter code and solution include `<string>` but no `std::string` is used anywhere. All output is via `std::cout` with integers and `long long` values.

**Fix:** Remove `#include <string>` from both starter and solution code.

### MIN-5: Lesson 5.5 Ex1 -- all three test cases produce identical output

Since there is no stdin input (the radius is a compile-time constant), all three test cases have empty stdin and the exact same expected output. The hidden test cases claim to verify `static_assert` but the Judge0 runtime testing cannot actually verify compile-time assertions differently from the sample test.

**Fix:** This is acceptable for a no-input exercise, but the hidden test labels are misleading. Consider renaming them to indicate they are redundant runtime checks.

### MIN-6: Lesson 5.5 Ex2 -- all three test cases produce identical output

Same issue as MIN-5. No stdin input, all test cases produce identical output.

---

## Exercise Progression Assessment

The overall progression within Chapter 5 is logical:

1. **5.1** (const) -> **5.2** (literals) -> **5.3** (numeral systems) -> **5.4** (as-if rule / optimization) -> **5.5** (constant expressions) -> **5.6** (constexpr variables) -> **5.7** (std::string) -> **5.8** (std::string_view) -> **5.9** (string_view part 2) -> **5.x** (summary quiz)

The constants block (5.1-5.6) builds logically from const to constexpr. The strings block (5.7-5.9) builds from owned strings to non-owning views. The quiz (5.x) combines both threads.

However, the `constexpr` keyword is used in exercises before it is formally taught (5.2 Ex2 uses it; formal teaching is 5.4-5.6). This creates a dependency inversion within the chapter.

---

## Lesson-by-Lesson Details

### Lesson 5.1: Constant variables (named constants)

**Summary:** Accurate. Correctly explains `const`, initialization requirement, naming conventions. Appropriately previews `constexpr` as "coming later." No factual errors.

**Exercise 1 (Circle Measurements with Named Constants):** Clean. Test cases verified correct. Uses `const double`, `std::fixed`, `std::setprecision(4)`. No forward references. Good edge case coverage (whole number radius).

**Exercise 2 (Speed-to-Pace Converter):** Clean. Test cases verified correct. Uses `const double` and `const int`, `static_cast<int>`, modulo operator. All prior knowledge. Good edge cases (0 remaining seconds, pace under 1 minute).

### Lesson 5.2: Literals

**Summary:** Accurate coverage of integer, floating-point, character, string, boolean, and pointer literals. The `constexpr` usage in the example code is a minor within-chapter forward reference (see MIN-2).

**Exercise 1 (Print Literal Type Sizes):** Clean. Test cases verified correct. Assumes standard 64-bit sizes (sizeof(int)=4, sizeof(double)=8, sizeof(char)=1) which matches Judge0 environment. No forward references.

**Exercise 2 (Receipt Calculator):** Has the `HUNDRED` constant issue (MAJ-4). Otherwise test cases verified correct. The `constexpr` requirement is a within-chapter forward reference (MIN-2).

### Lesson 5.3: Numeral systems

**Summary:** Accurate. Good coverage of decimal, binary, octal, hex. Correctly explains digit separators and format specifiers.

**Exercise 1 (Display One Integer in Four Bases):** Missing `<cstdio>` for `std::scanf` (MAJ-1). No `<iostream>` in starter code. Test cases verified correct assuming the output format is produced by `{:#b}`, `{:#o}`, `{:#X}`.

**Exercise 2 (Named Color Constants: Decode an RGB Hex Code):** Same `<cstdio>` issue (MAJ-1). Uses bitwise AND and bit-shift operators which are Ch 6 material (MAJ-2). Test cases verified correct.

### Lesson 5.4: The as-if rule and compile-time optimization

**Summary:** Accurate. Clearly explains the as-if rule, constant folding, and constexpr vs const distinction.

**Exercise 1 (Compile-Time Unit Conversions):** Has integer overflow on max test case (CRIT-2). The `meters=10000` case produces `um = 10,000,000,000` which overflows `int`. The `meters=1` and `meters=5` test cases are fine.

**Exercise 2 (Screen Resolution Stats):** Clean. Correctly uses `long long` for large intermediate values. Solution uses `static_cast<long long>(width) * height` to avoid overflow. Test cases verified correct. Unnecessary `#include <string>` (MIN-4).

### Lesson 5.5: Constant expressions

**Summary:** Accurate. Good coverage of `constexpr`, `consteval`, and what counts as a constant expression. Uses `std::format` which is not formally taught yet but is a utility, not a core concept.

**Exercise 1 (Compile-Time Circle Constants):** **Will not compile** (CRIT-1). Expected values and static_asserts are wrong by a factor of 10. All three test cases have identical output. See CRIT-1 for details.

**Exercise 2 (Compile-Time Unit Conversion Table):** Clean. Test cases verified correct (`1*254=254`, `6*254=1524`, `12*254=3048`, `24*254=6096`, `36*254=9144`). Static asserts match. All three test cases have identical output (MIN-6).

### Lesson 5.6: Constexpr variables

**Summary:** Accurate. Good distinction between const and constexpr. Mentions string_view as constexpr-friendly (MIN-1 forward reference). The practical advice to default to constexpr is sound.

**Exercise 1 (Compute Circle Properties with Constexpr Constants):** Clean. Test cases verified correct. Good use of namespace-scope `constexpr` with runtime input. No forward references.

**Exercise 2 (Speed and Distance Table):** Clean. Test cases verified correct. Good demonstration of `const int` (runtime) vs `constexpr int`/`constexpr double` (compile-time). No forward references.

### Lesson 5.7: Introduction to std::string

**Summary:** Accurate. Good coverage of std::string basics, concatenation, size(), the distinction from C-style string literals, and the `"s"` suffix.

**Exercise 1 (Build a User Display Name):** Clean. Test cases verified correct. No forward references. Good basic string concatenation exercise.

**Exercise 2 (Const and Mutable Greeting Builder):** **Uses a `for` loop** (CRIT-3). Loops are Ch 8 material. Otherwise the exercise is well-designed and test cases are correct.

### Lesson 5.8: Introduction to std::string_view

**Summary:** Accurate. Good explanation of string_view as non-owning, its relationship to std::string, and constexpr compatibility. Correctly warns about dangling views.

**Exercise 1 (Describe String Segments):** Clean. Test cases verified correct. Good use of `string_view::substr()` and `length()`. No forward references. The implicit conversion from `std::string` to `std::string_view` is correctly demonstrated.

**Exercise 2 (Compile-Time Greeting with constexpr string_view):** Clean. Test cases verified correct. Good demonstration of `constexpr string_view`, helper functions accepting `string_view`, and implicit conversion. No forward references.

### Lesson 5.9: std::string_view (part 2)

**Summary:** Accurate. Good coverage of lifetime issues, no-modification guarantee, null termination caveat, and useful member functions.

**Exercise 1 (Trim and Search a String View):** Clean. Test cases verified correct. Good use of `remove_prefix`, `remove_suffix`, and `find`. Uses `if`/`else` which is available from 4.10.

**Exercise 2 (Constexpr Greeting Prefix Validator):** Uses a `for` loop (CRIT-4). Uses Unicode em-dash in output (MIN-3). Otherwise well-designed with good use of `starts_with` and `remove_prefix`.

### Lesson 5.x: Chapter 5 summary and quiz

**Summary:** Accurate. Good consolidation of const/constexpr and string/string_view concepts.

**Exercise 1 (Format a Hex Color Code):** Clean. Test cases verified correct. Good capstone exercise combining `constexpr string_view`, `std::format`, and hex formatting. No forward references.

**Exercise 2 (Classify a Binary Bitmask):** Uses bitwise AND from Ch 6 (MAJ-2). Solution uses ternary operator from Ch 6 (MAJ-3). Test cases verified correct. The exercise is thematically appropriate for the chapter but uses operators not yet taught.

---

## Summary of Findings

| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 4 | CRIT-1, CRIT-2, CRIT-3, CRIT-4 |
| Major | 4 | MAJ-1, MAJ-2, MAJ-3, MAJ-4 |
| Minor | 6 | MIN-1, MIN-2, MIN-3, MIN-4, MIN-5, MIN-6 |

**Blocking issues (must fix before deploy):** CRIT-1 (5.5 Ex1 will not compile), CRIT-2 (5.4 Ex1 undefined behavior on max test case), CRIT-3 and CRIT-4 (for-loop forward references in 5.7 Ex2 and 5.9 Ex2).
