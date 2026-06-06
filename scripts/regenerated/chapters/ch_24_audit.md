# Chapter 24 Audit: Inheritance

## Audit metadata
- **Auditor:** Claude Opus 4.6
- **Date:** 2025-06-05
- **Chapter:** 24 -- Inheritance (lessons 24.1 through 24.x)
- **Prerequisite boundary:** Students know Ch 0--23 (through object relationships, std::initializer_list). Students do NOT know: virtual functions, override, final, polymorphism, pure virtual, abstract classes, dynamic_cast, vtable, object slicing (all Ch 25).

---

## Lesson-by-lesson findings

### 24.1 -- Introduction to inheritance

**Forward-reference violations:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 1 | **MEDIUM** | Summary, paragraph 3 | Text states: *"Inheritance also opens the door to **polymorphism** -- the ability to treat different derived types through a common base interface -- which later chapters will explore in depth."* While it does say "later chapters will explore," the term **polymorphism** is defined and explained here (not merely name-dropped). This gives students a concrete mental model of a Ch 25 concept before they have the prerequisites. The sentence should be removed or reduced to a bare forward pointer such as "Inheritance also enables powerful techniques covered in Chapter 25." |

**Within-chapter ordering:** OK. This lesson correctly precedes construction order (24.3) and constructors (24.4).

**Code correctness:** No bugs. The `Person`/`Student` example uses public data members for simplicity, which is acceptable for a first introduction.

**Exercise 1 (Basic Inheritance: Vehicle and Car):**
- Code and test cases: Correct. Output matches solution.
- No forbidden keywords.

**Exercise 2 (Inheritance hierarchy: Person, Student, GradStudent):**
- Code and test cases: Correct. Output matches solution.
- No forbidden keywords.

---

### 24.2 -- Basic inheritance in C++

**Forward-reference violations:** None found. The summary correctly discusses what is and is not inherited without mentioning virtual functions, override, or polymorphism.

**Within-chapter ordering:** OK. Logically follows 24.1's introduction.

**Code correctness:**
- The `Animal`/`Dog` example in the summary is clean.
- Summary says *"Destructors and copy/move assignment operators are likewise not inherited."* This is accurate.

**Exercise 1 (Derive a Student from Person):**
- Code and test cases: Correct.

**Exercise 2 (Vehicle hierarchy with inherited behavior):**
- Code and test cases: Correct.
- Uses `std::fixed` and `std::setprecision(1)` appropriately.

---

### 24.3 -- Order of construction of derived classes

**Forward-reference violations:** None found.

**Within-chapter ordering:** OK. Construction order logically precedes the "how to pass arguments to base constructors" lesson (24.4).

**Code correctness:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 2 | **LOW** | Exercise 1, solution + test cases | The `Base` default constructor prints `"Base(unnamed) constructed"` because `m_name` has default value `"unnamed"`. Then the `Derived` constructor assigns the actual name to `m_name` inside its body (not in the member initializer list). The `Base` destructor prints `"Base(Widget) destroyed"` (with the final name, not "unnamed") because the assignment in `Derived`'s constructor body mutated the shared member. This is intentional and the test cases account for it, but it's a **pedagogically confusing pattern**: the Base constructor prints a value that is immediately replaced. The summary even says *"This is necessary because a derived class does not inherit the base class's constructors. The derived constructor must explicitly delegate to a base constructor so that the base portion of the object is properly initialized."* (from 24.2), yet this exercise deliberately avoids passing the name to Base's constructor. This pattern works but contradicts best practices taught in 24.4. However, since 24.4 follows this lesson, it serves as deliberate motivation. No change required, but a note in the exercise prompt acknowledging the "unnamed" initial state would improve clarity. |

**Exercise 2 (Multi-level construction order):**
- Code and test cases: Correct. The `Pet` constructor assigns `m_name` in its body (same pattern as Exercise 1).
- No forbidden keywords.

---

### 24.4 -- Constructors and initialization of derived classes

**Forward-reference violations:** None found.

**Within-chapter ordering:** OK. Properly follows 24.3 (construction order) and builds on it.

**Code correctness:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 3 | **MEDIUM** | Exercise 1 (Passing Arguments), starter code | The starter code's `Car` constructor has `Vehicle{0}` as a deliberate bug for the student to fix. However, the exercise **does not have a `difficulty` field** in the JSON. All other exercises in this chapter include `"difficulty": "practice"`. This is a missing field. |
| 4 | **MEDIUM** | Exercise 2 (Three-Level Constructor Chain), starter code | Same issue: the starter code's `BossMonster` constructor passes `0` for health to `Monster` as a deliberate bug. Also **missing the `difficulty` field** in JSON. |

**Exercise 1 test cases:** Correct. Output matches solution.
**Exercise 2 test cases:** Correct. Output matches solution.

---

### 24.5 -- Inheritance and access specifiers

**Forward-reference violations:** None found.

**Within-chapter ordering:** OK. Access specifiers properly follow the basic inheritance and constructor lessons.

**Code correctness:** No bugs.

**Exercise 1 (Protected member access):**
- Code and test cases: Correct.

**Exercise 2 (Private inheritance hides the base interface):**
- Code and test cases: Correct.
- The `Stack` exercise effectively demonstrates private inheritance by re-exposing only `size()` through a wrapper. Good pedagogical design.

---

### 24.6 -- Adding new functionality to a derived class

**Forward-reference violations:** None found.

**Within-chapter ordering:** OK. Adding functionality logically precedes overriding behavior (24.7).

**Code correctness:** No bugs.

**Exercise 1 (Extending a Vehicle Class):**
- Code and test cases: Correct.

**Exercise 2 (Bank Account with Interest):**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 5 | **LOW** | Exercise 2, test case "Compounding three times" | The expected output `Balance: 13310` for `10000 * (1.10)^3` using integer arithmetic: Round 1: `10000 + 10000*10/100 = 11000`. Round 2: `11000 + 11000*10/100 = 12100`. Round 3: `12100 + 12100*10/100 = 13310`. This is correct. |
| 6 | **LOW** | Exercise 2, test case "Small balance with truncation" | `33 * 7 / 100 = 2` (integer division). Round 1: `33 + 2 = 35`. Round 2: `35 * 7 / 100 = 2`, so `35 + 2 = 37`. Expected: `37`. Correct. |

---

### 24.7 -- Calling inherited functions and overriding behavior

**Forward-reference violations:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 7 | **HIGH** | Summary, paragraph 1 | Text says: *"In C++, a derived class can **redefine** (hide) a base class member function..."* This is correct terminology. However, the lesson title is "Calling inherited functions and **overriding** behavior." The word "overriding" in C++ specifically refers to virtual function overriding (Ch 25). The summary text itself correctly uses "name hiding" and "redefine" throughout, and explicitly states: *"This is compile-time **name hiding**, not runtime polymorphism (virtual function overriding comes in Chapter 25)."* The lesson title and summary body contradict each other. The title uses "overriding" loosely, but the body correctly clarifies. The title should be changed to something like "Calling inherited functions and redefining behavior" to avoid confusing students who will later learn that "overriding" has a precise meaning tied to `virtual`. |
| 8 | **LOW** | Summary, paragraph 4 | Text states: *"This is compile-time name hiding, not runtime polymorphism (virtual function overriding comes in Chapter 25)."* This appropriately defers to Ch 25, but explicitly names "runtime polymorphism" and "virtual function overriding" as concepts. These are brief forward pointers rather than explanations, so this is borderline acceptable. |

**Within-chapter ordering:** OK.

**Code correctness:** No bugs.

**Exercise 1 (Extending Base Greetings):**
- Code and test cases: Correct.

**Exercise 2 (Shape Area Reporter):**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 9 | **LOW** | Exercise 2, test case "Fractional dimensions" | `2.5 * 4.2 = 10.5`. Expected: `Shape area: 10.5`. Correct. |

---

### 24.8 -- Hiding inherited functionality

**Forward-reference violations:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 10 | **LOW** | Summary, final paragraph | Text states: *"Both techniques apply only when accessed through the derived type. A pointer or reference to the base type bypasses the hiding entirely. This is an inherent limitation of the non-virtual approach -- true interface enforcement across pointer types requires virtual functions (covered later)."* This is a forward pointer to Ch 25 concepts. The mention of "virtual functions" is brief and deferred. Borderline acceptable but introduces the idea that virtual functions solve a problem before students know what virtual functions are. |

**Within-chapter ordering:** OK. Follows 24.7 (overriding/redefining) naturally.

**Code correctness:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 11 | **MEDIUM** | Exercise 1 (Restricting access), solution code | The solution creates a `Base& baseRef{ ro };` and calls `baseRef.getValue()`. This demonstrates accessing the base interface through a base reference. While this is technically allowed (it uses a concept from Ch 12 -- references), it subtly introduces the pattern of "treating a derived object through a base reference," which is the foundation of polymorphism (Ch 25). The exercise prompt explicitly asks for this, and the context is about demonstrating that hiding only works through the derived type, not about polymorphism. This is acceptable as a demonstration of the hiding limitation, but note that if a student asks "what else can I do with a base reference to a derived object?" the answer leads directly to Ch 25. |

**Exercise 2 (Deleting inherited functions in a FixedArray):**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 12 | **MEDIUM** | Exercise 2, `DynamicArray` class | The `DynamicArray` class uses raw `new[]`/`delete[]` and lacks copy constructor/copy assignment operator. If a `DynamicArray` (or `FixedArray`) object were copied, it would cause a double-free. The class has no `= delete` on copy operations and no user-defined copy constructor. While the exercise code never copies the object, this is a latent bug that could confuse students who try to extend the exercise. The class should either delete copy/move operations or provide them. Students know the rule of three/five from Ch 21.13 and move semantics from Ch 22. |

---

### 24.9 -- Multiple inheritance

**Forward-reference violations:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 13 | **LOW** | Summary, paragraph on the diamond problem | Text states: *"C++ has a mechanism to solve it (virtual base classes, covered later), but the diamond is a strong signal that the design should be reconsidered."* The term "virtual base classes" is named but not explained. This is an acceptable forward pointer. |
| 14 | **LOW** | Summary, final paragraph | Text states: *"Most production C++ codebases restrict multiple inheritance to narrow cases like inheriting from multiple abstract interfaces, where there are no data members to duplicate."* The term "abstract interfaces" is a Ch 25 concept (pure virtual functions, abstract classes). However, it is used here as practical guidance rather than taught material. Borderline acceptable. |

**Within-chapter ordering:** OK. Multiple inheritance is correctly placed last before the chapter summary, as the curriculum reference specifies.

**Code correctness:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 15 | **LOW** | Summary code example | The example has `Widget` inheriting from both `Printable` and `Serializable`, which both have `int m_id{}`. Access uses `w.Printable::m_id = 1` and `w.Serializable::m_id = 2`. This is correct C++ and correctly demonstrates the ambiguity. |

**Exercise 1 (Multi-base disambiguation):**
- Code and test cases: Correct.

**Exercise 2 (Diamond ambiguity resolver):**
- Code and test cases: Correct.
- The exercise correctly demonstrates the diamond problem without using virtual base classes (which are Ch 25).

---

### 24.x -- Chapter 24 summary and quiz

**Forward-reference violations:**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 16 | **LOW** | Summary section on multiple inheritance | Text states: *"While C++ provides solutions (such as explicit scope resolution), multiple inheritance adds significant complexity and should be used sparingly."* This does not mention virtual base classes. Clean. |

**Code correctness:**

**Exercise 1 (Employee Hierarchy with Construction Order and Overrides):**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 17 | **LOW** | Exercise 1, title and prompt | The title says "Overrides" which carries the same concern as finding #7: in C++, "override" refers to virtual function overriding. The prompt uses the word "Overrides" in the prompt text: *"redefines/overrides describe()"*. Since the lesson 24.7 summary explicitly distinguishes name hiding from virtual overriding, using the word "overrides" in the quiz exercise title is inconsistent with the chapter's own correction. Suggest changing to "Redefinitions" or "Redefining Behavior." |

- Solution code and test cases: Correct. The construction/destruction trace and describe() chain work as expected.

**Exercise 2 (Protected Access and Hiding Inherited Functions):**

| # | Severity | Location | Detail |
|---|----------|----------|--------|
| 18 | **MEDIUM** | Exercise 2, prompt and solution | The prompt says: *"Hides `setSpeed` by declaring `void setSpeed(int) = delete` would prevent compilation, so instead override `setSpeed(int)` to print..."* This is confusing. It starts describing `= delete`, then pivots to a redefinition approach. The phrase "override `setSpeed(int)`" again uses the word "override" incorrectly for a non-virtual function. The prompt should say "redefine" instead. |
| 19 | **LOW** | Exercise 2, `RaceCar` solution | The solution adds a `getSpeed()` method that is not declared in the prompt requirements. The prompt does not mention `getSpeed()`, but the solution uses it in `main()` to print speed after each boost. The starter code's `main()` loop has a comment `// TODO: Call boost and print "Boost <i>: <currentSpeed> km/h"` but provides no way to access speed without `getSpeed()`. The student would need to infer that they need to add this getter. The prompt should list `getSpeed()` as a required method. |

- Test cases: Correct. Output matches the solution.

---

## Summary of all findings

### Forward-reference violations (Ch 25 concepts)

| # | Severity | Lesson | Keyword/Concept | Recommendation |
|---|----------|--------|-----------------|----------------|
| 1 | MEDIUM | 24.1 | "polymorphism" defined | Remove the definition; keep only a bare mention that inheritance "enables techniques covered in Chapter 25" |
| 7 | HIGH | 24.7 | Lesson title says "overriding" | Rename to "Calling inherited functions and redefining behavior" |
| 8 | LOW | 24.7 | "runtime polymorphism", "virtual function overriding" mentioned | Acceptable as forward pointers, but could be shortened |
| 10 | LOW | 24.8 | "virtual functions (covered later)" mentioned | Acceptable as a brief forward pointer |
| 13 | LOW | 24.9 | "virtual base classes" named | Acceptable as a brief forward pointer |
| 14 | LOW | 24.9 | "abstract interfaces" mentioned | Acceptable as practical guidance |
| 17 | LOW | 24.x | Exercise title says "Overrides" | Change to "Redefinitions" |
| 18 | MEDIUM | 24.x | Exercise prompt says "override setSpeed" | Change to "redefine setSpeed" |

### Code correctness bugs

| # | Severity | Lesson | Detail |
|---|----------|--------|--------|
| 12 | MEDIUM | 24.8 | `DynamicArray` has no copy/move protection -- rule of three/five violation. Copy would cause double-free. |

### Pedagogical / structural issues

| # | Severity | Lesson | Detail |
|---|----------|--------|--------|
| 2 | LOW | 24.3 | Exercise uses assignment-in-body pattern that contradicts the best practice taught in 24.4 (member initializer list delegation). Intentional as motivation but could be clarified. |
| 3 | MEDIUM | 24.4 | Exercise 1 missing `"difficulty"` field in JSON. |
| 4 | MEDIUM | 24.4 | Exercise 2 missing `"difficulty"` field in JSON. |
| 19 | LOW | 24.x | Exercise 2 solution uses `getSpeed()` which is not listed in the prompt requirements. |

### Within-chapter ordering issues

None found. The lesson ordering is sound:
1. 24.1: Introduction (is-a, why)
2. 24.2: Basic syntax (class Derived : public Base)
3. 24.3: Construction/destruction order
4. 24.4: Constructors passing arguments to base
5. 24.5: Access specifiers (public/protected/private inheritance, protected members)
6. 24.6: Adding new functionality
7. 24.7: Redefining (hiding) inherited functions
8. 24.8: Hiding inherited functionality (using declarations, = delete)
9. 24.9: Multiple inheritance (correctly last)
10. 24.x: Summary and quiz

### Test case mismatches

None found. All test cases produce output consistent with their solution code.

### Forbidden keyword scan results

| Keyword | Occurrences | Locations |
|---------|-------------|-----------|
| `virtual` (as C++ keyword in code) | 0 | -- |
| `override` (as C++ keyword in code) | 0 | -- |
| `final` (as C++ keyword in code) | 0 | -- |
| `dynamic_cast` | 0 | -- |
| `vtable` / `v-table` | 0 | -- |
| `pure virtual` | 0 | -- |
| `= 0` (pure virtual syntax) | 0 | -- |
| `object slicing` | 0 | -- |
| "polymorphism" (in prose) | 1 | 24.1 summary (finding #1) |
| "virtual function overriding" (in prose) | 1 | 24.7 summary (finding #8) |
| "virtual functions" (in prose) | 1 | 24.8 summary (finding #10) |
| "virtual base classes" (in prose) | 1 | 24.9 summary (finding #13) |
| "abstract interfaces" (in prose) | 1 | 24.9 summary (finding #14) |
| "overriding"/"override" (in titles/prompts, non-code) | 3 | 24.7 title, 24.x Ex1 title, 24.x Ex2 prompt (findings #7, #17, #18) |

---

## Recommended fixes (priority order)

1. **[HIGH]** Rename lesson 24.7 title from "Calling inherited functions and overriding behavior" to "Calling inherited functions and redefining behavior."
2. **[MEDIUM]** Lesson 24.1 summary: Remove or reduce the polymorphism definition. Replace with: *"Inheritance also enables powerful techniques covered in Chapter 25."*
3. **[MEDIUM]** Lesson 24.x Exercise 2 prompt: Change "override setSpeed(int)" to "redefine setSpeed(int)."
4. **[MEDIUM]** Lesson 24.4: Add `"difficulty": "practice"` to both exercises.
5. **[MEDIUM]** Lesson 24.8 Exercise 2: Add `DynamicArray(const DynamicArray&) = delete;` and `DynamicArray& operator=(const DynamicArray&) = delete;` to prevent accidental copies (students know rule of three/five from Ch 21).
6. **[LOW]** Lesson 24.x Exercise 1: Rename from "...Overrides" to "...Redefinitions" or "...Redefining Behavior."
7. **[LOW]** Lesson 24.x Exercise 2: Add `getSpeed()` to the prompt requirements list so students know they need it.
