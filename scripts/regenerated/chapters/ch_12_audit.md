# Chapter 12 Audit: Compound Types — References and Pointers

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Source:** `ch_12.json` (16 lessons: 12.1 through 12.15, plus 12.x)

---

## Global Observations

### Forward-Reference Violations

| Location | Issue | Severity |
|---|---|---|
| **12.1 summary** | Lists "Structs and classes" and "Arrays" as compound types the student "will meet." Acceptable as a roadmap preview -- no code uses them. | OK (informational) |
| **12.1 summary** | Code sample uses both `int&` (reference) AND `int*` (pointer) in the same snippet. Pointers are not taught until 12.7. Students see pointer syntax 6 lessons early. | **MEDIUM** |
| **12.1 exercise 1 ("Classify the Types")** | Requires declaring `int* ptr`, dereferencing `*ptr`, and testing `ptr != nullptr`. All pointer concepts (declaration, dereference, nullptr) are taught in 12.7-12.8 -- 6 lessons later. | **HIGH** |
| **12.1 exercise 2 ("Swap via Pointer Parameters")** | Entire exercise revolves around `int*` parameters and pointer dereference. Identical to the exercise in 12.7. Forward-references pointer material by 6 lessons. | **HIGH** |
| **12.3 exercise 2 ("Increment via Reference")** | Uses `int arr[10]` (C-style array). Arrays are Ch 16/17 material. The prompt says "range-based for loop with int& loop variable" but the solution uses index-based loops instead, since range-for over a raw C array iterates all 10 elements, not just `n`. The starter code already contains index-based array reads, so this is inconsistent but tolerable for a fixed-size buffer pattern students have seen in earlier stdin-reading exercises. | **LOW** |
| **12.3 exercise 2** | Prompt says "Do not use index arithmetic inside the loop body" but the solution uses `arr[i]` in an indexed loop -- it does create a reference alias `int& ref { arr[i] }` inside the body, but the indexing itself is index arithmetic. The requirement is self-contradictory with the implementation. | **MEDIUM** |
| **12.6 exercise 2 ("Sentence Statistics")** | Hidden test case: `"i love programming in cpp"` expects longest word length 11 (`programming` = 11 chars). Correct. | OK |
| **12.8 exercise 2 ("Pointer-based linear search")** | Uses `int arr[20]` (C-style array). Same Ch-16 concern as 12.3 ex2, but students have been using fixed-size stack arrays for stdin patterns since earlier chapters. | OK (tolerable) |
| **12.11 exercise 2 ("Find and Describe an Element")** | Starter code and solution use `std::vector<int>`. Vectors are Ch 16/17 material. | **HIGH** |
| **12.11 exercise 2** | Starter code includes `#include <vector>`. Students have not been taught `std::vector`. | **HIGH** |
| **12.12 exercise 1 ("Safe Reference Returns from a Static Cache")** | Summary text references `std::vector<std::string>` in an example; the exercise itself does not use vectors. | **LOW** (summary only) |
| **12.12 exercise 2 ("Find Element by Address with Null Sentinel")** | Starter and solution code use `std::vector<int>` with `.data()`, range-for with `int&`, and `v(n)` construction. | **HIGH** |
| **12.15 exercise 2 ("Find first element matching a predicate")** | Uses `std::vector<int>` in both starter and solution. | **HIGH** |

**Summary of forward-reference violations:**
- **Pointer syntax used before pointers are taught (12.1):** 2 exercises
- **std::vector used (Ch 16/17):** 3 exercises (12.11 ex2, 12.12 ex2, 12.15 ex2)
- **Classes/structs (Ch 13/14):** None
- **Dynamic allocation (Ch 19):** None
- **Smart pointers (Ch 22):** None
- **Operator overloading (Ch 21):** None

---

## Lesson-by-Lesson Audit

### 12.1 — Introduction to Compound Data Types

**Summary:** Acceptable overview. Lists compound types as a roadmap. The code example mixing references and pointers is a forward-reference concern (see above).

**Exercise 1: "Classify the Types"**
- **Forward reference:** Uses pointer declaration, dereference, and nullptr comparison -- all taught in 12.7-12.8.
- **Code quality:** Solution compiles and produces correct output.
- **Test cases:** 3 cases, all correct. Edge cases covered (0, negative).
- **Verdict:** FAIL -- exercise should not require pointer syntax this early. Recommend replacing with a reference-only exercise or moving to after 12.7.

**Exercise 2: "Swap via Pointer Parameters"**
- **Forward reference:** Entire exercise is pointer-based. Nearly identical to 12.7 exercise 2.
- **Code quality:** Solution compiles correctly.
- **Test cases:** 3 cases, correct including equal-values edge case.
- **Verdict:** FAIL -- belongs after 12.7. This is a duplicate of the 12.7 swap exercise.

---

### 12.2 — Value Categories (lvalues and rvalues)

**Summary:** Accurate explanation of lvalues and rvalues. Correctly distinguishes modifiable vs non-modifiable lvalues. Cross-references to 12.1 are appropriate.

**Exercise 1: "Classify expressions as lvalue or rvalue"**
- **Factual accuracy:** All 5 classifications are correct:
  - Named variable `n` = lvalue (correct)
  - Literal `42` = rvalue (correct)
  - `n + 1` = rvalue (correct)
  - `n` after `++n` = lvalue (correct -- `n` itself is still an lvalue; the side effect doesn't change that)
  - `n * 2` = rvalue (correct)
- **Code quality:** Compiles. Output is constant regardless of input, as stated.
- **Test cases:** 3 cases, all produce identical output as expected.
- **Verdict:** PASS

**Exercise 2: "Swap two values using lvalue references"**
- **Factual accuracy:** Correct. Uses lvalue references for swap.
- **Code quality:** Bubble-sort of 3 elements is correct (3 comparisons).
- **Test cases:** 3 cases -- already sorted, unsorted, reverse with negatives. All correct.
- **Note:** The prompt says "Passing an rvalue must not compile" -- this is a design constraint description, not testable in the exercise. Acceptable.
- **Verdict:** PASS

---

### 12.3 — Lvalue References

**Summary:** Accurate. Correctly covers: declaration syntax, gotcha with `int& a, b;`, must-initialize, cannot-reseat, not-an-object, dangling references.

**Exercise 1: "Reference Swap"**
- **Code quality:** Compiles. Correct swap implementation.
- **Test cases:** 3 cases including equal values. Correct.
- **Note:** Naming the function `swap` risks collision with `std::swap` if `using namespace std;` were present, but the code doesn't use `using namespace std`, so it's fine.
- **Verdict:** PASS

**Exercise 2: "Increment via Reference"**
- **Forward reference:** Uses `int arr[10]` -- a C-style array. Students have seen fixed-size arrays in stdin patterns. Borderline.
- **Prompt inconsistency:** Prompt says "range-based for loop with int& loop variable" but the solution uses an indexed for-loop. The starter code also uses indexed loops. The prompt's own requirement contradicts the implementation approach.
- **Code quality:** Solution compiles and produces correct output.
- **Test cases:** 3 cases. All correct.
- **Verdict:** PASS with caveats -- prompt wording needs cleanup to match the actual solution pattern.

---

### 12.4 — Lvalue References to Const

**Summary:** Accurate. Correctly explains: binding rules (modifiable lvalue, const lvalue, rvalue), lifetime extension for temporaries, the `const T&` parameter guideline, and the size threshold heuristic.

**Exercise 1: "Const Reference Parameter Inspector"**
- **Code quality:** Compiles. Correct output.
- **Test cases:** 3 cases. All correct.
- **Note:** The prompt says "Three integers on separate lines: 1. A plain integer a, 2. A second integer b" but lists only two items (a and b), not three. The third argument is a hardcoded `const int c { 99 }`. This is correct but the prompt's "Three integers on separate lines" is misleading -- only 2 are read from stdin.
- **Verdict:** PASS -- minor prompt clarity issue.

**Exercise 2: "Temperature Converter with Const References"**
- **Code quality:** Compiles. Output formatting with `std::fixed` and `std::setprecision(2)` is correct.
- **Test cases:** 3 cases. Checked:
  - 0C -> 32F, 273.15K: correct
  - 100C -> 212F, 373.15K: correct
  - -40C -> -40F, 233.15K: correct
- **Design note:** `const double&` parameter for a `double` is not idiomatic (doubles should be passed by value). The exercise intentionally uses it to demonstrate that const refs work with rvalues. The summary correctly notes this preference for small types -- the exercise should acknowledge it's a teaching exercise rather than real-world style.
- **Verdict:** PASS

---

### 12.5 — Pass by Lvalue Reference

**Summary:** Accurate. Correctly covers when to prefer pass-by-reference vs pass-by-value. The output parameter pattern is mentioned with appropriate caveats.

**Exercise 1: "Double In Place"**
- **Code quality:** Compiles. Trivial and correct.
- **Test cases:** 3 cases (positive, zero, negative). All correct.
- **Verdict:** PASS

**Exercise 2: "Clamp and Report"**
- **Code quality:** Compiles. Logic is correct.
- **Test cases:** 3 cases covering below, above, and in-range. All correct.
- **Design:** Good exercise combining const and non-const reference parameters.
- **Verdict:** PASS

---

### 12.6 — Pass by const Lvalue Reference

**Summary:** Accurate. Good decision-rule table. Correctly notes the danger of returning const ref to a local.

**Exercise 1: "Word Length Classifier via const Reference"**
- **Code quality:** Compiles. Correct logic with `word.size()`.
- **Test cases:** 3 cases.
  - "hello" (5 chars) -> medium: correct
  - "a" (1 char) -> short: correct
  - "beautiful" (9 chars) -> long: correct
- **Verdict:** PASS

**Exercise 2: "Sentence Statistics with const Reference Parameters"**
- **Code quality:** Compiles. Uses `std::istringstream` which is appropriate.
- **Test cases:** 3 cases.
  - "the quick brown" -> Words: 3, Longest: 5 ("quick" or "brown" both 5 chars): correct
  - "hello" -> Words: 1, Longest: 5: correct
  - "i love programming in cpp" -> Words: 5, Longest: 11 ("programming"): correct
- **Verdict:** PASS

---

### 12.7 — Introduction to Pointers

**Summary:** Accurate. Correctly covers address-of, pointer types, dereference, pointers vs references table, pointer assignment semantics, null pointers preview.

**Exercise 1: "Pointer Inspector"**
- **Code quality:** Compiles. Correct output.
- **Test cases:** 3 cases. All correct.
- **Verdict:** PASS

**Exercise 2: "Swap via Pointers"**
- **Code quality:** Compiles. Correct swap.
- **Test cases:** 3 cases. All correct.
- **Note:** This is essentially the same exercise as 12.1 exercise 2 and 12.3 exercise 1 (swap), but with pointers. The concept is appropriately placed here, but it's the THIRD swap exercise in the chapter.
- **Verdict:** PASS (but swap fatigue is a progression concern -- see below)

---

### 12.8 — Null Pointers

**Summary:** Accurate. Correctly covers nullptr vs NULL vs 0, undefined behavior on null dereference, boolean conversion, initialization discipline.

**Exercise 1: "Safe pointer dereference"**
- **Code quality:** Compiles. Correct logic.
- **Test cases:** 3 cases (positive, zero, negative). All correct.
- **Verdict:** PASS

**Exercise 2: "Pointer-based linear search"**
- **Code quality:** Compiles. Correct linear search returning `const int*`.
- **Test cases:** 3 cases including first-element match. All correct.
- **Verdict:** PASS

---

### 12.9 — Pointers and const

**Summary:** Accurate. Good "read the declaration" guidance. Correctly distinguishes top-level vs low-level const.

**Exercise 1: "Read-only pointer inspector"**
- **Code quality:** Compiles.
- **Test cases:** 3 cases. All correct.
- **Design note:** The exercise prompt says "Also declare a `int* const` pointer initialised to a local `int`, write through it, then print the result." The solution declares `int* const pb { &b }` and prints `*pb` but does not actually write through the pointer -- it just prints the value that was already there. The prompt implies a write should happen (e.g., `*pb = someNewValue`). Minor inconsistency.
- **Verdict:** PASS with minor prompt-to-solution mismatch.

**Exercise 2: "Const pointer array scanner"**
- **Code quality:** Compiles. Correct max-finding with pointer arithmetic.
- **Test cases:** 3 cases including all-negative array. All correct.
- **Verdict:** PASS

---

### 12.10 — Pass by Address

**Summary:** Accurate. Good comparison with pass-by-reference. Correctly advises preferring references for non-nullable args.

**Exercise 1: "Clamp Value via Pointer"**
- **Code quality:** Compiles. Correct clamping logic with null guard.
- **Test cases:** 3 cases. All correct.
- **Note:** This is the THIRD clamp exercise in the chapter (after 12.5 ex2 and 12.13 ex1). See progression concerns.
- **Verdict:** PASS

**Exercise 2: "Swap and Scale via Pointers"**
- **Code quality:** Compiles. Solution uses `int tmp = *a;` (copy initialization) instead of the brace-initialization style used elsewhere. Inconsistent but valid.
- **Test cases:** 3 cases including zero factor. All correct.
- **Verdict:** PASS

---

### 12.11 — Pass by Address (Part 2)

**Summary:** Accurate. Correctly covers nullptr as optional sentinel, pass by const address, decision rule for address vs reference.

**Exercise 1: "Optional Middle Name"**
- **Code quality:** Compiles. Correct nullptr-based optional logic.
- **Starter code bug:** The else branch passes `nullptr` as the middle name instead of `&middleInput`. The comment says `/* TODO: pass address of middleInput */` but the actual code has `nullptr`. This means a student who only fills in the TODO comment location would get the wrong behavior. However, the intent is clearly for the student to replace `nullptr` with `&middleInput`.
- **Test cases:** 3 cases. All correct.
- **Verdict:** PASS -- the starter code's placeholder is slightly misleading but the TODO comment makes the intent clear.

**Exercise 2: "Find and Describe an Element"**
- **Forward reference:** Uses `std::vector<int>` with `.data()`, range-for, and constructor `std::vector<int> arr(n)`. Vectors are Ch 16/17 material.
- **Code quality:** Solution compiles and is correct.
- **Test cases:** 3 cases. All correct.
- **Verdict:** FAIL -- must replace `std::vector` with a plain `int arr[20]` or similar fixed-size buffer pattern.

---

### 12.12 — Return by Reference and Return by Address

**Summary:** Accurate. Correctly identifies safe objects to return by reference. The `std::vector` example in the summary is a forward reference but acceptable as an illustrative code comment.

**Factual note:** Summary mentions `std::optional<std::reference_wrapper<T>>` which is accurate C++17 but quite advanced for this chapter level. Not an error but may confuse students.

**Exercise 1: "Safe Reference Returns from a Static Cache"**
- **Code quality:** Compiles. Correct static-variable pattern.
- **Test case issue:** Expected stdout values lack trailing newlines on individual entries. Specifically:
  - Test 1 expects: `"positive\nnegative\nzero"` (no trailing newline after "zero")
  - Test 2 expects: `"positive\npositive\npositive"` (no trailing newline)
  - Test 3 expects: `"negative\nzero\npositive\nzero\nnegative"` (no trailing newline)
  - But the solution prints `getLabel(n) << '\n'` which DOES produce a trailing newline.
  - The expected stdout LACKS the final `\n`. This will cause **all test cases to fail** because the solution outputs a trailing newline that the expected output doesn't include.
- **Verdict:** **FAIL** -- test case expected_stdout values are missing trailing newlines. The solution produces `"positive\nnegative\nzero\n"` but the test expects `"positive\nnegative\nzero"`.

**Exercise 2: "Find Element by Address with Null Sentinel"**
- **Forward reference:** Uses `std::vector<int>` extensively.
- **Test case issue:** Same trailing newline problem:
  - Test 1 expects: `"found: 20\nnot found\nfound: 10"` -- missing trailing `\n`
  - Test 2 expects: `"found: 7\nfound: 1"` -- missing trailing `\n`
  - Test 3 expects: `"found: 42\nnot found\nnot found"` -- missing trailing `\n`
  - Solution prints `'\n'` after each line, so the last line has a trailing newline.
- **Code quality:** Otherwise compiles and is correct.
- **Verdict:** **FAIL** -- forward reference to std::vector AND missing trailing newlines in expected output.

---

### 12.13 — In and Out Parameters

**Summary:** Accurate. Good direction taxonomy (in, out, in-out). Correctly advises preferring return values over out parameters.

**Exercise 1: "Clamp with an in-out parameter"**
- **Code quality:** Compiles. Correct.
- **Test cases:** 3 cases. All correct.
- **Note:** Fourth time a clamp exercise appears in this chapter (after 12.5 ex2, 12.10 ex1, and now this). See progression concerns.
- **Verdict:** PASS

**Exercise 2: "Split a sentence into word count and longest word"**
- **Code quality:** Compiles. Correct use of `std::istringstream`.
- **Test cases:** 3 cases. All correct.
- **Note:** Very similar to 12.6 exercise 2 ("Sentence Statistics") -- both parse sentences into word counts and longest words. The difference is the parameter pattern (return values vs out parameters). The conceptual overlap is intentional but worth noting.
- **Verdict:** PASS

---

### 12.14 — Type Deduction with Pointers, References, and const

**Summary:** Accurate. Good coverage of auto dropping references and top-level const, auto* for pointers, decltype preserving everything.

**Exercise 1: "Deduction Detective"**
- **Code quality:** Compiles.
- **Test case concern:** All tests expect `sizeof(a)` = 4. This assumes `sizeof(int) == 4`, which is true on all common platforms but is technically implementation-defined. On Judge0 with standard x86-64 Linux, this will be 4.
- **Test cases:** 3 cases. All correct assuming 4-byte int.
- **Verdict:** PASS (with platform assumption noted)

**Exercise 2: "Pointer Inspector"**
- **Code quality:** Compiles. Correct use of auto* and decltype.
- **Starter code clutter:** The starter code has a confusing commented-out const_cast discussion and multiple approaches. The solution simplifies this properly.
- **Test cases:** 3 cases. All correct.
- **Verdict:** PASS

---

### 12.15 — std::optional

**Summary:** Accurate. Correctly covers construction, checking, value_or, and comparison with pointer-as-optional. Correctly notes std::optional cannot hold references.

**Factual concern:** The `parse_positive` example in the summary has a subtle bug: for input `"0"`, the loop completes with `n=0`, then the ternary `(n > 0) ? n : std::nullopt` returns nullopt. But for input `"00"`, it also returns nullopt (n=0). This is arguably correct behavior since 0 is not positive, but the function name `parse_positive` suggests it should reject non-positive values. Actually, there's another issue: for the empty string `""`, the for loop doesn't execute and `n` remains 0, returning nullopt. This is actually correct behavior. The function is fine.

**Exercise 1: "Safe integer division"**
- **Code quality:** Compiles. Correct.
- **Test cases:** 3 cases including division by zero and negative dividend. All correct.
- **Verdict:** PASS

**Exercise 2: "Find first element matching a predicate"**
- **Forward reference:** Uses `std::vector<int>`.
- **Title mismatch:** Title says "matching a predicate" but the exercise just searches for a target value (equality check), not a predicate/lambda. Minor naming issue.
- **Code quality:** Compiles. Correct.
- **Test cases:** 3 cases. All correct.
- **Verdict:** FAIL -- forward reference to std::vector. Also, exercise title is misleading (no predicate is used).

---

### 12.x — Chapter 12 Summary and Quiz

**Summary:** Accurate. Good consolidated recap of all concepts.

**Exercise 1: "Swap and Inspect via References and Pointers"**
- **Code quality:** Compiles. Correct.
- **Test cases:** 3 cases. Let me verify the "larger" logic after swap:
  - Input `3 7`: After swap x=7, y=3. `largerPtr(&x, &y)` returns pointer to x (7). Output: "Larger value: 7". Correct.
  - Input `10 2`: After swap x=2, y=10. `largerPtr(&x, &y)` returns pointer to y (10). Output: "Larger value: 10". Correct.
  - Input `5 5`: After swap x=5, y=5. `largerPtr(&x, &y)` returns p (x=5) since `*p >= *q`. Output: "Larger value: 5". Correct.
- **Verdict:** PASS

**Exercise 2: "Const-Correct Statistics"**
- **Code quality:** Compiles. Correct implementations.
- **Test case verification:**
  - `[1, 5, 3]`: avg = 3.0, max = 5. After *2: `[2, 10, 6]`, avg = 6.0, max = 10. Correct.
  - `[7]`: avg = 7.0, max = 7. After *2: `[14]`, avg = 14.0, max = 14. Correct.
  - `[4, 2, 9, 1, 6]`: avg = 22/5 = 4.4, max = 9. After *2: `[8, 4, 18, 2, 12]`, avg = 44/5 = 8.8, max = 18. Correct.
- **Design note:** `maxElement` returns `const int&` from a function that receives `const int*`. The returned reference aliases an element in the caller's stack array. This is safe because the caller owns the array. Good pattern demonstration.
- **Verdict:** PASS

---

## Exercise Progression Concerns

### Swap Exercise Fatigue

The "swap two values" exercise appears **5 times** across the chapter:

1. **12.1 ex2** — Swap via Pointer Parameters (forward reference!)
2. **12.2 ex2** — Swap using lvalue references (sort three values)
3. **12.3 ex1** — Reference Swap (print before/after)
4. **12.7 ex2** — Swap via Pointers (print before/after)
5. **12.10 ex2** — Swap and Scale via Pointers

While each exercises a different mechanism, the conceptual repetition is extreme. Recommend collapsing to 3 at most: one reference swap, one pointer swap, and one combined exercise.

### Clamp Exercise Fatigue

The "clamp a value into a range" exercise appears **3 times**:

1. **12.5 ex2** — Clamp and Report (reference, with status message)
2. **12.10 ex1** — Clamp Value via Pointer
3. **12.13 ex1** — Clamp with in-out parameter (reference)

Exercises 12.5 ex2 and 12.13 ex1 are nearly identical in function signature and logic. Recommend replacing one with a different problem.

### Linear Search Repetition

Finding an element in an array appears **4 times**:

1. **12.8 ex2** — Pointer-based linear search (returns `const int*`)
2. **12.11 ex2** — Find and Describe an Element (returns `const int*`, uses vector)
3. **12.12 ex2** — Find Element by Address with Null Sentinel (returns `const int*`, uses vector)
4. **12.15 ex2** — Find first element matching a predicate (returns `std::optional<int>`, uses vector)

The variation in return type (pointer vs optional) is pedagogically useful, but the core problem is identical each time.

---

## Factual Errors

| Location | Issue | Severity |
|---|---|---|
| **12.4 summary** | "Lifetime extension only applies to direct binding." -- Correct. | OK |
| **12.7 summary** | Correctly states "Dereferencing a null pointer is undefined behavior." | OK |
| **12.8 summary** | Correctly distinguishes nullptr from NULL from 0. | OK |
| **12.9 summary** | "Top-level const is dropped when copying a value; low-level const is not." -- Correct. | OK |
| **12.14 summary** | "`auto&&` gives a forwarding reference (deduced as lvalue ref for lvalues, rvalue ref for rvalues)." -- Technically, `auto&&` is a universal/forwarding reference, correct in this context. | OK |
| **12.15 summary** | "std::optional cannot hold references" -- Correct. | OK |

**No factual errors found in the summaries.**

---

## Test Case Issues

| Exercise | Issue | Severity |
|---|---|---|
| **12.12 ex1** ("Safe Reference Returns") | Expected stdout missing trailing `\n`. Solution outputs trailing newline, tests will fail. | **CRITICAL** |
| **12.12 ex2** ("Find Element by Address") | Expected stdout missing trailing `\n`. Same issue. | **CRITICAL** |
| **12.14 ex1** ("Deduction Detective") | Assumes `sizeof(int) == 4`. True on Judge0 x86-64 but technically platform-dependent. | **LOW** |

---

## Code Quality Summary

All 32 exercises compile correctly (verified by manual review of syntax). No missing includes, no undefined behavior in solution code, no use of uninitialized variables. Brace initialization (`{}`) is used consistently.

One minor style inconsistency: 12.10 ex2 solution uses `int tmp = *a;` (copy initialization) while all other exercises use `int tmp { *a };` (brace initialization).

---

## Critical/High Findings Summary

| # | Lesson | Finding | Severity | Recommendation |
|---|---|---|---|---|
| 1 | 12.1 ex1 | Uses pointer declaration, dereference, nullptr -- taught in 12.7-12.8 | **HIGH** | Replace with reference-only exercise |
| 2 | 12.1 ex2 | Entire exercise uses pointers -- identical to 12.7 ex2 | **HIGH** | Remove or replace with reference exercise |
| 3 | 12.11 ex2 | Uses `std::vector` (Ch 16/17 material) | **HIGH** | Replace with `int arr[20]` pattern |
| 4 | 12.12 ex2 | Uses `std::vector` (Ch 16/17 material) | **HIGH** | Replace with `int arr[20]` pattern |
| 5 | 12.15 ex2 | Uses `std::vector` (Ch 16/17 material) | **HIGH** | Replace with `int arr[20]` pattern |
| 6 | 12.12 ex1 | All 3 test cases missing trailing `\n` -- tests will FAIL | **CRITICAL** | Add `\n` to end of each expected_stdout |
| 7 | 12.12 ex2 | All 3 test cases missing trailing `\n` -- tests will FAIL | **CRITICAL** | Add `\n` to end of each expected_stdout |

**Total exercises:** 32 (2 per lesson x 16 lessons)
**PASS:** 23
**FAIL:** 7 (2 critical test failures, 2 forward-ref to pointers, 3 forward-ref to vectors)
**PASS with caveats:** 2 (12.3 ex2 prompt wording, 12.9 ex1 prompt-solution mismatch)
