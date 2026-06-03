# Chapter 16 Audit: Dynamic arrays: std::vector

Audited: 2026-06-03
Lessons: 12 (16.1 through 16.x)
Exercises: 22 (2 per lesson)

---

## Lesson 16.1 — Introduction to containers and arrays

### Summary audit

- **Forward reference (minor):** Summary mentions `std::array<T, N>` by name with syntax and says "Prefer over C-style arrays when the size is known at compile time." `std::array` is a Ch 17 topic. The brief mention as a contrast is borderline acceptable for context, but it goes too far by recommending it as a preferred alternative and showing its template signature. Students may try to use it before it is taught.
  - **Recommendation:** Mention that `std::array` exists but explicitly say "covered in the next chapter." Remove the recommendation to prefer it; keep the focus on `std::vector`.
- **Forward reference (minor):** "C-style arrays (`int arr[5]`)" shown with syntax. C-style arrays are Ch 17. Same recommendation: name them but defer details.
- No factual errors. The `std::vector` description and code example are correct.

### Exercise 16.1.1 — Vector Inventory

- **Code quality:** PASS. Solution compiles, uses `std::vector<int>`, range-for, `.size()`, `.front()`, `.back()`.
- **Test cases:** PASS. 3 cases cover multi-element, single-element, and negative values. Expected outputs match solution behavior.
- **Forward references:** None.
- **Progression:** Good introductory exercise.

### Exercise 16.1.2 — Running Total Reporter

- **Code quality:** PASS. Solution compiles, uses index-based access, integer division for average.
- **Test cases:** PASS. 3 cases cover multi-element, single-element, and truncation. Expected outputs verified.
- **Forward references:** None.
- **Progression:** Appropriate complexity step up from 16.1.1.

---

## Lesson 16.2 — Introduction to std::vector and list constructors

### Summary audit

- **Factual accuracy:** PASS. Correctly explains size constructor vs. list initialization disambiguation (`(3)` vs. `{3}`), CTAD, and key members.
- **Forward references:** None.
- No issues.

### Exercise 16.2.1 — Vector Construction Sampler

- **Code quality:** PASS. Solution compiles and produces correct output.
- **Test case issue (MEDIUM):** All three test cases have identical expected output and identical (empty) stdin. The second and third test cases labeled "Size of vectors correct" and "No trailing spaces" add zero additional coverage. They are effectively duplicates. This is wasted testing opportunity.
  - **Recommendation:** Replace at least one with a variant (e.g., a test that verifies no extra whitespace by strict byte comparison, or add an input-driven variant).
- **Forward references:** None.
- **Trailing space inconsistency:** Exercise 16.1.1 requires a trailing space; this exercise requires NO trailing space. The inconsistency could confuse students. Both patterns are common, but within the same chapter the convention should be consistent.

### Exercise 16.2.2 — Grade Tracker

- **Code quality:** PASS. Solution compiles. Uses `static_cast<std::size_t>(n)` for the size constructor, which is good practice.
- **Test cases:** PASS. 3 cases: mixed with one failing, all passing, single failing. Correct expected outputs.
- **Forward references:** None.
- **Progression:** Good step up, combines construction style with traversal.

---

## Lesson 16.3 — std::vector and the unsigned length and subscript problem

### Summary audit

- **Factual accuracy:** Mostly correct. The summary uses `std::print` from `<print>` which is C++23. This is a forward reference to a feature not in the C++20 standard students are compiling against (build commands show `-std=c++20`).
  - **Recommendation:** Replace `std::print` usage in the summary with `std::cout` to match the C++20 target.
- **Forward references:** The `0z` literal suffix is mentioned. This is a C++23 `size_t` literal suffix (`uz`/`z`). Students on C++20 cannot use it.
  - **Recommendation:** Remove or note it is C++23.
- The explanation of `std::ssize()` (C++20) is correct and appropriate.

### Exercise 16.3.1 — Safe reverse traversal with std::ssize

- **Code quality:** PASS. Solution uses `std::ssize(v) - 1` and `static_cast<std::size_t>(i)` for indexing.
- **Potential compile warning:** The starter code uses `std::vector<int> v(n)` where `n` is `int`. This triggers a signed-to-unsigned conversion warning with `-Wsign-conversion`. The irony: an exercise about signed/unsigned safety starts with an unsafe conversion in the starter code.
  - **Recommendation:** Use `std::vector<int> v(static_cast<std::size_t>(n))` in the starter code, consistent with other exercises.
- **Test cases:** PASS. 3 cases: three elements, empty vector (key edge case), single element. Correct.
- **Forward references:** None.

### Exercise 16.3.2 — Find the last element below a threshold

- **Code quality:** PASS. Solution logic is correct.
- **Same starter code warning** as 16.3.1: `std::vector<int> v(n)` without cast.
- **Test cases:** PASS. 3 cases cover: found in middle, none found, all qualify (last wins). Correct.
- **Forward references:** None.
- **Progression:** Good escalation from pure reversal to reverse search.

---

## Lesson 16.4 — Passing std::vector

### Summary audit

- **Factual accuracy:** PASS. Correct explanation of pass-by-const-ref, by-ref, by-value, NRVO.
- **Forward references:** None.
- Uses `std::accumulate` from `<numeric>` in the example, which is fine (it is a standard library function, not a chapter-gated concept).

### Exercise 16.4.1 — Sum of Even Elements

- **Code quality:** PASS. Clean solution, correct parameter type.
- **Test cases:** PASS. 3 cases: mixed positive, negatives and zero, empty vector. The hidden negatives test is good. Output verified correct.
- **Forward references:** None.

### Exercise 16.4.2 — Normalise and Report

- **Code quality:** PASS. Solution uses `std::max_element` from `<algorithm>`.
- **Factual concern (MINOR):** The solution uses `*std::max_element(v.begin(), v.end())` on a potentially empty vector (the prompt says n >= 1, so it's safe, but the function itself has no guard). Since the prompt guarantees n >= 1, this is acceptable.
- **Test cases:** PASS. 3 cases: basic normalisation, single element, all-same values. Correct outputs verified.
- **Forward references:** None.
- **Progression:** Good combination of const-ref and non-const-ref parameters.

---

## Lesson 16.5 — Returning std::vector, and an introduction to move semantics

### Summary audit

- **Factual accuracy:** PASS. Correct explanation of RVO, NRVO, guaranteed copy elision (C++17), and move semantics as fallback. Correctly warns against `return std::move(v)`.
- **Forward references:** The audit checklist notes "lesson 16.5 previews move semantics but exercises shouldn't require full understanding." The summary keeps it conceptual (no rvalue references, no `&&` syntax, no custom move constructors). This is appropriate.
- No issues.

### Exercise 16.5.1 — Return a filtered vector

- **Code quality:** PASS. Uses `push_back` in a filter function, returns by value. Clean.
- **Test cases:** PASS. 3 cases: mixed, all negative (empty output), all positive. Correct.
- **Forward references:** None.
- **Note:** Uses `std::istringstream` and `std::getline` for input parsing. These are from `<sstream>` and `<string>` which were introduced in Ch 5. Appropriate.

### Exercise 16.5.2 — Running totals via returned vector

- **Code quality:** PASS. Clean prefix-sum implementation with `reserve`.
- **Test cases:** PASS. 3 cases: four elements, zero elements (empty), mixed negative/positive. Correct.
- **Forward references:** None.
- **Progression:** Good escalation. Builds on prior running-sum concept with return-by-value.

---

## Lesson 16.6 — Arrays and loops

### Summary audit

- **Factual accuracy:** PASS. Covers index-based loops, off-by-one errors, range-for, accumulation and search patterns. All correct.
- **Forward references:** None.
- Mentions `std::optional<std::size_t>` as a return type for "not found" — `std::optional` was covered in lesson 12.15, so this is available. PASS.

### Exercise 16.6.1 — Sum and maximum of a vector

- **Code quality:** PASS. Correct use of index-based loop for sum and range-for for max.
- **Test cases:** PASS. 3 cases: basic positive, negative/positive mix, single element. Correct.
- **Forward references:** None.

### Exercise 16.6.2 — Linear search with pass-by-const-reference

- **Code quality:** PASS. Correct linear search with early return.
- **Test cases:** PASS. 3 cases: target in middle, not present, first element. Correct.
- **Forward references:** None.
- **Progression:** Good integration of function writing + search pattern + const ref.

---

## Lesson 16.7 — Arrays, loops, and sign challenge solutions

### Summary audit

- **Factual accuracy:** Mostly correct. Uses `std::print` and `std::println` from `<print>` (C++23) in the code examples. Same issue as lesson 16.3.
  - **Recommendation:** Replace with `std::cout` for C++20 compatibility.
- **Forward references:** None beyond the C++23 issue.
- Content is largely a recap/solutions companion to 16.3 and 16.6. Appropriate.

### Exercise 16.7.1 — Reverse Print with std::ssize

- **Code quality:** PASS. Solution uses `std::ssize(nums) - 1` correctly.
- **Test cases:** PASS. 3 cases: 5 elements, empty vector (prints only newline), single element. Correct.
- **Potential issue (MINOR):** The requirement says "do not cast to `size_t` anywhere in the loop." The solution does not cast. However, `nums[i]` where `i` is `ptrdiff_t` will produce a signed-to-unsigned conversion warning on strict compilers since `operator[]` takes `size_type` (unsigned). The requirement conflicts with reality slightly.
  - **Recommendation:** Either relax the "no cast" requirement or note that the implicit conversion is acceptable for `operator[]` here.
- **Forward references:** None.

### Exercise 16.7.2 — Running Sum Report

- **Code quality:** PASS. Clean forward iteration with `static_cast<int>(nums.size())`.
- **Test cases:** PASS. 3 cases: 4 elements, single element, all negatives. Correct.
- **Forward references:** None.
- **Redundancy concern (MEDIUM):** This exercise is very similar to 16.1.2 (Running Total Reporter) and 16.5.2 (Running totals via returned vector). Three running-sum exercises in one chapter is excessive.
  - **Recommendation:** Replace with a different pattern (e.g., pairwise differences, moving average, or count-of-conditions).

---

## Lesson 16.8 — Range-based for loops (for-each)

### Summary audit

- **Factual accuracy:** PASS. Correct coverage of range-for syntax, copy vs. reference, structured bindings, limitations.
- **Forward references:** None. Structured bindings (C++17) are available.
- No issues.

### Exercise 16.8.1 — Sum and Count with Range-for

- **Code quality:** PASS. Solution is clean.
- **Test case issue (BUG):** Expected outputs are missing trailing newlines.
  - Test case 1: `expected_stdout: "Sum: 15\nCount: 5"` -- no trailing `\n`.
  - Test case 2: `expected_stdout: "Sum: 42\nCount: 1"` -- no trailing `\n`.
  - Test case 3: `expected_stdout: "Sum: 10\nCount: 5"` -- no trailing `\n`.
  - The solution code prints `std::cout << "Count: " << static_cast<int>(nums.size()) << '\n';` which DOES produce a trailing newline.
  - **VERDICT: Expected stdout will NOT match actual solution output.** The solution outputs `"Sum: 15\nCount: 5\n"` but expected is `"Sum: 15\nCount: 5"`. This depends on whether the judge does exact string match or trims trailing whitespace. If exact: **all three test cases FAIL**.
  - **Recommendation:** Add `\n` to the end of each expected_stdout string.
- **Forward references:** None.

### Exercise 16.8.2 — Normalise and Report Scores

- **Code quality:** PASS. Clean solution using `auto&` for mutation and `const auto&` for read.
- **Test case issue (BUG):** Same missing trailing newline problem.
  - Test case 1: `"80 100 100\nMax: 100"` -- missing final `\n`. Solution outputs `"Max: 100\n"`.
  - Test case 2: `"60\nMax: 60"` -- missing `\n`.
  - Test case 3: `"0 0 0 0\nMax: 0"` -- missing `\n`.
  - **VERDICT: Same bug as 16.8.1. All test cases will fail on an exact-match judge.**
  - **Recommendation:** Add `\n` to the end of each expected_stdout string.
- **Forward references:** None.

---

## Lesson 16.9 — Array indexing and length using enumerators

### Summary audit

- **Factual accuracy:** PASS. Correct explanation of unscoped enums as indices, sentinel `count`, and the scoped enum cast problem.
- **Forward references:** None. Enums and scoped enums were covered in Ch 13.
- No issues.

### Exercise 16.9.1 — Player stat lookup with enum indices

- **Code quality:** PASS. Clean use of enum indices.
- **Test case issue (BUG):** Missing trailing newlines in expected_stdout.
  - Test case 1: `"HP: 100\nMP: 50\nAttack: 30\nDefense: 20\nSpeed: 15"` -- no final `\n`. Solution outputs `"Speed: 15\n"`.
  - Test case 2 and 3: Same problem.
  - **VERDICT: All test cases fail on exact match.**
  - **Recommendation:** Add `\n` to the end of each expected_stdout.
- **Forward references:** None.

### Exercise 16.9.2 — Season rainfall averages with enum indexing and loops

- **Code quality:** PASS. Clever use of a `month_season` mapping vector. Clean solution.
- **Test case issue (BUG):** Missing trailing newlines (same pattern).
  - All three test cases end without `\n`. Solution's last line outputs `'\n'`.
  - **VERDICT: All test cases fail on exact match.**
  - **Recommendation:** Add `\n` to end of each expected_stdout.
- **Test case 2 verification:**
  - Input: `10 20 40 50 60 80 90 85 55 45 30 15`
  - Winter = months 11,0,1 = 15+10+20 = 45 -> avg = 15.0. PASS.
  - Spring = months 2,3,4 = 40+50+60 = 150 -> avg = 50.0. PASS.
  - Summer = months 5,6,7 = 80+90+85 = 255 -> avg = 85.0. PASS.
  - Autumn = months 8,9,10 = 55+45+30 = 130 -> avg = 43.333... -> 43.3. PASS.
- **Forward references:** None.

---

## Lesson 16.10 — std::vector resizing and capacity

### Summary audit

- **Factual accuracy:** PASS. Correct distinction between size/capacity, resize/reserve, iterator invalidation, amortized O(1) push_back.
- **Forward references:** None.
- No issues.

### Exercise 16.10.1 — Reserve and Report

- **Code quality:** PASS. Solution demonstrates reserve, push_back, shrink_to_fit correctly.
- **Test case concern (MEDIUM):** The prompt says capacity after `shrink_to_fit` equals `n`. The C++ standard says `shrink_to_fit` is a **non-binding request** -- the implementation may ignore it. On some compilers/platforms, `shrink_to_fit` may not reduce capacity. The prompt acknowledges this implicitly by saying "since we reserve(n) and push n elements, no reallocation occurred, so all three capacity values equal n." This is correct logic: since capacity already equals size, shrink_to_fit has nothing to do. However, this makes the exercise somewhat pointless as a demonstration of `shrink_to_fit`.
  - **Recommendation:** Add a step that pushes fewer elements than reserved, THEN call `shrink_to_fit`, so the capacity change is actually observable. E.g., reserve(100), push_back 10 items, then shrink.
  - **Platform portability:** Even the current form should work on all major implementations since capacity == size means no change is needed. PASS for correctness.
- **Forward references:** None.

### Exercise 16.10.2 — Top-N Scores with resize

- **Code quality:** PASS. Uses `std::ranges::sort` with `std::greater<int>{}`, `resize`, and `reserve`.
- **`std::ranges::sort` availability:** This requires C++20 `<algorithm>` with ranges support. The project targets C++20 so this is fine. However, earlier exercises deliberately avoided `<algorithm>` utilities. The inconsistency is minor but notable.
- **Test cases:** PASS. 3 cases: keep top 3 from 5, keep all, keep top 1. Correct.
- **Forward references:** None.

---

## Lesson 16.11 — std::vector and stack behavior

### Summary audit

- **Factual accuracy:** PASS. Correct description of push_back, emplace_back, pop_back, back, empty. Correctly notes pop_back returns void.
- **Forward references:** None.
- Minor note: mentions `emplace_back` constructs in-place. This is correct. `emplace_back` was not formally taught in a prior lesson, but its use here as a vector method is within scope.
- No issues.

### Exercise 16.11.1 — Reverse a sequence of integers

- **Code quality:** PASS. Clean stack-based reversal.
- **Test cases:** PASS. 3 cases: 5 values, single element, negatives/zero. Correct.
- **Redundancy concern (MINOR):** This is the FOURTH reverse-print exercise in the chapter (16.3.1, 16.7.1, 16.11.1, and 16.x.2 also reverses). Excessive repetition.
  - **Recommendation:** Replace with a different stack application (e.g., balanced parentheses checker, postfix expression evaluator).
- **Forward references:** None.

### Exercise 16.11.2 — Undo stack for a running sum

- **Code quality:** PASS. Clean undo implementation.
- **Test cases:** PASS. 3 cases: mix of add/undo, undo on empty, negatives with multiple undos. Well-designed edge cases. Verified all expected outputs.
- **Forward references:** None.
- **Progression:** Excellent practical application of stack behavior. Best exercise design in the chapter.

---

## Lesson 16.12 — std::vector<bool>

### Summary audit

- **Factual accuracy:** PASS. Correctly explains the proxy reference problem, bit packing, and alternatives.
- **Forward references:** Mentions `std::bitset<N>` which is not formally taught in prior chapters. This is a brief mention as an alternative, not a teaching point. Acceptable.
- No issues.

### Exercise 16.12.1 — Proxy Reference Pitfall

- **Code quality:** PASS. Demonstrates the correct flip pattern `flags[i] = !flags[i]`.
- **Prompt clarity concern (MINOR):** The prompt says "Use `auto` to capture `v[i]` for each element and flip it" then immediately says "do NOT rely on `auto val = v[i]; val = !val;`". The instruction first tells students to use `auto` to capture, then tells them not to. This is confusing. The intent is to teach the pitfall, but the prompt reads as contradictory instructions rather than an educational demonstration.
  - **Recommendation:** Restructure: first ask students to try the `auto` capture approach (and observe it doesn't work), then ask them to fix it with direct assignment. Or simply remove the misleading first instruction.
- **Test cases:** PASS. 3 cases: three bits, all zeros, mixed five. Correct.
- **Forward references:** None.

### Exercise 16.12.2 — Bit Flags vs. Alternatives

- **Code quality:** PASS. Clean demonstration of vector<bool> vs. deque<bool>.
- **Test cases:** PASS. 3 cases: three bits, all true, all false. Correct. Verified:
  - "3\n1\n0\n1": vec true count = 2, deq true count = 2, after flip (false, true, false) -> 1. PASS.
  - "4\n1\n1\n1\n1": vec = 4, deq = 4, flipped (all false) -> 0. PASS.
  - "5\n0\n0\n0\n0\n0": vec = 0, deq = 0, flipped (all true) -> 5. PASS.
- **Forward references:** Uses `std::deque` from `<deque>`. Deque was not taught in prior chapters. However, the summary introduced it as an alternative, and the exercise is about demonstrating the difference. The student only needs to use push_back and range-for on it, which mirror vector usage. Acceptable.

---

## Lesson 16.x — Chapter 16 summary and quiz

### Summary audit

- **Factual accuracy:** PASS. Good chapter recap.
- **Forward references:** None.
- Uses `std::accumulate` in the example code. Fine.

### Exercise 16.x.1 — Filter and Sum via Const Reference

- **Code quality:** PASS. Clean function with range-for and const ref.
- **Test cases:** PASS. 3 cases: basic mix, nothing qualifies, negatives with threshold zero. Correct.
- **Forward references:** None.

### Exercise 16.x.2 — Build a Reversed Vector Using Stack Behavior

- **Code quality:** PASS. Clean stack-based reversal into a new vector returned by value.
- **Test cases:** PASS. 3 cases: five elements, single element, negatives. Correct.
- **Redundancy concern:** Fifth exercise involving reversal in the chapter (see 16.3.1, 16.7.1, 16.11.1, and this one). Over-represented pattern.
- **Forward references:** None.

---

## Summary of Findings

### BLOCKING (must fix before deploy)

| ID | Lesson | Issue |
|----|--------|-------|
| B1 | 16.8 ex1 | Missing trailing `\n` in all 3 expected_stdout strings. Solution output will not match. |
| B2 | 16.8 ex2 | Missing trailing `\n` in all 3 expected_stdout strings. Solution output will not match. |
| B3 | 16.9 ex1 | Missing trailing `\n` in all 3 expected_stdout strings. Solution output will not match. |
| B4 | 16.9 ex2 | Missing trailing `\n` in all 3 expected_stdout strings. Solution output will not match. |

Total: 12 test cases across 4 exercises will fail on exact-match judges.

### HIGH (should fix)

| ID | Lesson | Issue |
|----|--------|-------|
| H1 | 16.1 summary | Forward-references `std::array<T, N>` with syntax and "prefer" recommendation. Ch 17 topic. |
| H2 | 16.3 summary | Uses `std::print` (C++23) in code examples. Project targets C++20. |
| H3 | 16.7 summary | Uses `std::print`/`std::println` (C++23) in code examples. Project targets C++20. |
| H4 | 16.3 summary | Mentions `0z` literal suffix (C++23). Not available in C++20. |

### MEDIUM (recommended fix)

| ID | Lesson | Issue |
|----|--------|-------|
| M1 | 16.2 ex1 | All 3 test cases are identical. Zero additional coverage from cases 2 and 3. |
| M2 | 16.3 ex1 | Starter code `std::vector<int> v(n)` has signed-to-unsigned conversion (ironic for a signed/unsigned lesson). |
| M3 | 16.3 ex2 | Same starter code issue as M2. |
| M4 | 16.10 ex1 | `shrink_to_fit` demonstration is ineffective since capacity already equals size. |
| M5 | Chapter-wide | Five reverse-print exercises (16.3.1, 16.7.1, 16.11.1, 16.x.2, plus 16.5.2 partial). Excessive pattern repetition. |
| M6 | Chapter-wide | Three running-sum exercises (16.1.2, 16.5.2, 16.7.2). Excessive repetition. |
| M7 | Chapter-wide | Trailing-space convention inconsistent: 16.1 exercises require trailing space; 16.2+ exercises require no trailing space. |

### LOW (polish)

| ID | Lesson | Issue |
|----|--------|-------|
| L1 | 16.12 ex1 | Prompt gives contradictory instructions about using `auto` to capture. |
| L2 | 16.7 ex1 | Requirement "do not cast to size_t anywhere in the loop" conflicts with `operator[]` taking `size_type`. |
| L3 | 16.12 ex2 | Uses `std::deque` which was not formally taught. Acceptable in context but could confuse. |

### Exercise Progression Assessment

The chapter follows a reasonable difficulty curve:

1. **16.1** - Basic construction and access (easy)
2. **16.2** - Constructor variants (easy)
3. **16.3** - Signed/unsigned problem (medium)
4. **16.4** - Passing vectors to functions (medium)
5. **16.5** - Returning vectors (medium)
6. **16.6** - Loop patterns (medium)
7. **16.7** - Sign challenge solutions (medium, recap)
8. **16.8** - Range-for (easy-medium)
9. **16.9** - Enum indexing (medium)
10. **16.10** - Resize/capacity (medium)
11. **16.11** - Stack behavior (medium-hard)
12. **16.x** - Summary quiz (medium)

**Concern:** Lessons 16.6, 16.7, and 16.8 cover heavily overlapping ground (loops over vectors). Consider whether 16.7 adds enough unique content to justify being a separate lesson, or whether its exercises could be folded into 16.6 or 16.8.

### Forward Reference Scorecard

| Forbidden concept | Found in | Severity |
|---|---|---|
| `std::array` / C-style arrays (Ch 17) | 16.1 summary (syntax + recommendation) | HIGH |
| `std::print` / `std::println` (C++23) | 16.3 summary, 16.7 summary | HIGH |
| `0z` literal (C++23) | 16.3 summary | HIGH |
| Dynamic allocation (new/delete) Ch 19 | Not found | CLEAN |
| Smart pointers Ch 22 | Not found | CLEAN |
| Operator overloading Ch 21 | Not found | CLEAN |
| Inheritance Ch 24 | Not found | CLEAN |
| Move semantics deep dive Ch 22 | Not found (16.5 stays conceptual) | CLEAN |
| Internal ordering violations | Not found | CLEAN |

### Factual Error Scorecard

No factual errors found in any lesson summary or exercise. Iterator invalidation rules, vector behavior, copy elision, and move semantics descriptions are all accurate.
