# Chapter 22 Audit: Move Semantics and Smart Pointers

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-05
**Source:** `ch_22.json` (8 lessons: 22.1 through 22.7, plus 22.x)

---

## Global Observations

### Forward-Reference Violations

| Location | Issue | Severity |
|---|---|---|
| None found | No references to inheritance (Ch 24), virtual functions (Ch 25), `std::initializer_list` (Ch 23), or object relationships/composition/aggregation (Ch 23). | **CLEAN** |

**Summary:** Chapter 22 is clean of forward-reference violations. All summaries and exercises rely exclusively on concepts from Chapters 0-21: dynamic allocation (`new`/`delete`), classes, destructors, copy constructors, copy assignment, operator overloading, `std::vector`, `std::string`, structs, C-style strings, function templates, and lambdas.

### Within-Chapter Ordering

| Lesson | Topic | Depends On | Order Correct? |
|---|---|---|---|
| 22.1 | Ownership motivation, smart pointer concept | Ch 19 (new/delete), Ch 21 (Rule of Three) | Yes |
| 22.2 | R-value references (`&&`) | Ch 12.2 (lvalues/rvalues) | Yes |
| 22.3 | Move constructors and move assignment | 22.2 (rvalue refs) | Yes |
| 22.4 | `std::move` | 22.2 (rvalue refs), 22.3 (move ctor/assign) | Yes |
| 22.5 | `std::unique_ptr` | 22.4 (`std::move` for ownership transfer) | Yes |
| 22.6 | `std::shared_ptr` | 22.5 (`unique_ptr` for contrast) | Yes |
| 22.7 | `std::weak_ptr` and circular deps | 22.6 (`shared_ptr`, reference counting) | Yes |
| 22.x | Summary and quiz | All of 22.1-22.7 | Yes |

**Verdict:** Lesson ordering is correct. The progression (rvalue refs -> move ctor/assign -> std::move -> unique_ptr -> shared_ptr -> weak_ptr) follows the standard pedagogical sequence. Each lesson builds on the previous one without skipping ahead.

---

## Lesson-by-Lesson Audit

### 22.1 -- Introduction to Smart Pointers and Move Semantics

**Summary review:**
- Correctly references Chapter 19 for `new`/`delete` and Chapter 21 for the Rule of Three.
- The mention of "exception" in the leak scenario is technically a forward reference (exceptions are not formally covered in the curriculum), but it is used only in the phrase "having an early `return` or exception skip the `delete` statement" -- a passing mention, not a code example. Acceptable as general context.
- Accurately describes ownership, memory leaks, dangling pointers, and unclear ownership.
- Correctly motivates smart pointers and move semantics without using them yet.

**Exercise 1: "Detect the leak"**
- **Forward references:** None. Uses `class`, `new`, `delete`, destructor, `const` member function -- all from Ch 14/15/19.
- **Code correctness:** `TrackedInt` allocates in constructor, deletes in destructor. Stack allocation ensures destructor runs. No copy/move hazard because the object is never copied. However, the class is missing a copy constructor and copy assignment operator -- if a student accidentally copies a `TrackedInt`, they get a double-free. This is intentional pedagogically (the lesson is motivating smart pointers), and the exercise never copies the object, so it is safe as written.
- **Test cases:** 3 cases (42, 0, -99). All expected outputs match the solution code. Destruction order is deterministic (constructor -> print value -> destructor at end of main scope).
- **Verdict:** PASS

**Exercise 2: "Ownership transfer function"**
- **Forward references:** None. Uses `struct`, `new[]`, `delete[]`, pointer member access -- all from Ch 13/19.
- **Code correctness:** `createArray` returns a struct by value containing a raw pointer. Caller is responsible for `delete[]`. Solution correctly frees memory and sets pointer to nullptr afterward.
- **Test cases:** 3 cases. Input/output alignment verified: "3\n10 20 30" -> "10 20 30\ncleaned up\n". All correct.
- **Verdict:** PASS

---

### 22.2 -- R-value References

**Summary review:**
- Correctly distinguishes l-values and r-values, referencing Ch 12.2.
- Correctly explains that non-const l-value references cannot bind to r-values.
- Correctly introduces `&&` syntax and lifetime extension.
- The overloaded `printRef` example demonstrates overload resolution correctly.
- Statement "Literals (other than string literals)...are all r-values" is correct.

**Exercise 1: "Classify l-value and r-value"**
- **Forward references:** None.
- **Code correctness:** Three calls: `classify(n)` -> l-value, `classify(42)` -> r-value, `classify(n + 1)` -> r-value. Overload resolution is correct in all cases.
- **Test cases:** 3 cases. Input 5: "l-value: 5\nr-value: 42\nr-value: 6\n". Input 0: "l-value: 0\nr-value: 42\nr-value: 1\n". Input -7: "l-value: -7\nr-value: 42\nr-value: -6\n". All correct.
- **Verdict:** PASS

**Exercise 2: "R-value reference lifetime extension"**
- **Forward references:** None.
- **Code correctness:** `int&& ref{a + b};` correctly extends the lifetime of the temporary. Reading from `ref` afterward is well-defined. The exercise explicitly says "Do not use std::move" which is appropriate since `std::move` is not taught until 22.4.
- **Test cases:** 3 cases. "3 7" -> sum 10, doubled 20, offset 110. "-5 5" -> sum 0, doubled 0, offset 100. "-100 -200" -> sum -300, doubled -600, offset -200. All arithmetic is correct.
- **Verdict:** PASS

---

### 22.3 -- Move Constructors and Move Assignment

**Summary review:**
- Correctly depends on 22.2 (rvalue references).
- The `IntArray` example correctly implements move constructor: steals pointer, nullifies source.
- Move assignment correctly frees existing resource before stealing.
- The summary mentions the Rule of Five and correctly references the Rule of Three from Chapter 21.
- `noexcept` is correctly emphasized as important for standard container compatibility.
- Statement "After a move, the source object must remain in a valid, destructible state" is correct.

**Exercise 1: "Move-Aware Dynamic String"**
- **Forward references:** None. Uses C-style string manipulation (Ch 17), `new[]`/`delete[]` (Ch 19), classes with constructors/destructors (Ch 14/15).
- **Code correctness:** The solution correctly implements:
  - Parameterized constructor: manual strlen + allocation + copy loop (no `std::strcpy` as required).
  - Copy constructor: deep copy with null check.
  - Move constructor: steals `m_data` and `m_length`, nulls source.
  - Move assignment: self-assignment check, frees existing, steals, nulls source.
  - Destructor: `delete[] m_data` (safe when `m_data` is nullptr).
- **Bug (minor):** The solution is missing a copy assignment operator. The class has a copy constructor, move constructor, and move assignment operator but no copy assignment. Per the Rule of Five, if you define any of the five, you should define all five. However, the exercise `main()` never performs copy assignment, so the program is correct as executed. The starter code also does not mention copy assignment. This is a pedagogical gap -- the exercise prompt says "supports both copying and moving" but only provides copy construction, not copy assignment.
- **Test case concern (copy elision):** `DynString c{ makeGreeting(word) };` -- the comment says "move from return value" but modern compilers (C++17 mandatory copy elision) will construct the `DynString` directly in `c` via NRVO/guaranteed copy elision, never calling the move constructor. The output is the same either way (the word is printed), so the test cases are correct regardless. However, the pedagogical claim in the comment is misleading -- the move constructor may never be invoked. This does not affect test correctness but may confuse students who add print statements to the move constructor and see no output.
- **Test cases:** 3 cases. "hello" -> "hello\nhello\nhello\nempty\n". "x" -> "x\nx\nx\nempty\n". "constructor" -> same pattern. The `d = DynString{}` move-assigns an empty DynString, so `d.print()` outputs "empty". All correct.
- **Verdict:** PASS with note -- missing copy assignment operator (Rule of Five incomplete), and the "move from return value" comment is inaccurate under C++17 guaranteed copy elision.

**Exercise 2: "Resource-Tracking Matrix Row"**
- **Forward references:** None. Uses `double*`, `new[]`/`delete[]`, classes -- all previously taught.
- **Code correctness:** The solution implements all five special member functions (Rule of Five complete). Copy constructor checks `src.m_size > 0` before allocating. Copy assignment has self-assignment check. Move operations are `noexcept`. All correct.
- **Test case concern (floating-point output):** The test expects `2.5 2.5 2.5` and `-3.14 -3.14 -3.14 -3.14 -3.14`. The solution uses `std::cout << m_data[i]` which uses default `double` formatting. For `2.5`, the default output is "2.5". For `-3.14`, the default output is "-3.14". These are exact representations in IEEE 754, so the output will match. For `0`, `std::cout << 0.0` outputs "0", not "0.0", which matches the expected "0". All correct.
- **Test case concern (output format):** Line 3 of expected output for test 1 is "2.5 2.5 2.5\nvalid\n" -- two separate lines. The solution's `c.print()` outputs the elements then a newline, then `std::cout << (c.size() == n ? "valid" : "invalid") << '\n';` outputs "valid\n" on the next line. This matches the expected output of "2.5 2.5 2.5\n2.5 2.5 2.5\n2.5 2.5 2.5\nvalid\n". Correct.
- **Test case concern (copy elision for `a`):** `MatrixRow a{ makeFilledRow(n, val) };` -- under C++17 guaranteed copy elision, the move constructor is never called for `a`. Same observation as exercise 1 above but does not affect correctness.
- **Verdict:** PASS

---

### 22.4 -- std::move

**Summary review:**
- Correctly depends on 22.2 and 22.3.
- Correctly explains that `std::move` is a cast, not a move operation.
- Correctly warns about moved-from state: "only safe operations are reassignment and destruction."
- Correctly warns about moving `const` objects (falls back to copy silently).
- Correctly warns against `std::move` on return values (disables RVO).
- The `DynArray` example is consistent with previous lessons.

**Exercise 1: "Move a DynArray into a Holder"**
- **Forward references:** None. Uses `<utility>` for `std::move`, classes, deleted copy operations.
- **Code correctness:** `Holder` constructor takes `DynArray&&` and initializes `m_arr` with `std::move(arr)`. This is correct -- without `std::move(arr)`, the named parameter `arr` would be treated as an l-value and the deleted copy constructor would be called, causing a compile error. The solution correctly demonstrates why `std::move` is needed for named rvalue references.
- **Test cases:** 3 cases. Source size is always 0 after move, holder size matches input. All correct.
- **Verdict:** PASS

**Exercise 2: "Swap via std::move"**
- **Forward references:** None.
- **Code correctness:** The three-move swap pattern is correct: `temp = move(a); a = move(b); b = move(temp);`. Each step correctly transfers ownership. The `Buffer` class has proper move constructor and move assignment with self-assignment checks.
- **Test cases:** 3 cases. "3 7" -> "before: 3 7\nafter: 7 3\n". "10 10" -> equal sizes. "1 99" -> asymmetric. All correct.
- **Verdict:** PASS

---

### 22.5 -- std::unique_ptr

**Summary review:**
- Correctly depends on 22.4 (`std::move` for ownership transfer).
- Correctly introduces `std::make_unique`, explains deleted copy operations, and covers `operator->`, `operator*`, `.get()`.
- Correctly advises preferring `unique_ptr` over `shared_ptr` and notes zero overhead.
- The `Sensor` example correctly demonstrates construction, member access via `->`, ownership transfer via `std::move`, and automatic cleanup.

**Exercise 1: "Manage a single resource with unique_ptr"**
- **Forward references:** None. Uses `<memory>`, `struct`, `std::make_unique`, `std::move`.
- **Code correctness:** Solution creates a `unique_ptr`, calls `log()` via `->`, moves to `newOwner`, checks `original == nullptr`, accesses via `newOwner->id`. Destructor message appears when `newOwner` goes out of scope at end of `main`.
- **Test cases:** 3 cases (id 10, 1, 9999). Output format matches. The destructor message "Logger <id> destroyed" appears last. Correct.
- **Verdict:** PASS

**Exercise 2: "Build and transfer a unique_ptr collection"**
- **Forward references:** None. Uses `std::vector<std::unique_ptr<Item>>`, `std::make_unique`, `push_back`, `pop_back` -- all from Ch 16 + Ch 22.
- **Code correctness:** The solution creates items with ids 1..n, moves `items[idx]` out into `extracted`, leaving `nullptr` in the vector slot. The vector size remains `n` after extraction.
- **Destruction order concern:** The expected output for test case 1 (n=3, idx=1) is:
  ```
  Item 2 destroyed    (extracted is destroyed first -- local variable destroyed before vector)
  Item 1 destroyed    (vector[0])
  Item 3 destroyed    (vector[2], skipping nullptr at vector[1])
  ```
  Local variables are destroyed in reverse order of declaration. `extracted` is declared after `items`, so `extracted` is destroyed first, then `items`. Within the vector, elements are destroyed in forward order (index 0, then 1, then 2) -- but index 1 is nullptr so it produces no output. This matches the expected output.

  **However:** The C++ standard does not mandate the destruction order of `std::vector` elements. The standard says `std::vector`'s destructor destroys its elements, but implementations typically destroy in forward order (index 0, 1, 2, ...). All major compilers (GCC, Clang, MSVC) destroy vector elements in forward order. The expected test output depends on this assumption. If a conforming implementation destroyed in reverse order, the output would be "Item 3 destroyed\nItem 1 destroyed" instead of "Item 1 destroyed\nItem 3 destroyed".

  In practice, this will work on all real compilers (Judge0 uses GCC). But it is worth noting as a fragile assumption.

- **Test case 2 (n=1, idx=0):** "Item 1 created\nVector size: 1\nExtracted item 1\nVector size after extract: 1\nItem 1 destroyed\n". Only one destruction message because the extracted pointer holds the item, and the vector slot is nullptr. Correct.

- **Test case 3 (n=5, idx=4):** Expected destruction order: "Item 5 destroyed\nItem 1 destroyed\nItem 2 destroyed\nItem 3 destroyed\nItem 4 destroyed\n". Item 5 is the extracted item (destroyed first as a local variable). Then vector elements 0-3 in forward order (Item 1-4), with index 4 being nullptr (no output). Correct under the forward-destruction assumption.

- **Verdict:** PASS with note -- destruction order of vector elements is implementation-defined in the standard but consistent across all major compilers. The test output is correct for GCC/Clang/MSVC.

---

### 22.6 -- std::shared_ptr

**Summary review:**
- Correctly depends on 22.5 (`unique_ptr` for contrast).
- Correctly explains reference counting, `use_count()`, copy semantics, `reset()`.
- Correctly advises using `std::make_shared` for single-allocation efficiency.
- Correctly warns against creating a `shared_ptr` from a raw pointer already managed by another `shared_ptr`.
- The code example correctly demonstrates count progression: 1 -> 2 -> 1.

**Exercise 1: "Trace the reference count"**
- **Forward references:** None. Uses `<memory>`, `<vector>`, `std::make_shared`, `push_back`, `pop_back`.
- **Code correctness:** Creates a `shared_ptr<int>`, pushes `n` copies into a vector, then pops them one by one. The `use_count()` correctly starts at 1, becomes `n+1` after copies, then decrements by 1 with each `pop_back`.
- **Test cases:** 3 cases. n=3: "1\n4\n3\n2\n1\n". n=1: "1\n2\n1\n". n=5: "1\n6\n5\n4\n3\n2\n1\n". All arithmetic is correct.
- **Verdict:** PASS

**Exercise 2: "Shared vs unique ownership report"**
- **Forward references:** None.
- **Code correctness:** Creates a `unique_ptr` and a `shared_ptr` independently. The `shared_ptr` is copied, the copy's value is compared before reset. The comparison `*sptr1 == *sptr2` always yields `true` because both were created with the same `value` (and they point to the same object since `sptr2` is a copy of `sptr1`).
- **Subtle note:** `sptr2` is a copy of `sptr1`, so they point to the same object. The comparison `*sptr1 == *sptr2` is trivially true (same address, same value). The exercise prompt says "compare the **dereferenced values**" which is technically correct but the comparison is always true by identity. A more interesting test would create `sptr2` from a separate `make_shared` call, but this doesn't affect correctness.
- **Test cases:** 3 cases. All produce "equal: true" which is correct. All count values are correct.
- **Verdict:** PASS

---

### 22.7 -- Circular Dependency Issues with std::shared_ptr, and std::weak_ptr

**Summary review:**
- Correctly depends on 22.6 (shared_ptr, reference counting).
- Correctly explains the circular dependency problem with `shared_ptr`.
- Correctly introduces `weak_ptr` as the solution: does not increment reference count.
- Correctly explains `expired()` and `lock()` member functions.
- Correctly states that `weak_ptr` has no `operator*` or `operator->`.
- The `Node` example correctly demonstrates the cycle-breaking pattern.
- The design rule ("make one direction a `weak_ptr`") is sound advice.

**Exercise 1: "Detect a circular dependency with use_count"**
- **Forward references:** None. Uses `<memory>`, `std::make_shared`, `std::weak_ptr`, structs.
- **Code correctness:**
  - Part 1 (circular): Creates two `BadNode` shared_ptrs (count=1 each), cross-links them (count=2 each), resets both local pointers. After reset, the local `shared_ptr` objects are empty (use_count = 0), but the `BadNode` objects themselves are leaked (each has count 1 from the other's `next` member). The expected output shows "A count = 0, B count = 0" after reset, which is the use_count of the **local variables** `a` and `b` (which are now null), not the use_count of the leaked objects. This is correct -- `a.use_count()` returns 0 when `a` is empty/null.
  - Part 2 (fixed): Creates two `GoodNode` shared_ptrs (count=1 each), cross-links with `weak_ptr` (count stays at 1 each). The `weak_ptr obs` observes `b2` (via `a2->next`). Before `b2.reset()`, `obs.expired()` is false. After `b2.reset()`, the `GoodNode(idB)` object is destroyed (its count drops to 0), so `obs.expired()` is true.
- **Test cases:** 3 cases, all with identical output (the IDs don't appear in the output). The expected "Circular: A count = 2, B count = 2" is correct. "Circular after reset: A count = 0, B count = 0" is correct (local shared_ptrs are null). "Fixed: A count = 1, B count = 1" is correct (weak_ptr doesn't increment). "A expired: false" then "A expired: true" after `b2.reset()` is correct.
- **Memory leak note:** Part 1 intentionally leaks the `BadNode` objects to demonstrate the circular dependency problem. This is pedagogically sound -- the point is to show that the cycle prevents cleanup. However, the program terminates without freeing those objects, which means the process leaks memory. On Judge0, this is harmless (the OS reclaims memory at process exit). The exercise requirement "Do not rely on destructor output for correctness" correctly anticipates that the `BadNode` destructors never run.
- **Verdict:** PASS

**Exercise 2: "Safe observer with weak_ptr::lock"**
- **Forward references:** None.
- **Code correctness:** Creates a `shared_ptr<Item>`, creates a `weak_ptr` from it, locks the `weak_ptr` to get a temporary `shared_ptr`, prints values and counts, releases the lock, resets the owner. The `use_count()` values are correct: 1 initially, 2 while locked (owner + locked), 1 after lock released, 0 after owner reset.
- **Operator precedence concern:** The solution contains `std::cout << "Item alive: " << !observer.expired() << "\n";`. The `!` operator has higher precedence than `<<`, so this evaluates as `!observer.expired()` which is correct. However, this relies on `operator<<(bool)` outputting "true"/"false" only if `std::boolalpha` is set. The solution does set `std::boolalpha` before this line (inside the nested scope). **Wait** -- looking more carefully, the `std::boolalpha` is set inside the locked scope `{ auto locked = observer.lock(); ... }` but the "Item alive" prints happen after that scope. `std::boolalpha` is a sticky I/O manipulator, so once set, it remains active for the rest of the stream's lifetime. This is correct.
- **Test cases:** 3 cases. All produce the same output pattern with different values for "Observer lock: <value>". All counts and expired states are correct.
- **Verdict:** PASS

---

### 22.x -- Chapter 22 Summary and Quiz

**Summary review:**
- Covers all seven lessons (22.1-22.7) accurately.
- No forward references.
- Correctly summarizes ownership, rvalue references, move constructors/assignment, `std::move`, `unique_ptr`, `shared_ptr`, `weak_ptr`, and circular dependencies.
- Minor note: The summary says "Passing by value transfers ownership" for `unique_ptr`. More precisely, passing a `unique_ptr` by value requires `std::move` at the call site (since copy is deleted) and transfers ownership to the function parameter. The wording is acceptable for a summary.

**Exercise 1: "Transfer Unique Ownership"**
- **Forward references:** None. Uses `<memory>`, `<vector>`, `<string>`, `std::make_unique`, `std::move`, range-based for loops.
- **Code correctness:** The solution reads names, creates `unique_ptr<UniqueResource>` objects, pushes them into a source vector, then iterates via `for (auto& ptr : source)` -- using `auto&` to get a reference to the `unique_ptr` in the vector (not a copy, which would fail since `unique_ptr` is non-copyable). Before moving, it prints the name. After moving, the source element becomes nullptr. The final check iterates source and verifies all elements are null.
- **Test cases:** 3 cases. "3\nalpha\nbeta\ngamma\n" -> correct. "1\nwidget\n" -> correct. "5\nptr\nref\nobj\nval\nres\n" -> correct.
- **Verdict:** PASS

**Exercise 2: "Shared and Weak Pointer Lifecycle"**
- **Forward references:** None. Uses `<memory>`, `<string>`, `std::make_shared`, `std::weak_ptr`.
- **Code correctness:** The solution creates a `shared_ptr<std::string>`, copies it, creates a `weak_ptr`, locks the `weak_ptr` in a nested scope, then resets in sequence. The `use_count()` values are: 1 (created), 2 (copied), 2 (weak created -- weak doesn't increment), 3 (locked), 2 (lock released), 1 (copy reset), 0 (original reset). All correct.
- **Slight style inconsistency:** The solution uses `(weak.expired() ? "true" : "false")` instead of `std::boolalpha << !weak.expired()`. Both produce the same output but the manual ternary approach is more verbose. Not a bug.
- **Test cases:** 3 cases. All produce the same count pattern with different names. "Engine", "X", "DatabaseConnection". All correct.
- **Verdict:** PASS

---

## Code Correctness Issues

### Potential Double-Free / Use-After-Move Bugs

| Location | Issue | Severity |
|---|---|---|
| 22.1 ex1 (TrackedInt) | Class has no copy constructor or copy assignment. If copied, the default shallow copy produces a double-free. The exercise never copies the object, so this is safe as written. The lesson intentionally demonstrates incomplete resource management to motivate smart pointers. | **OK** (intentional) |
| 22.3 ex1 (DynString) | Missing copy assignment operator. Rule of Five incomplete. The exercise never performs copy assignment, so no runtime bug. | **LOW** |
| 22.3 ex1 (DynString) | `makeGreeting` returns a local `DynString` by value. Under C++17 guaranteed copy elision (NRVO), the move constructor is never called. The starter code comment "// move from return value" is misleading. | **LOW** (pedagogical, not a bug) |
| 22.5 ex2 (unique_ptr collection) | Destruction order of `std::vector` elements is implementation-defined. Expected output assumes forward-order destruction. Correct on GCC/Clang/MSVC but technically fragile. | **LOW** |
| 22.7 ex1 (circular dependency) | Part 1 intentionally leaks `BadNode` objects. This is by design to demonstrate the problem. No cleanup is possible without breaking the cycle. | **OK** (intentional) |

### No double-free, use-after-move, or dangling pointer bugs found in any solution code.

---

## Test Case Verification Summary

| Lesson | Exercise | # Cases | Input/Output Match | Edge Cases | Verdict |
|---|---|---|---|---|---|
| 22.1 | Detect the leak | 3 | All match | 0, negative | PASS |
| 22.1 | Ownership transfer function | 3 | All match | n=1, negatives | PASS |
| 22.2 | Classify l-value and r-value | 3 | All match | 0, negative | PASS |
| 22.2 | R-value reference lifetime extension | 3 | All match | sum=0, both negative | PASS |
| 22.3 | Move-Aware Dynamic String | 3 | All match | single char | PASS |
| 22.3 | Resource-Tracking Matrix Row | 3 | All match | n=1, float precision | PASS |
| 22.4 | Move a DynArray into a Holder | 3 | All match | n=1 | PASS |
| 22.4 | Swap via std::move | 3 | All match | equal sizes | PASS |
| 22.5 | Manage a single resource | 3 | All match | min/max id | PASS |
| 22.5 | Build and transfer collection | 3 | All match | n=1, last index | PASS |
| 22.6 | Trace the reference count | 3 | All match | n=1, n=5 | PASS |
| 22.6 | Shared vs unique ownership | 3 | All match | 0, negative | PASS |
| 22.7 | Detect circular dependency | 3 | All match | various ids | PASS |
| 22.7 | Safe observer with lock | 3 | All match | min/max value | PASS |
| 22.x | Transfer Unique Ownership | 3 | All match | n=1, n=5 | PASS |
| 22.x | Shared and Weak Pointer Lifecycle | 3 | All match | short/long names | PASS |

**All 48 test cases verified correct.**

---

## Findings Summary

### Critical Issues (must fix)
None.

### Medium Issues (should fix)

| # | Location | Issue | Recommendation |
|---|---|---|---|
| 1 | 22.3 ex1 (DynString) | Rule of Five incomplete -- missing copy assignment operator. The exercise prompt says "supports both copying and moving" but only the copy constructor is implemented, not copy assignment. | Add a copy assignment operator to the solution and starter code, or remove the claim about supporting copying in the assignment sense. |

### Low Issues (nice to fix)

| # | Location | Issue | Recommendation |
|---|---|---|---|
| 1 | 22.3 ex1 | Starter code comment `// move from return value` is misleading under C++17 guaranteed copy elision. The move constructor is never called for `c`. | Change comment to `// may be move-constructed or copy-elided (C++17)` or remove the parenthetical. |
| 2 | 22.5 ex2 | Destruction order of vector elements is implementation-defined in the C++ standard. The test output assumes forward-order destruction (index 0, 1, 2, ...). This works on all major compilers but is technically fragile. | Add a comment in the prompt noting that destruction order may vary, or restructure the exercise to avoid relying on vector destruction order (e.g., manually reset each vector element in a loop before end of scope). |
| 3 | 22.3 ex2 (MatrixRow) | The `makeFilledRow` factory return also relies on copy elision, same as ex1. Not a bug but the pedagogical framing implies a move occurs. | Same as item 1 -- adjust comment or note that copy elision may apply. |

### Positive Observations

1. **No forward-reference violations.** The chapter is completely clean of references to inheritance (Ch 24), virtual functions (Ch 25), `std::initializer_list` (Ch 23), or object relationships (Ch 23).
2. **Within-chapter ordering is perfect.** Each lesson strictly builds on the previous one: rvalue refs -> move ctor/assign -> std::move -> unique_ptr -> shared_ptr -> weak_ptr.
3. **Move semantics are correctly implemented.** All move constructors and move assignment operators properly null the source, check for self-assignment, and free existing resources before stealing.
4. **`noexcept` is consistently applied** to all move constructors and move assignment operators, which is best practice.
5. **No use-after-move bugs.** Every exercise that moves an object either does not use the moved-from object afterward, or only checks properties that are well-defined in the moved-from state (e.g., `size() == 0`).
6. **Test cases are comprehensive.** Edge cases include zero, negative numbers, minimum/maximum values, single-element collections, and equal-value scenarios.
7. **Rule of Five is explicitly taught** in 22.3 and correctly demonstrated in the MatrixRow exercise (all five special member functions present).
8. **Smart pointer exercises avoid `new`/`delete`** as appropriate, consistently using `make_unique` and `make_shared`.
9. **The circular dependency exercise (22.7 ex1) is well-designed** -- it shows both the problem (BadNode with shared_ptr) and the solution (GoodNode with weak_ptr) in the same exercise, letting students directly compare reference counts.
