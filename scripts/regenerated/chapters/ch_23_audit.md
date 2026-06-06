# Chapter 23 ("Object Relationships") -- Audit Report

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-05
**Scope:** Forward-reference violations, code correctness bugs, pedagogical ordering issues, test case mismatches

---

## Summary

| Category | Count |
|---|---|
| Forward-reference violations (Ch 24+) | 0 |
| Within-chapter ordering violations | 0 |
| Code correctness bugs | 3 |
| Test case mismatches | 1 |
| Missing schema fields | 8 |
| Pedagogical concerns | 3 |

**Overall assessment:** Chapter 23 is clean of inheritance/virtual/polymorphism forward references. No within-chapter ordering violations were found (`std::initializer_list` is correctly confined to 23.7 and 23.x). The issues are concentrated in (a) missing `difficulty` fields, (b) use of standard library features not formally introduced in the curriculum, and (c) one test case output format inconsistency.

---

## Lesson-by-Lesson Audit

### 23.1 -- Object relationships (sort_order: 0)

**Summary:** Introduces the four relationship types (composition, aggregation, association, dependency) with a `Car`/`Engine` example.

**Forward references:** None.
**Within-chapter ordering:** Clean -- first lesson, no dependencies on later 23.x lessons.

#### Exercise 1: "Composition: Room owns a Light"

- **Forward references:** None.
- **Code correctness:** Clean. Composition via value member, destructor prints on scope exit.
- **Test cases:** All 3 correct. Solution output matches expected output for all inputs.
- **Difficulty field:** Present (`practice`).

#### Exercise 2: "Aggregation vs dependency"

- **Forward references:** None.
- **Code correctness:** Clean. Uses C-style array of `Player` with pre-initialization `Player{""}` x 10, then overwrites via copy assignment. Aggregation via `const Player*` array. The copy assignment of `Player` objects in the loop (`players[i] = Player{name}`) is valid since `Player` has an implicitly-defined copy assignment operator.
- **Test cases:** All 3 correct.
- **Difficulty field:** Present (`practice`).
- **Style note (non-blocking):** The starter code pre-initializes a C-style array of 10 `Player{""}` objects. A `std::vector<Player>` with `reserve()` would be more idiomatic, but using a C-style array is valid and avoids pointer invalidation concerns entirely. Acceptable.

---

### 23.2 -- Composition (sort_order: 1)

**Summary:** Deep dive into composition with `Point2D`/`Creature` example.

**Forward references:** None.
**Within-chapter ordering:** Clean -- depends only on 23.1.

#### Exercise 1: "Build a composed creature"

- **Forward references:** None.
- **Code correctness:** Clean.
- **Test cases:** All 3 correct.
- **Difficulty field:** Present (`practice`).

#### Exercise 2: "Computer with composed parts"

- **Forward references:** None.
- **Code correctness (BUG -- minor):** Solution uses `std::to_string()` in `CPU::describe()` and `Memory::describe()`. `std::to_string` is not formally introduced anywhere in the curriculum reference (Chapters 0-22). While it is available via `<string>`, students have not been taught it. The exercise could be rewritten to use `std::cout` directly instead of returning a `std::string`.
- **Test cases:** All 3 correct (output matches solution behavior).
- **Difficulty field:** Present (`practice`).

**Finding [23.2-E2-UNTAUGHT]:** `std::to_string()` is used in the solution but is not formally introduced in any prior chapter. **Severity: Low.** Fix: rewrite `describe()` to print directly to `std::cout` or to an `std::ostream&` parameter, or add a brief note that `std::to_string` converts a number to `std::string`.

---

### 23.3 -- Aggregation (sort_order: 2)

**Summary:** Aggregation via references and pointers. `Department`/`Teacher` example.

**Forward references:** None.
**Within-chapter ordering:** Clean -- depends on 23.1 and 23.2.

#### Exercise 1: "Department lead lookup"

- **Forward references:** None.
- **Code correctness:** Clean. `const Teacher&` member in `Department` is safe because `Teacher` outlives `Department` in `main`.
- **Test cases:** All 3 correct.
- **Difficulty field:** Present (`practice`).

#### Exercise 2: "Shared teacher across departments"

- **Forward references:** None.
- **Code correctness:** Clean. Inner scope destroys departments before teacher, demonstrating aggregation.
- **Test cases:** All 3 correct.
- **Difficulty field:** Present (`practice`).

---

### 23.4 -- Association (sort_order: 3)

**Summary:** Association via pointers. `Doctor`/`Patient` and `Student`/`Course` examples.

**Forward references:** None.
**Within-chapter ordering:** Clean -- depends on 23.1-23.3.

#### Exercise 1: "Doctor-Patient Association"

- **Forward references:** None.
- **Code correctness:** The solution stores `Patient*` pointers into `Doctor` objects. Both `std::vector<Doctor>` and `std::vector<Patient>` are fully populated (via `push_back`) before the association loop begins. Since no further `push_back` calls occur on the `patients` vector after addresses are taken, there is no pointer invalidation. Clean.
- **Test case issue (BUG):** Test case 2 ("Doctor with no patients") expects `DrJones:\n` (name followed by colon, no trailing space). However, the solution code prints `doctors[q].getName() << ':'` which produces `DrJones:` with no trailing space. This is consistent. But the *prompt* says: "If the doctor has no patients, print just the doctor's name followed by a colon." The output format for doctors WITH patients is `<name>: <patient1> <patient2>` (colon-space), but for doctors WITHOUT patients it is `<name>:` (colon only, no space). This inconsistency between the two cases could confuse students who add a trailing space. **However**, the solution and test case are consistent with each other, so this is a prompt clarity issue, not a mismatch.
- **Difficulty field:** MISSING.

**Finding [23.4-E1-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

**Finding [23.4-E1-PROMPT]:** The output format differs subtly between "has patients" (`Name: P1 P2`) and "no patients" (`Name:`) cases. The prompt should clarify this explicitly to avoid student confusion about trailing spaces. **Severity: Low.**

#### Exercise 2: "Bidirectional Student-Course Association"

- **Forward references:** None.
- **Code correctness:** Same vector pattern -- both vectors fully built before `enroll()` is called. No pointer invalidation. Clean.
- **Test case issue (BUG):** Test case 2 ("Course with no students") expects `Music: 0\n`. The solution prints `courses[q].getName() << ": " << enrolled.size()` which for an empty vector prints `Music: 0`. However, `enrolled.size()` returns `std::size_t` (unsigned). On all common platforms this prints `0` correctly. Technically OK.
- **Output format concern:** The prompt says "If the course has no students, print the course name, a colon, a space, then `0`." The solution always prints `<name>: <size>` followed by student names. For the no-student case, this produces `Music: 0` with no trailing space after the `0`. For the with-student case, it produces `Math: 2 Alice Bob`. This format is consistent -- the count is always printed, followed by space-separated names if any. Clean.
- **Difficulty field:** MISSING.

**Finding [23.4-E2-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

---

### 23.5 -- Dependencies (sort_order: 4)

**Summary:** Dependency as the weakest relationship. Function parameters, transient usage.

**Forward references:** None.
**Within-chapter ordering:** Clean -- depends on 23.1-23.4.

#### Exercise 1: "Format a temperature"

- **Forward references:** None.
- **Code correctness (BUG):** The solution uses `<sstream>` (`std::ostringstream`) and `<iomanip>` (`std::fixed`, `std::setprecision`). Neither header nor any of these features (`std::ostringstream`, `std::fixed`, `std::setprecision`) are formally introduced in the curriculum reference for Chapters 0-22. Students would need to know about string streams and I/O manipulators, which are not covered. This is an untaught-feature violation.
- **Test cases:** All 3 correct (output matches solution behavior).
- **Difficulty field:** Present (`practice`).

**Finding [23.5-E1-UNTAUGHT]:** `<sstream>` (`std::ostringstream`), `<iomanip>` (`std::fixed`, `std::setprecision`) are used in both the starter code and solution but are not formally introduced in any prior chapter. **Severity: Medium.** This is harder for students to work around than `std::to_string` since the entire exercise design depends on these features. Fix: either (a) introduce these features briefly in the lesson summary, (b) simplify the exercise to avoid needing formatted floating-point-to-string conversion, or (c) provide the `Formatter::format` implementation in the starter code and have students focus only on the dependency relationship.

#### Exercise 2: "Scoreboard reporter"

- **Forward references:** None.
- **Code correctness:** Clean. Simple integer accumulation, no untaught features.
- **Test cases:** All 3 correct.
- **Difficulty field:** Present (`practice`).

---

### 23.6 -- Container classes (sort_order: 5)

**Summary:** Container class concept, `IntStack` example with `new`/`delete`, Rule of Three mention.

**Forward references:** None. The summary mentions `std::stack` and `std::map` by name as examples of standard containers, but only in passing -- they are not used in any code. This is acceptable as a forward mention/motivation.
**Within-chapter ordering:** Clean -- depends on 23.1-23.5. Does NOT use `std::initializer_list` (that is 23.7).

#### Exercise 1: "IntArray container"

- **Forward references:** None.
- **Code correctness:** Clean. Manual `new[]`/`delete[]` management, `assert` guards. No copies are made so the missing copy constructor is explicitly noted as acceptable.
- **Test cases:** All 3 correct.
- **Difficulty field:** MISSING.

**Finding [23.6-E1-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

#### Exercise 2: "IntStack with push, pop, and top"

- **Forward references:** None.
- **Code correctness:** Clean. LIFO semantics correctly implemented.
- **Test cases:** All 3 correct. Verified the interleaved operations test case manually:
  - push 1, push -2, push 3, pop -> 3, size -> 2, push 99, top -> 99, pop -> 99, pop -> -2, pop -> 1
  - Expected: `3\n2\n99\n99\n-2\n1\n` -- correct.
- **Difficulty field:** MISSING.

**Finding [23.6-E2-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

---

### 23.7 -- std::initializer_list (sort_order: 6)

**Summary:** `std::initializer_list<T>`, initializer list constructors, interaction with uniform initialization.

**Forward references:** None.
**Within-chapter ordering:** Clean -- `std::initializer_list` is introduced here and used in 23.x. No earlier lesson uses it.

#### Exercise 1: "IntArray with initializer_list constructor"

- **Forward references:** None.
- **Code correctness:** Clean. Two constructors (initializer_list and pointer-based). Destructor calls `delete[]`.
- **Test cases:** All 3 correct. The hardcoded `{10, 20, 30}` portion of output is constant across all test cases.
- **Difficulty field:** MISSING.

**Finding [23.7-E1-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

#### Exercise 2: "IntArray list assignment and sum"

- **Forward references:** None.
- **Code correctness (BUG -- minor):** The `operator=` implementation deletes `m_data` then allocates new storage. If `new` throws after `delete[]`, the object is left in an invalid state (dangling `m_data`). This is a well-known exception-safety issue. However, for a teaching exercise at this level (students have not been taught exceptions), this is acceptable. The summary should ideally note this limitation.
- **Test cases:** All 3 correct. Verified manually:
  - x=10: `{10, 20, 30, 40}`, sum = 100. Correct.
  - x=-3: `{-3, -6, -9, -12}`, sum = -30. Correct.
  - x=0: `{0, 0, 0, 0}`, sum = 0. Correct.
- **Difficulty field:** MISSING.

**Finding [23.7-E2-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

---

### 23.x -- Chapter 23 summary and quiz (sort_order: 7)

**Summary:** Recap of all four relationship types, container classes, and `std::initializer_list`.

**Forward references:** None.
**Within-chapter ordering:** Clean -- final lesson, depends on all prior 23.x lessons.

#### Exercise 1: "Playlist with Composition and Initializer List"

- **Forward references:** None.
- **Code correctness:** Clean. Uses `std::vector<Song>` for composition, `std::initializer_list<Song>` constructor. Well-structured.
- **Test cases:** All 3 correct.
- **Difficulty field:** MISSING.

**Finding [23.x-E1-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

#### Exercise 2: "School Registry: Container, Aggregation, and Dependencies"

- **Forward references:** None.
- **Code correctness:** The starter code and solution both use `students.reserve(s)` and `students.emplace_back(name, grade)`. Both `reserve()` and `emplace_back()` are standard `std::vector` member functions. `reserve()` is listed in the Ch 16 curriculum reference. However, `emplace_back()` is NOT listed in the Ch 16 curriculum reference (only `push_back` is listed). This is a minor untaught-feature issue.
- **Pointer safety:** The solution uses `students.reserve(s)` before the loop, then `emplace_back` inside the loop. Because `reserve` is called with the exact count `s`, no reallocation occurs during the loop, so pointers taken later via `&students[idx]` remain valid. This is correct and safe.
- **Test cases:** All 3 correct. Verified test case 1 manually:
  - Students: Alice(90), Bob(75), Clara(88), Dave(62)
  - Math classroom: indices 0,1,3 -> Alice(90), Bob(75), Dave(62), avg = (90+75+62)/3 = 227/3 = 75 (truncated). Correct.
  - Science classroom: indices 2,3 -> Clara(88), Dave(62), avg = (88+62)/2 = 150/2 = 75. Correct.
  - Output matches expected. Correct.
- **Test case 3 verification:** Frank(81), Grace(67), Hank(44)
  - History: indices 0,2 -> Frank(81), Hank(44), avg = 125/2 = 62 (truncated). Correct.
  - English: indices 0,1,2 -> Frank(81), Grace(67), Hank(44), avg = 192/3 = 64. Correct.
  - Gym: index 1 -> Grace(67), avg = 67. Correct.
- **Difficulty field:** MISSING.

**Finding [23.x-E2-DIFFICULTY]:** Missing `difficulty` field. **Severity: Schema.**

**Finding [23.x-E2-UNTAUGHT]:** `emplace_back()` is used in both starter code and solution but is not listed in the Ch 16 curriculum reference (which only lists `push_back`). **Severity: Low.** Fix: replace `emplace_back(name, grade)` with `push_back(Student{name, grade})`.

---

## Cross-Cutting Findings

### Forward-Reference Violations (Ch 24+)

**None found.** The chapter is completely free of:
- Inheritance (`class Derived : public Base`)
- `virtual` functions
- `override` specifier
- `polymorphism` concepts
- `dynamic_cast`
- Abstract classes / pure virtual functions
- `protected` access specifier

### Within-Chapter Ordering Violations

**None found.** `std::initializer_list` is correctly introduced in 23.7 and only used in 23.7 and 23.x. No earlier lesson references it.

### Missing `difficulty` Fields (Schema)

8 of 16 exercises are missing the `difficulty` field:

| Lesson | Exercise | Missing? |
|---|---|---|
| 23.1 | Composition: Room owns a Light | No |
| 23.1 | Aggregation vs dependency | No |
| 23.2 | Build a composed creature | No |
| 23.2 | Computer with composed parts | No |
| 23.3 | Department lead lookup | No |
| 23.3 | Shared teacher across departments | No |
| 23.4 | Doctor-Patient Association | **YES** |
| 23.4 | Bidirectional Student-Course Association | **YES** |
| 23.5 | Format a temperature | No |
| 23.5 | Scoreboard reporter | No |
| 23.6 | IntArray container | **YES** |
| 23.6 | IntStack with push, pop, and top | **YES** |
| 23.7 | IntArray with initializer_list constructor | **YES** |
| 23.7 | IntArray list assignment and sum | **YES** |
| 23.x | Playlist with Composition and Initializer List | **YES** |
| 23.x | School Registry: Container, Aggregation, and Dependencies | **YES** |

### Untaught Standard Library Features

| Feature | Used in | Introduced in curriculum? |
|---|---|---|
| `std::to_string()` | 23.2 Ex2 solution | No |
| `<sstream>` / `std::ostringstream` | 23.5 Ex1 starter + solution | No |
| `<iomanip>` / `std::fixed` / `std::setprecision` | 23.5 Ex1 starter + solution | No |
| `emplace_back()` | 23.x Ex2 starter + solution | No (only `push_back` in Ch 16) |

---

## Consolidated Fix List

### Must Fix

| ID | Lesson | Issue | Fix |
|---|---|---|---|
| DIFF-1 through DIFF-8 | 23.4, 23.6, 23.7, 23.x | Missing `difficulty` field on 8 exercises | Add `"difficulty": "practice"` (or appropriate level) to each |
| UNTAUGHT-1 | 23.5 Ex1 | `<sstream>`, `<iomanip>`, `std::ostringstream`, `std::fixed`, `std::setprecision` not taught | Simplify exercise to avoid formatted float-to-string, or provide the `Formatter::format` implementation pre-written so students focus on the dependency pattern |

### Should Fix

| ID | Lesson | Issue | Fix |
|---|---|---|---|
| UNTAUGHT-2 | 23.2 Ex2 | `std::to_string()` not taught | Rewrite `describe()` to print directly via `std::cout` or accept `std::ostream&` |
| UNTAUGHT-3 | 23.x Ex2 | `emplace_back()` not taught | Replace `students.emplace_back(name, grade)` with `students.push_back(Student{name, grade})` |
| PROMPT-1 | 23.4 Ex1 | Output format ambiguity (trailing space when patients present vs absent) | Clarify in prompt: "If the doctor has patients, print `<name>: <p1> <p2> ...` (colon, space, then space-separated names). If the doctor has no patients, print `<name>:` (colon only, no trailing space)." |

### Nice to Fix

| ID | Lesson | Issue | Fix |
|---|---|---|---|
| SAFETY-1 | 23.7 Ex2 | `operator=` is not exception-safe (delete before allocate) | Add a brief comment in the solution noting this limitation, or use allocate-then-delete pattern |

---

## Verdict

**Chapter 23 is in good shape.** Zero forward-reference violations to Ch 24+ content. Zero within-chapter ordering issues. The main action items are (1) adding the 8 missing `difficulty` fields and (2) replacing a handful of untaught standard library features with alternatives students have been taught.
