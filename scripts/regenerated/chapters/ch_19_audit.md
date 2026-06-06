# Chapter 19 Audit: Dynamic Allocation

**Auditor:** Claude Opus 4.6
**Date:** 2025-06-05
**Lessons reviewed:** 19.1, 19.2, 19.3, 19.4, 19.5

## Prior-knowledge boundary

Students know through Chapter 18: all fundamental types, control flow, templates, references, pointers, pointer arithmetic, enums, structs, classes (constructors, destructors, access specifiers, friends, static members, `this`), `std::vector`, `std::array`, C-style arrays, iterators, standard algorithms (`std::sort`, `std::find`, `std::for_each`, etc.), `<chrono>` timing.

Students do NOT yet know: function pointers (Ch 20), lambdas (Ch 20), `std::function` (Ch 20), operator overloading beyond I/O for enums (Ch 21), move semantics (Ch 22), `std::move` (Ch 22), `std::unique_ptr` / `std::shared_ptr` / `std::weak_ptr` (Ch 22), inheritance (Ch 24), virtual functions (Ch 25).

---

## Lesson 19.1 — Dynamic memory allocation with new and delete

### Forward-reference violations
None found. The summary only uses `new`, `delete`, `nullptr`, pointers, `std::bad_alloc` (exception mention is brief and appropriate as a "for now" aside). No smart pointers recommended, no lambdas, no move semantics.

### Within-chapter ordering issues
None. This is the first lesson and introduces the foundational concepts.

### Code correctness
- **Summary code:** Correct. Allocates, prints, deletes, nullifies. No issues.
- **Exercise 1 ("Heap-Allocated Sum") solution:** Correct. Properly allocates, dereferences, deletes, nullifies, and checks.
- **Exercise 2 ("Dynamic Swap") solution:** Correct. Two allocations, value swap via temp, proper cleanup.

### Test case mismatches
- **Exercise 1:** All three test cases match the solution output. Verified.
- **Exercise 2:** All three test cases match the solution output. Verified.

### Pedagogical notes
- Clean lesson. No issues.

### Verdict: PASS

---

## Lesson 19.2 — Dynamically allocating arrays

### Forward-reference violations
- **Summary mentions `std::vector` as the preferred modern alternative.** This is acceptable -- `std::vector` was taught in Ch 16. No forward reference.
- No smart pointers, lambdas, move semantics, or operator overloading mentioned.

### Within-chapter ordering issues
None. Properly builds on 19.1 (`new`/`delete`) and extends to `new[]`/`delete[]`.

### Code correctness
- **Summary code:** Correct. Allocates `new int[count]{}`, reads, prints, `delete[]`.
- **Exercise 1 ("Dynamic Array Reversal") solution:** Correct. Uses `std::swap` from `<utility>` (known since Ch 16 at latest, used in sorting examples). Reversal logic with front/back indices is correct.
- **Exercise 2 ("Merge Two Dynamic Arrays") solution:** Correct. Standard merge algorithm, all three arrays properly deallocated.

### Test case mismatches
- **Exercise 1 ("Dynamic Array Reversal"):**
  - Test 1: `stdin "5\n10 20 30 40 50"` -> expected `"50 40 30 20 10 "`. Solution prints with trailing space. **Match.**
  - Test 2: `stdin "1\n42"` -> expected `"42 "`. **Match.**
  - Test 3: `stdin "6\n-3 7 0 15 -8 2"` -> expected `"2 -8 15 0 7 -3 "`. **Match.**
- **Exercise 2 ("Merge Two Dynamic Arrays"):**
  - Test 1: `stdin "3\n1 5 9\n4\n2 4 6 8"` -> expected `"1 2 4 5 6 8 9 "`. **Match.**
  - Test 2: `stdin "1\n50\n3\n10 20 30"` -> expected `"10 20 30 50 "`. **Match.**
  - Test 3: `stdin "4\n1 3 3 7\n3\n2 3 5"` -> expected `"1 2 3 3 3 5 7 "`. **Match.**

### Pedagogical notes
- The trailing-space output format is a common competitive-programming style. It is consistent across all test cases and the solution, so no mismatch, but students may find it unexpected. Minor style point, not a bug.

### Verdict: PASS

---

## Lesson 19.3 — Destructors

### Forward-reference violations
1. **ISSUE (minor, informational only):** The summary says "In Ch 15.4 you learned that a destructor is a special member function..." This is a valid back-reference to prior material (Ch 15.4 "Introduction to destructors"). No forward-reference issue.
2. **No smart pointers recommended.** Good -- that would be a Ch 22 forward reference.
3. **No move semantics, lambdas, or operator overloading.** Clean.

### Within-chapter ordering issues
None. Lesson 19.3 builds on 19.1 (`new`/`delete`) and 19.2 (`new[]`/`delete[]`), combining them with the previously-taught destructor concept to introduce RAII. Logical progression.

### Code correctness
- **Summary code (`IntArray` class):** Correct. Constructor allocates with `new int[size]{}`, destructor calls `delete[] m_data`. However, this class has an implicit copy constructor and copy assignment operator that would perform a shallow copy, leading to double-delete if the object is ever copied. The summary does not mention this. While the exercise doesn't trigger copying, this is a pedagogical concern.
  - **Severity: LOW.** The summary's scope is RAII/destructor basics. The shallow-copy problem is the topic of Ch 21 (rule of three) and Ch 22 (rule of five). Mentioning it here would be a forward reference. Acceptable to omit.
- **Exercise 1 ("RAII String Wrapper") solution:** Correct. `DynString` allocates `new char[size]{}`, destructor calls `delete[] m_data` and prints message. `set()` and `print()` are straightforward. Same shallow-copy caveat as above applies but is not triggered by the exercise.
- **Exercise 2 ("Reverse Destruction Order") solution:** Correct. Three `IntPool` objects created in order A, B, C; destructors fire in reverse order C, B, A.

### Test case mismatches
- **Exercise 1 ("RAII String Wrapper"):**
  - Test 1: `stdin "5\nH e l l o\n"` -> expected `"Stored: Hello\nDestroyed 5 chars\n"`. Solution: `print()` outputs characters with no separators, then main prints `\n`, then destructor prints `"Destroyed 5 chars\n"`. **Match.**
  - Test 2: `stdin "1\nX\n"` -> expected `"Stored: X\nDestroyed 1 chars\n"`. **Match.**
  - Test 3: `stdin "4\n1 2 3 4\n"` -> expected `"Stored: 1234\nDestroyed 4 chars\n"`. **Match.**
- **Exercise 2 ("Reverse Destruction Order"):**
  - Test 1: `stdin "3 5 2\n"` -> expected 6-line output. **Match.**
  - Test 2: `stdin "10 10 10\n"` -> **Match.**
  - Test 3: `stdin "1 1 1\n"` -> **Match.**

### Pedagogical notes
- The grammar "Destroyed 1 chars" (should be "char") is slightly ungrammatical but consistent across test cases. Very minor cosmetic point.

### Verdict: PASS

---

## Lesson 19.4 — Pointers to pointers and dynamic multidimensional arrays

### Forward-reference violations
1. **Summary mentions `std::vector<std::vector<int>>`** as a better alternative to deep pointer chains. This is acceptable -- `std::vector` is Ch 16 material and nesting it is a natural extension the student can understand. No forward reference.
2. No smart pointers, lambdas, move semantics, or operator overloading. Clean.

### Within-chapter ordering issues
None. Builds naturally on 19.1 (`new`/`delete`), 19.2 (`new[]`/`delete[]`), and general pointer knowledge from Ch 12 and Ch 17.

### Code correctness
- **Summary code:** Correct. Allocates `int**`, allocates each row, accesses `matrix[1][2]`, deallocates rows then pointer array. Clean.
- **Exercise 1 ("Build and Print a Dynamic 2D Array") solution:** Correct. Allocation, reading, printing, deallocation all proper. The printing uses `if (c > 0) std::cout << ' ';` to avoid trailing space, matching the expected output format (no trailing space per row).
- **Exercise 2 ("Transpose a Dynamic Matrix") solution:** Correct. Allocates original `R x C`, allocates transposed `C x R`, copies `transposed[c][r] = original[r][c]`, prints transposed, deallocates both. Same no-trailing-space print style.

### Test case mismatches
- **Exercise 1 ("Build and Print a Dynamic 2D Array"):**
  - Test 1: `stdin "2 3\n1 2 3\n4 5 6\n"` -> expected `"1 2 3\n4 5 6\n"`. Solution prints `1 2 3\n4 5 6\n` (space-separated, no trailing space). **Match.**
  - Test 2: `stdin "1 1\n42\n"` -> expected `"42\n"`. **Match.**
  - Test 3: `stdin "3 4\n10 -20 30 -40\n5 15 -25 35\n0 0 0 1\n"` -> expected `"10 -20 30 -40\n5 15 -25 35\n0 0 0 1\n"`. **Match.**
- **Exercise 2 ("Transpose a Dynamic Matrix"):**
  - Test 1: `stdin "2 3\n1 2 3\n4 5 6\n"` -> expected `"1 4\n2 5\n3 6\n"`. Transpose of `[[1,2,3],[4,5,6]]` is `[[1,4],[2,5],[3,6]]`. **Match.**
  - Test 2: `stdin "3 3\n1 0 0\n0 2 0\n0 0 3\n"` -> expected `"1 0 0\n0 2 0\n0 0 3\n"`. Diagonal matrix is its own transpose. **Match.**
  - Test 3: `stdin "4 2\n10 20\n30 40\n50 60\n70 80\n"` -> expected `"10 30 50 70\n20 40 60 80\n"`. Transpose of 4x2 is 2x4. **Match.**

### Pedagogical notes
- Solid lesson. Appropriate scope.

### Verdict: PASS

---

## Lesson 19.5 — Void pointers

### Forward-reference violations
1. **Summary mentions `std::variant`** as a modern alternative to `void*`: "Templates and `std::variant` provide type-safe alternatives for generic code." **`std::variant` has NOT been taught in any prior chapter** according to the curriculum reference. It is not listed in any chapter's "Introduces" section through Ch 19. This is a **forward reference** (or at minimum a reference to an untaught concept). Students will not know what `std::variant` is.
   - **Severity: MEDIUM.** It is a passing mention, not used in code, but it names a concept students cannot look up in prior lessons. Should be removed or replaced with "templates provide type-safe alternatives" (templates are Ch 11 material).
2. **Summary mentions `std::malloc`:** "e.g., `std::malloc` returns `void*`". `std::malloc` is a C library function. It has not been formally introduced in the curriculum. However, it is mentioned only as a real-world example of where `void*` appears, not as something students need to use. **Borderline acceptable** but could confuse students. Consider replacing with "C library functions like `malloc` return `void*`" without the `std::` prefix to make it clearer this is a C-ism.
3. **Summary mentions `qsort`:** "callback APIs like `qsort` pass `void*` context parameters." `qsort` is a C library function and also uses function pointers, which are Ch 20 material. Mentioning `qsort` by name could tempt students to look it up and encounter function pointers before they are taught.
   - **Severity: LOW-MEDIUM.** It is a brief mention and does not explain the API, but naming a function-pointer-based API is mildly problematic.
4. No smart pointers, lambdas, move semantics, inheritance, or virtual functions mentioned. Good.

### Within-chapter ordering issues
None. `void*` builds on all pointer knowledge from Ch 12, Ch 17, and Ch 19.1-19.4. Logical placement as the final lesson.

### Code correctness
- **Summary code:** Correct. Creates `int value{42}`, takes `void*` to it, passes to a function that `static_cast`s back to `int*`. Clean.
- **Exercise 1 ("Cast and Print via Void Pointer") solution:** Correct. Reads `int` and `double`, stores addresses in `void*`, casts back with `static_cast`, prints with `std::fixed` and `std::setprecision(2)`.
- **Exercise 2 ("Generic Swap Through Void Pointers") solution:** Correct. Casts `void*` to `char*`, swaps byte-by-byte. This is a classic low-level pattern. The approach is correct for swapping any trivially-copyable type of the same size.

### Test case mismatches
- **Exercise 1 ("Cast and Print via Void Pointer"):**
  - Test 1: `stdin "42\n3.14159"` -> expected `"int: 42\ndouble: 3.14\n"`. `std::setprecision(2)` with `std::fixed` on `3.14159` gives `3.14`. **Match.**
  - Test 2: `stdin "0\n0.0"` -> expected `"int: 0\ndouble: 0.00\n"`. **Match.**
  - Test 3: `stdin "-7\n-99.999"` -> expected `"int: -7\ndouble: -100.00\n"`. `std::fixed << std::setprecision(2)` on `-99.999` rounds to `-100.00`. **Match.**
- **Exercise 2 ("Generic Swap Through Void Pointers"):**
  - Test 1: `stdin "10 20"` -> expected `"Before: 10 20\nAfter: 20 10\n"`. **Match.**
  - Test 2: `stdin "5 5"` -> expected `"Before: 5 5\nAfter: 5 5\n"`. **Match.**
  - Test 3: `stdin "-42 1000"` -> expected `"Before: -42 1000\nAfter: 1000 -42\n"`. **Match.**

### Pedagogical notes
- The `swapBytes` exercise is excellent for understanding `void*` and byte-level memory manipulation.

### Verdict: PASS (with forward-reference fixes needed)

---

## Summary of all findings

### Forward-reference violations

| ID | Lesson | Severity | Description | Fix |
|----|--------|----------|-------------|-----|
| F1 | 19.5 | **MEDIUM** | Summary mentions `std::variant` as a modern alternative to `void*`. `std::variant` is never introduced in the curriculum (through Ch 25). | Remove `std::variant` mention. Replace with: "Templates provide type-safe alternatives for generic code." |
| F2 | 19.5 | **LOW-MEDIUM** | Summary mentions `qsort` by name. `qsort` is a C function-pointer-based API; function pointers are Ch 20 material. Students may look it up and encounter function pointers prematurely. | Replace `"callback APIs like qsort pass void* context parameters"` with a vaguer reference like `"some C library APIs use void* to pass generic data"`. |

### Within-chapter ordering issues

None found. The lesson sequence (19.1 single new/delete -> 19.2 array new[]/delete[] -> 19.3 destructors + RAII -> 19.4 pointer-to-pointer + 2D arrays -> 19.5 void pointers) is logical and each lesson builds on the previous ones.

### Code correctness issues

| ID | Lesson | Severity | Description |
|----|--------|----------|-------------|
| C1 | 19.3 | **INFO** | `IntArray` and `DynString` classes have compiler-generated copy constructors/assignment operators that would shallow-copy the raw pointer, causing double-delete if objects are ever copied. The exercises do not trigger this, and the rule of three is a Ch 21 topic. Mentioning it would itself be a forward reference. Acceptable as-is, but a comment like `// Note: copying this class is dangerous -- we'll address this in a later chapter` could be helpful. |
| C2 | 19.3 | **COSMETIC** | "Destroyed 1 chars" is ungrammatical (should be "char" for singular). All test cases consistently expect "chars" regardless of count, so this is a cosmetic issue, not a mismatch. |

### Test case mismatches

None found. All 20 test cases across all 10 exercises produce output matching the expected stdout when the solution code is run.

### Pedagogical notes (non-blocking)

| ID | Lesson | Note |
|----|--------|------|
| P1 | 19.2 | Exercises use trailing-space output format (`"50 40 30 20 10 "`), while 19.4 exercises use no-trailing-space format (`"1 2 3"`). Inconsistent style across the chapter. Consider standardizing. |
| P2 | 19.5 | Summary mentions `std::malloc` with `std::` prefix. Students have not been taught C memory allocation. The `std::` prefix may confuse students into thinking it is a C++ standard library feature they should know. Consider writing just `malloc` or `C's malloc`. |

### Overall assessment

**Chapter 19 is in good shape.** The content correctly covers dynamic allocation fundamentals without relying on post-Ch-19 concepts (with two exceptions in lesson 19.5's summary text). All exercise solutions are correct and all test cases match. The lesson ordering within the chapter is logical. Two forward-reference fixes are needed in lesson 19.5's summary, both in explanatory prose rather than in code or exercises.

**Required fixes: 2 (F1, F2)**
**Optional improvements: 4 (C1, C2, P1, P2)**
