# Chapter 13 Audit: Compound Types: Enums and Structs

## Summary

Audited all 17 lessons (13.1 through 13.y) covering summaries and 30 exercises total. Found 13 issues across multiple severity levels. The most pervasive problem is the use of C-style arrays (`Type arr[N]`) in exercises, which is a forward reference to Chapter 17. There are also platform-dependent `sizeof` test cases that will fail on many systems, a `std::format`/`std::println` usage in a summary, use of bitwise operators not formally taught, and structured binding usage without formal introduction.

## Issues Found

### [MEDIUM] Lesson 13.1 -- "Introduction to program-defined (user-defined) types"

- **Type**: forward-reference
- **Location**: summary -- code example
- **Details**: The summary code example uses `std::format` and `std::println` (`#include <format>`, `#include <print>`). `std::println` is a C++23 feature. `std::format` is C++20 but has not been formally taught. Neither `<format>` nor `<print>` appear in any prior chapter's introduced concepts. The summary should use `std::cout` which students know.
- **Fix needed**: Replace the `std::println(std::format(...))` call with `std::cout` output using the `<<` operator.

---

### [MEDIUM] Lesson 13.1 -- "Introduction to program-defined (user-defined) types"

- **Type**: forward-reference
- **Location**: summary -- structured bindings
- **Details**: The summary introduces and demonstrates `auto [tx, ty] = target;` (structured bindings) calling it "a clean C++17 feature you will use regularly with structs." However, structured bindings are not listed in the Chapter 13 curriculum reference introduction list, nor are they introduced in any prior chapter. While 13.1 exercise 1 explicitly requires structured bindings, the concept appears without any formal prerequisite.
- **Fix needed**: Either add structured bindings to the Chapter 13 curriculum reference or remove the structured binding from the summary and exercise 1, using dot notation instead.

---

### [MEDIUM] Lesson 13.1 -- "Introduction to program-defined (user-defined) types"

- **Type**: forward-reference
- **Location**: exercise 2 ("Catalog Three Products Using a Struct and an Enum") -- `Product catalog[3]`
- **Details**: The exercise requires using a C-style array `Product catalog[3]`. C-style arrays are formally introduced in Chapter 17 (lesson 17.7). Students at this point in the curriculum have not learned array syntax. The prompt even says "use `Product catalog[3]`" directly.
- **Fix needed**: Either limit the exercise to a fixed number of individually-named variables (e.g., `Product p1`, `Product p2`, `Product p3`) or note that plain C-style arrays are being used as a preview. Alternatively, restructure to avoid arrays entirely.

---

### [LOW] Lesson 13.1 -- "Introduction to program-defined (user-defined) types"

- **Type**: ordering
- **Location**: exercise 2 ("Catalog Three Products Using a Struct and an Enum") -- uses enum before formal introduction
- **Details**: Exercise 2 asks students to define an unscoped enum `Category` and a `Product` struct. Enums are not formally introduced until lesson 13.2. While 13.1 mentions enums conceptually, students have not yet learned enum syntax. The exercise forces students to write enum code ahead of the lesson that teaches it.
- **Fix needed**: Move this exercise to lesson 13.2 or later, or simplify exercise 2 to only use structs (e.g., use an `int` for category and a helper function for the label).

---

### [LOW] Lesson 13.1 -- "Introduction to program-defined (user-defined) types"

- **Type**: forward-reference
- **Location**: exercise 2 ("Catalog Three Products Using a Struct and an Enum") -- structured binding with loop
- **Details**: The exercise requires `auto [n, c] = catalog[i];` inside a loop, combining structured bindings (not formally taught) with C-style array indexing (Ch 17).
- **Fix needed**: Use dot notation for member access instead of structured bindings.

---

### [MEDIUM] Lesson 13.6 -- "Scoped enumerations (enum classes)"

- **Type**: forward-reference
- **Location**: exercise 2 ("Permission Checker with Explicit Underlying Type") -- bitwise AND operator
- **Details**: The exercise requires using the bitwise AND operator (`&`) to test permission bits: `return (mask & static_cast<int>(p)) != 0;`. Bitwise operators (`&`, `|`, `^`, `~`) are not introduced in any chapter in the curriculum reference. Chapter 6 covers arithmetic, relational, logical, ternary, and increment/decrement operators but explicitly does not cover bitwise operators. Students have no formal knowledge of bitwise AND at this point.
- **Fix needed**: Either (a) replace the bitwise approach with a simpler design (e.g., use individual bool members or integer comparison), (b) add a brief explanation of bitwise AND in the exercise prompt since it is needed for the exercise, or (c) add bitwise operators to the Chapter 6 curriculum.

---

### [MEDIUM] Lesson 13.11 -- "Struct miscellany"

- **Type**: test-mismatch (platform-dependent)
- **Location**: exercise 1 ("Nested Struct Address Book") -- test cases
- **Details**: All three test cases hardcode `sizeof(Person) = 72`. The `Person` struct contains `std::string name` and `Address address` (which contains `std::string city` and `int zip`). The size of `std::string` is implementation-defined (typically 32 bytes on libstdc++/64-bit, but 24 bytes on libc++/macOS). The hardcoded value of 72 will fail on platforms where `std::string` has a different size (e.g., on macOS with libc++ where `sizeof(std::string) = 24`, the total would be different).
- **Fix needed**: Remove the `sizeof(Person)` output line from the exercise, or accept any numeric value in the test case for that line. Alternatively, note that the exercise is informational and the sizeof line should not be tested.

---

### [MEDIUM] Lesson 13.11 -- "Struct miscellany"

- **Type**: test-mismatch (platform-dependent)
- **Location**: exercise 2 ("Sensor Report with Padding Discovery") -- test cases
- **Details**: All test cases hardcode `sizeof(Reading) = 24` and `Padding bytes = 11`. While these values are correct for typical 64-bit platforms with the given member layout (`char`, `double`, `int`), the exact padding is ABI-dependent. The exercise prompt acknowledges this ("On the judge (64-bit Linux, g++)...") but the test cases will fail on any platform with different alignment rules.
- **Fix needed**: Same as above -- either remove the sizeof comparison from test validation or make the test flexible enough to accept computed values.

---

### [MEDIUM] Lesson 13.11 -- "Struct miscellany"

- **Type**: forward-reference
- **Location**: exercise 2 ("Sensor Report with Padding Discovery") -- `Reading data[5]`
- **Details**: Uses a C-style array `Reading data[5]` which is a Ch 17 concept.
- **Fix needed**: Use individually named variables or restructure to avoid arrays.

---

### [MEDIUM] Lesson 13.12 -- "Member selection with pointers and references"

- **Type**: forward-reference
- **Location**: exercise 1 ("Employee Lookup via Pointer") -- `Employee employees[10]`
- **Details**: Uses a C-style array `Employee employees[10]` and passes it to a function (`Employee employees[]` parameter). C-style arrays and array-to-pointer decay are Ch 17 concepts. The function signature `Employee* findById(Employee employees[], int size, int targetId)` relies on array decay which is formally taught in Ch 17.
- **Fix needed**: Restructure to use a fixed number of named variables, or acknowledge the C-style array as a preview concept.

---

### [MEDIUM] Lesson 13.x -- "Chapter 13 summary and quiz"

- **Type**: forward-reference
- **Location**: exercise 1 ("Inventory Item Tracker with Enum and Struct") -- `Item items[5]`
- **Details**: Uses a C-style array `Item items[5]`. The prompt explicitly says "Do not use `std::vector` or any container from Chapter 16+" but then uses a C-style array which is from Chapter 17. This is self-contradictory.
- **Fix needed**: Either use individually named variables (limiting to a small fixed count) or acknowledge that a plain C-style array is being used as a simple storage mechanism pending formal array coverage.

---

### [MEDIUM] Lesson 13.x -- "Chapter 13 summary and quiz"

- **Type**: forward-reference
- **Location**: exercise 2 ("Generic Pair Statistics with Class Template") -- CTAD on user-defined aggregate
- **Details**: The exercise requires CTAD on a user-defined `Pair` struct (`Pair p3{ d1, d2 };`). CTAD for aggregates requires C++20. The lesson 13.14 summary correctly notes: "For aggregate class templates (structs with no user-declared constructors), CTAD from brace initialization requires C++20." This is fine if the judge uses C++20, but should be explicitly noted. Additionally, this exercise is in the chapter summary quiz (13.x) and appropriately uses CTAD since 13.14 has been covered.
- **Fix needed**: Ensure the judge compiles with C++20 or later. Add a note to the exercise that C++20 is required for aggregate CTAD.

---

### [LOW] Lesson 13.14 -- "Class template argument deduction (CTAD) and deduction guides"

- **Type**: code-bug (pedagogical)
- **Location**: exercise 2 ("Labeled Value with Deduction Guide") -- deduction guide not exercised
- **Details**: The exercise asks students to write a deduction guide `Labeled(const char*, T) -> Labeled<T>;`. However, the solution code creates `Labeled item1{ label1, intVal };` where `label1` is `std::string`, not `const char*`. The deduction guide does not apply here -- instead, C++20 aggregate CTAD handles the deduction. The deduction guide would only matter if a string literal were passed directly (e.g., `Labeled{"count", 42}`), but no test case exercises that path.
- **Fix needed**: Either add a `Labeled` creation using a string literal (e.g., `Labeled item3{"test", 0};`) to actually exercise the deduction guide, or remove the deduction guide requirement and focus purely on C++20 aggregate CTAD.

## Lessons Verified Clean

The following lessons were audited and found to have no issues in their summaries or exercises:

- **13.2** -- "Unscoped enumerations": Both exercises are correct. Traffic Light and Day of Week exercises use only concepts available at this point (unscoped enums, `static_cast`, switch statements, `std::string`). Test cases verified.
- **13.3** -- "Unscoped enumerator integral conversions": Both exercises correctly demonstrate implicit integral conversion and `static_cast`. Test case arithmetic verified.
- **13.4** -- "Converting an enumeration to and from a string": Both exercises use `constexpr std::string_view` conversion functions and `if`/`else if` for string-to-enum. No forward references.
- **13.5** -- "Introduction to overloading the I/O operators": Both exercises correctly implement `operator<<` and `operator>>` overloads. This is the first lesson where I/O overloading is taught, so exercises here appropriately use it.
- **13.6** -- "Scoped enumerations (enum classes)": The Traffic Light exercise is clean. The Permission exercise has a bitwise AND issue (see issues above).
- **13.8** -- "Struct aggregate initialization": Both exercises demonstrate positional brace init, designated initializers, and value initialization correctly. Test cases verified.
- **13.9** -- "Default member initialization": Both exercises correctly demonstrate default member initializers with overriding. Test cases verified.
- **13.10** -- "Passing and returning structs": Both exercises correctly use `const&` and non-const `&` parameters and return by value. Test case arithmetic verified.
- **13.13** -- "Class templates": Both exercises correctly introduce class templates with explicit template arguments. No CTAD used (appropriate for this lesson). Test cases verified.
- **13.15** -- "Alias templates": Both exercises correctly use alias templates. The Coordinate exercise appropriately chains a struct template, an alias template, and a regular type alias. Test cases verified.
- **13.y** -- "Using a language reference": Both exercises use `std::string::substr` and `std::string::find` which are available from Ch 5 (`std::string`). No forward references.

## Summary Statistics

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 0     |
| MEDIUM   | 10    |
| LOW      | 3     |
| **Total**| **13**|

- **Lessons with issues**: 13.1, 13.6, 13.11, 13.12, 13.x, 13.14
- **Lessons verified clean**: 13.2, 13.3, 13.4, 13.5, 13.7, 13.8, 13.9, 13.10, 13.13, 13.15, 13.y

## Recurring Patterns

### 1. C-style arrays used before formal introduction (5 exercises)
C-style arrays (`Type arr[N]`) are used in exercises across 13.1 (exercise 2), 13.11 (exercise 2), 13.12 (exercise 1), and 13.x (exercise 1). C-style arrays are formally introduced in Chapter 17.7. Several exercises explicitly say "do not use `std::vector`" but then use C-style arrays -- which are also from a later chapter. **Recommendation**: For exercises that need multiple struct instances, either use a small fixed number of named variables, or add an explicit note that plain C-style arrays are being used as simple storage and will be formally covered in Chapter 17.

### 2. Platform-dependent sizeof in test cases (2 exercises)
Lessons 13.11 exercise 1 and exercise 2 both print `sizeof` results and hardcode expected values in test cases. `sizeof(std::string)` varies by standard library implementation (32 on libstdc++, 24 on libc++), and struct padding is ABI-dependent. **Recommendation**: Either remove sizeof from testable output, or make test validation flexible for those specific lines.

### 3. Structured bindings used without formal introduction (2 exercises)
Lesson 13.1 exercises 1 and 2 require structured bindings (`auto [a, b] = ...`). This C++17 feature is not listed in any prior chapter's curriculum reference and is not in the Ch 13 introduction list either. The summary for 13.1 introduces it informally. **Recommendation**: Either formally add structured bindings to the Ch 13 curriculum reference, or replace their usage with dot notation in early exercises.

### 4. C++20 aggregate CTAD dependency
Exercises 13.x (exercise 2) and 13.14 (exercise 2) rely on C++20 aggregate CTAD. This works if the judge compiles with `-std=c++20` or later, which should be verified. The lesson summaries correctly note the C++20 requirement.
