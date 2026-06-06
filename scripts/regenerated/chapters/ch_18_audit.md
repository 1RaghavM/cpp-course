# Chapter 18 Audit: "Iterators and Algorithms"

## Audit Criteria
1. **Forward references** -- concepts NOT yet available in Ch 18:
   - Dynamic allocation `new`/`delete` (Ch 19)
   - Function pointers (`int (*fcnPtr)(int)`) (Ch 20) -- but implicit decay of a named function to a callable is borderline
   - Lambdas (`[](){}`) (Ch 20)
   - `std::function` (Ch 20)
   - Operator overloading (detailed, Ch 21) -- except I/O operator overloading previewed in Ch 13
   - Move semantics / smart pointers (Ch 22)
   - Inheritance (Ch 24) / virtual functions (Ch 25)
   - Note: all types, constants, strings, operators, control flow, templates, references, pointers, pointer arithmetic, enums, structs, classes, `std::vector`, `std::array`, C-style arrays, C-strings, `std::reference_wrapper` ARE available
2. **Lambda coverage gap** -- The curriculum reference says Ch 18 introduces "lambda usage with algorithms", `std::find_if`, `std::count_if`. Check whether the actual content delivers on this.
3. **Exercise progression, factual errors, test case correctness, code quality**

---

## Curriculum Reference vs. Actual Content Discrepancy

The curriculum reference (`curriculum_reference.md`) states Ch 18 introduces:
> `std::find_if`, `std::count_if`, `std::for_each`, `std::reduce`, **lambda usage with algorithms**

**Actual content delivered:**
- `std::find_if` -- NOT covered in any lesson summary or exercise
- `std::count_if` -- NOT covered in any lesson summary or exercise
- `std::reduce` -- NOT covered in any lesson summary or exercise
- **Lambda usage with algorithms** -- NOT covered. All exercises explicitly say "Do not use lambdas."
- `std::for_each` -- covered, but only with a named function (not with a lambda)

**Assessment:** The curriculum reference promises lambda introduction and predicate-based algorithms (`find_if`, `count_if`), but the actual lessons deliver none of this. This is a **significant content gap**. Either:
- (a) The curriculum reference needs updating to remove lambdas and predicate algorithms from Ch 18, or
- (b) The lessons need a section (likely in 18.3) that introduces basic lambda syntax for use with `std::find_if`/`std::count_if`, since students will need this before Ch 20 provides the full treatment.

**Severity: HIGH (curriculum promise not met).**

---

## Lesson 18.1 -- Sorting an array using selection sort

### Summary

- **PASS (no forward references).** The summary covers selection sort with C-style arrays, `std::swap` from `<utility>`, O(n^2) complexity, and stability. All concepts are available from prior chapters.
- **Factual accuracy:** Correct. The algorithm description, code example, and complexity analysis are accurate.
- **Code quality:** The example uses a C-style array with a separate `length` variable. This is fine given C-style arrays are covered in Ch 17. The note about `std::array` and `std::vector` being usable is appropriate.

### Exercise 1: "Selection Sort on Integer Array"

- **PASS (no forward references).** Uses a C-style array `int arr[20]{}`, `std::swap`, and basic loops. All within scope.
- **Code correctness:** Solution is correct. Selection sort implementation is standard.
- **Test case 1 (sample):** Input `5\n30 50 20 10 40` -> Expected `10 20 30 40 50 `. Verified correct.
- **Test case 2 (hidden):** Input `4\n1 2 3 4` -> Expected `1 2 3 4 `. Verified correct (already sorted, no swaps change anything).
- **Test case 3 (hidden):** Input `6\n9 7 5 5 3 1` -> Expected `1 3 5 5 7 9 `. Verified correct (duplicates handled, selection sort preserves duplicates).
- **ISSUE (edge case -- n=1):** When `n=1`, the outer loop condition `start < n - 1` becomes `start < 0`, so the loop body never executes. This is correct behavior. However, no test case covers `n=1`. **Severity: trivial** (the code is correct, just untested for the boundary).
- **ISSUE (output format):** The output has a trailing space after the last element (`"10 20 30 40 50 "`). This is consistent between the prompt ("with a trailing space after the last element"), the solution, and the expected output. Acceptable.

### Exercise 2: "Selection Sort a Vector of Structs by Field"

- **PASS (no forward references).** Uses `struct Student`, `std::vector<Student>`, `std::swap`. All within scope (structs from Ch 13, vectors from Ch 16).
- **Code correctness:** Solution is correct. Descending sort by finding the maximum in the unsorted region.
- **Test case 1 (sample):** Input `3\nAlice 85\nBob 92\nCarla 78` -> Expected `Bob 92\nAlice 85\nCarla 78\n`. Verified correct.
- **Test case 2 (hidden):** Input `1\nZara 100` -> Expected `Zara 100\n`. Verified correct (single student, no sort needed).
- **Test case 3 (hidden):** Input `4\nEve 99\nDan 75\nCal 60\nAmy 42` -> Expected `Eve 99\nDan 75\nCal 60\nAmy 42\n`. Verified correct (already sorted descending).
- **ISSUE (missing test for tied scores):** The prompt says "If two students have the same score, their relative order does not matter (any order is accepted)." However, no test case actually contains tied scores. This means this claim is untested. **Severity: low** (the claim is correct and the code works, but a tied-score test would add coverage).
- **Code quality:** Good. The starter code is well-scaffolded. The descending sort variant is a natural extension.

---

## Lesson 18.2 -- Introduction to iterators

### Summary

- **PASS (no forward references).** Covers `begin()`, `end()`, dereference (`*it`), increment (`++it`), comparison (`it != end`), free functions `std::begin()`/`std::end()`, and the connection to range-based for loops. All within scope.
- **Factual accuracy:** Correct. Good explanation of why iterators decouple traversal from storage.
- **Pedagogical quality:** Clear progression from index-based to iterator-based traversal. The "Why not just use indices?" section provides good motivation.

### Exercise 1: "Iterator Traversal Printer"

- **PASS (no forward references).** Uses `std::vector<int>`, `push_back`, and explicit iterator loops. All within scope.
- **ISSUE (starter code / solution mismatch on "Elements:" prefix):** The prompt says: "Line 1: `Elements:` followed by a space, then all elements separated by spaces". The starter code does NOT print "Elements:" -- it only has a `std::cout << '\n';` after the TODO section. The student must infer they need to print `"Elements:"` as part of the TODO. The solution does print `"Elements:"` correctly. This is workable but the starter code could be clearer by including `std::cout << "Elements:";` before the TODO. **Severity: low** (the prompt is clear enough, but the starter code scaffolding is slightly misleading).
- **Code correctness:** Solution is correct.
- **Test case 1 (sample):** Input `5\n10 20 30 40 50` -> Expected `Elements: 10 20 30 40 50\nSum: 150\n`. The solution prints `"Elements:"` then `' ' << *it` for each element. Output: `"Elements: 10 20 30 40 50\n"`. Verified correct.
- **Test case 2 (hidden):** Input `1\n42` -> Expected `Elements: 42\nSum: 42\n`. Output: `"Elements: 42\n"`. Verified correct.
- **Test case 3 (hidden):** Input `4\n-3 7 -1 5` -> Expected `Elements: -3 7 -1 5\nSum: 8\n`. Sum: -3+7-1+5 = 8. Verified correct.

### Exercise 2: "Iterator-Based Maximum Finder"

- **PASS (no forward references).** Uses `std::array<int, 6>`, explicit iterator loop, `static_cast<std::size_t>()`. All within scope.
- **Code correctness:** Solution is correct.
- **Test case 1 (sample):** Input `3 1 4 1 5 9` -> Expected `Max: 9\nPosition: 5\n`. Verified correct (9 is at index 5).
- **Test case 2 (hidden):** Input `100 20 30 40 50 60` -> Expected `Max: 100\nPosition: 0\n`. Verified correct.
- **Test case 3 (hidden):** Input `5 8 8 2 8 1` -> Expected `Max: 8\nPosition: 1\n`. Verified correct (first occurrence of 8 is at index 1, using strict `>` comparison).
- **ISSUE (includes `<cstddef>` but could use `int`):** The exercise uses `std::size_t` for `position` and requires `<cstddef>`. This is fine since `std::size_t` is covered in Ch 4.6, but using `int` would be simpler for the pedagogical context. **Severity: trivial** (not a bug, just a minor complexity).

---

## Lesson 18.3 -- Introduction to standard library algorithms

### Summary

- **PASS (no forward references in summary code).** The summary code uses `std::sort`, `std::find`, `std::accumulate` without lambdas or function pointers. All within scope.
- **ISSUE (passing a named function to `std::for_each`):** The summary mentions `std::for_each(begin, end, func)` and says "You pass a named function (or function pointer) as the third argument." Technically, passing a named function involves implicit decay to a function pointer. However, the student writes `std::for_each(v.begin(), v.end(), doubleValue)` where `doubleValue` is just a function name -- no function pointer syntax is needed. This is analogous to how `std::sort(begin, end, std::greater<int>{})` works with a functor. The implicit conversion is transparent to the student. **Severity: borderline-low.** The phrase "or function pointer" in the summary could confuse students since function pointers are Ch 20, but the usage pattern itself requires no function pointer knowledge.
- **ISSUE (summary mentions `std::sort` with "custom comparator function" but does not show how):** The summary says "For descending order you can pass a custom comparator function as a third argument" but provides no example. This is a teaser for Ch 20 (where lambdas and function pointers are taught). Students cannot actually sort descending with the knowledge available in Ch 18 alone, unless they use `std::greater<int>{}` (a functor from `<functional>`) -- but functors are not taught until Ch 21. **Severity: low** (it is just a mention, not a requirement, and the exercises only sort ascending).
- **ISSUE (missing algorithms promised by curriculum reference):** As noted in the top-level discrepancy section, `std::find_if`, `std::count_if`, `std::reduce`, and lambdas are listed in the curriculum reference but absent from this lesson. **Severity: HIGH (addressed above).**
- **Factual accuracy:** Everything stated is correct. `std::accumulate` in `<numeric>` is correctly noted.

### Exercise 1: "Sort, Search, and Summarize"

- **PASS (no forward references).** Uses `std::sort`, `std::min_element`, `std::accumulate`, `std::find`. All within scope. Explicitly says "Do not use lambdas."
- **Code correctness:** Solution is correct.
- **Test case 1 (sample):** Input `5\n3 1 4 1 5\n4` -> Expected `Sorted: 1 1 3 4 5\nMin: 1\nSum: 14\nFound 4: yes\n`.
  - After sort: `1 1 3 4 5`. Output: `"Sorted: 1 1 3 4 5"` (solution prints `"Sorted:"` then `' ' << val` for each). Correct.
  - Min: `*std::min_element(...)` = 1. Correct.
  - Sum: `std::accumulate(v.begin(), v.end(), 0)` = 1+1+3+4+5 = 14. Correct.
  - Find 4: found. Correct.
- **Test case 2 (hidden):** Input `4\n10 30 20 40\n25` -> Expected `Sorted: 10 20 30 40\nMin: 10\nSum: 100\nFound 25: no\n`.
  - After sort: `10 20 30 40`. Sum: 10+30+20+40 = 100. Find 25: not found. Verified correct.
- **Test case 3 (hidden):** Input `1\n7\n7` -> Expected `Sorted: 7\nMin: 7\nSum: 7\nFound 7: yes\n`. Verified correct.
- **Code quality:** Good. The solution cleanly demonstrates all four algorithms.

### Exercise 2: "Count and Extremes Report"

- **PASS (no forward references in core logic).** Uses `std::max_element`, `std::count`, `std::for_each` with a named function, `std::accumulate`. Explicitly says "Do not use lambdas."
- **ISSUE (passing named function to `std::for_each`):** As discussed above, `std::for_each(v.begin(), v.end(), doubleValue)` implicitly converts `doubleValue` to a function pointer. The student writes this naturally without needing function pointer syntax. **Severity: borderline-low** (same assessment as the summary).
- **Code correctness:** Solution is correct.
- **Test case 1 (sample):** Input `6 3\n3 1 3 2 3 4` -> Expected `Max: 4\nCount of 3: 3\nDouble sum: 32\n`.
  - Max: 4. Correct.
  - Count of 3: three 3s. Correct.
  - After doubling: `6 2 6 4 6 8`. Sum: 6+2+6+4+6+8 = 32. Correct.
- **Test case 2 (hidden):** Input `5 99\n10 20 30 40 50` -> Expected `Max: 50\nCount of 99: 0\nDouble sum: 300\n`.
  - Max: 50. Count of 99: 0. After doubling: `20 40 60 80 100`. Sum: 300. Verified correct.
- **Test case 3 (hidden):** Input `3 5\n5 5 5` -> Expected `Max: 5\nCount of 5: 3\nDouble sum: 30\n`.
  - Max: 5. Count of 5: 3. After doubling: `10 10 10`. Sum: 30. Verified correct.
- **ISSUE (order of operations matters):** The exercise computes `std::max_element` and `std::count` BEFORE calling `std::for_each(doubleValue)`, which mutates the vector. The solution does this correctly. However, if a student calls `std::for_each` first and then `std::max_element` or `std::count`, the results would be wrong (max would be doubled, count of `Q` would likely be 0 after doubling). The prompt says "Use `std::for_each` with `doubleValue` to double each element" and the ordering is implied by the output description ("the sum of every element after doubling"). The starter code TODO comments also suggest the correct ordering. **Severity: trivial** (not a bug, just noting a potential student pitfall that is well-guarded by the scaffolding).

---

## Lesson 18.4 -- Timing your code

### Summary

- **PASS (no forward references).** Covers `<chrono>`, `std::chrono::steady_clock`, `time_point`, `duration`, `duration_cast`, `.count()`, and benchmarking tips. All within scope (`<chrono>` was introduced in Ch 8 for random seeding; this lesson covers it in detail for timing).
- **Factual accuracy:** Correct. Good advice about preferring `steady_clock` over `high_resolution_clock`.
- **ISSUE (summary uses `steady_clock` but curriculum reference says `high_resolution_clock`):** The curriculum reference lists `std::chrono::high_resolution_clock` as introduced in Ch 18. The summary correctly recommends `steady_clock` instead and explains why `high_resolution_clock` may not be monotonic. This is not a conflict -- the summary teaches both and recommends the better one. **PASS.**

### Exercise 1: "Duration Conversion Calculator"

- **PASS (no forward references).** Uses `std::chrono::microseconds`, `duration_cast`, `.count()`. All within scope.
- **Code correctness:** Solution is correct.
- **Test case 1 (sample):** Input `3500000` -> Expected `3500000 us\n3500 ms\n3 s\n`.
  - 3500000 us -> 3500 ms (3500000 / 1000 = 3500). -> 3 s (3500000 / 1000000 = 3, truncated). Verified correct.
- **Test case 2 (hidden):** Input `123456789` -> Expected `123456789 us\n123456 ms\n123 s\n`.
  - 123456789 / 1000 = 123456 (truncated from 123456.789). 123456789 / 1000000 = 123 (truncated from 123.456789). Verified correct.
- **Test case 3 (hidden):** Input `999` -> Expected `999 us\n0 ms\n0 s\n`.
  - 999 / 1000 = 0 (truncated). 999 / 1000000 = 0. Verified correct.
- **Code quality:** Clean. Good exercise for `duration_cast` practice.

### Exercise 2: "Time Difference from Timestamps"

- **PASS (no forward references).** Uses `std::chrono::milliseconds`, duration arithmetic, `duration_cast`. All within scope.
- **Code correctness:** Solution is correct.
- **Test case 1 (sample):** Input `1000\n4500` -> Expected `Elapsed: 3500 ms\nElapsed: 3500000 us\nElapsed: 3 s\n`.
  - 4500 - 1000 = 3500 ms. 3500 * 1000 = 3500000 us. 3500 / 1000 = 3 s (truncated). Verified correct.
- **Test case 2 (hidden):** Input `0\n750` -> Expected `Elapsed: 750 ms\nElapsed: 750000 us\nElapsed: 0 s\n`.
  - 750 ms. 750000 us. 0 s (truncated from 0.75). Verified correct.
- **Test case 3 (hidden):** Input `5000\n5000` -> Expected `Elapsed: 0 ms\nElapsed: 0 us\nElapsed: 0 s\n`.
  - 0 everywhere. Verified correct.
- **Code quality:** Clean. Good demonstration of both implicit (ms -> us) and explicit (ms -> s) conversions.

---

## Summary of Findings

### HIGH Severity Issues

| # | Location | Issue |
|---|----------|-------|
| 1 | Curriculum reference vs. actual content | **Curriculum reference promises `std::find_if`, `std::count_if`, `std::reduce`, and "lambda usage with algorithms" in Ch 18, but none of these appear in any lesson summary or exercise.** This is a significant content gap. Students reaching Ch 20 (where lambdas are formally taught) will have missed the natural introduction point for predicate-based algorithms. Either the curriculum reference should be updated to remove these items from Ch 18, or lesson 18.3 needs additional content introducing basic lambda syntax and predicate algorithms. |

### MEDIUM Severity Issues

| # | Location | Issue |
|---|----------|-------|
| 1 | 18.3 Summary | The summary says `std::for_each(begin, end, func)` takes "a named function (or function pointer)" -- the phrase "function pointer" is a Ch 20 concept. While the student does not need to understand function pointer syntax to use `std::for_each` with a named function (the compiler handles the implicit decay), mentioning "function pointer" by name may confuse or prompt students to look up a concept they have not yet learned. Recommend removing the parenthetical and just saying "a named function." |
| 2 | 18.3 Summary | The summary says "For descending order you can pass a custom comparator function as a third argument" to `std::sort`, but provides no example and students have no way to implement this (lambdas are Ch 20, `std::greater<>{}` is not taught, function pointer syntax is Ch 20). This is a dangling promise. Recommend either removing the sentence or adding a brief note like "we will learn how to do this in a later chapter." |

### LOW Severity Issues

| # | Location | Issue |
|---|----------|-------|
| 1 | 18.1 Ex1 | No test case for `n=1` (single-element array). The code handles it correctly (`start < 0` means no iterations), but the edge case is untested. |
| 2 | 18.1 Ex2 | No test case with tied scores, despite the prompt saying "their relative order does not matter." Adding a tied-score test would confirm the claim. |
| 3 | 18.2 Ex1 | Starter code does not include the `"Elements:"` prefix -- students must infer from the prompt that they need to print it. The starter code's `std::cout << '\n';` line after the TODO could mislead students into thinking only the loop body needs filling in. |
| 4 | 18.2 Ex2 | Uses `std::size_t` and `<cstddef>` for the position variable where a plain `int` would be simpler and equally correct for a 6-element array. Minor pedagogical complexity. |

### PASS Items (No Issues Found)

| Lesson | Item | Status |
|--------|------|--------|
| 18.1 Summary | Selection sort, `std::swap`, O(n^2) | Clean, no forward references |
| 18.1 Ex1 | Selection sort on integer array | Code correct, test cases correct |
| 18.1 Ex2 | Selection sort on vector of structs | Code correct, test cases correct |
| 18.2 Summary | Iterator intro, `begin()`/`end()`, range-for connection | Clean, no forward references |
| 18.2 Ex1 | Iterator traversal printer | Code correct, test cases correct |
| 18.2 Ex2 | Iterator-based maximum finder | Code correct, test cases correct |
| 18.3 Ex1 | Sort, search, and summarize | Code correct, test cases correct, no lambdas |
| 18.3 Ex2 | Count and extremes report | Code correct, test cases correct, no lambdas |
| 18.4 Summary | `<chrono>` timing, `steady_clock`, `duration_cast` | Clean, no forward references |
| 18.4 Ex1 | Duration conversion calculator | Code correct, test cases correct |
| 18.4 Ex2 | Time difference from timestamps | Code correct, test cases correct |

---

## Forward Reference Summary

**Chapter 18 is remarkably clean on forward references.** Unlike many other chapters audited, there are:
- **Zero** uses of `new`/`delete` (Ch 19)
- **Zero** uses of lambdas (Ch 20)
- **Zero** uses of `std::function` (Ch 20)
- **Zero** uses of operator overloading beyond I/O (Ch 21)
- **Zero** uses of move semantics/smart pointers (Ch 22)
- **Zero** uses of inheritance/virtual functions (Ch 24/25)

The only borderline item is passing a named function to `std::for_each`, which uses implicit function-to-function-pointer decay. Students do not need to write or understand function pointer syntax for this. The solution code simply writes `doubleValue` as the third argument. This is acceptable.

## Lambda / Predicate Algorithm Gap Analysis

The most significant finding in this audit is not a forward-reference violation but a **content omission**. The curriculum reference explicitly lists "lambda usage with algorithms" and predicate-based algorithms (`std::find_if`, `std::count_if`) as Ch 18 material. The actual content avoids all of these, explicitly telling students "Do not use lambdas."

This creates a pedagogical gap: predicate-based algorithms are the most common use case for standard library algorithms in real C++ code, and Ch 18 is the natural place to introduce them alongside `<algorithm>`. Without them, the chapter teaches only the simplest value-based algorithms.

**Recommended resolution:** Either:
1. **Add a subsection to 18.3** (or a new lesson 18.3b) that introduces minimal lambda syntax -- just enough for `std::find_if` and `std::count_if` with simple predicates like `[](int x){ return x > 5; }`. This would align with the curriculum reference and give students the tool they need for practical algorithm usage. Ch 20 can then provide the full treatment (captures, mutable, generic lambdas, `std::function`).
2. **Update the curriculum reference** to move `std::find_if`, `std::count_if`, `std::reduce`, and lambda usage from Ch 18 to Ch 20, acknowledging that Ch 18 covers only non-predicate algorithms.

## Overall Chapter Assessment

Chapter 18 is **well-structured and nearly free of bugs**. The exercises are pedagogically sound, correctly scaffolded, and all test cases produce the expected output. The main issues are:
1. The curriculum reference / content mismatch regarding lambdas and predicate algorithms (HIGH).
2. Two summary statements that name-drop function pointers or tease custom comparators without providing the tools to use them (MEDIUM).
3. Minor test coverage gaps for edge cases (LOW).

No code correctness bugs were found. No test case mismatches were found. No compilation errors in any solution code.
