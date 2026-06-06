# Chapter 25 Audit: Virtual Functions

## Lesson Inventory

| # | Title | Sort |
|---|---|---|
| 25.1 | Pointers and references to the base class of derived objects | 0 |
| 25.2 | Virtual functions and polymorphism | 1 |
| 25.3 | The override and final specifiers, and covariant return types | 2 |
| 25.4 | Virtual destructors, virtual assignment, and overriding virtualization | 3 |
| 25.5 | Early binding and late binding | 4 |
| 25.6 | The virtual table | 5 |
| 25.7 | Pure virtual functions, abstract base classes, and interface classes | 6 |
| 25.8 | Virtual base classes | 7 |
| 25.9 | Object slicing | 8 |
| 25.10 | Dynamic casting | 9 |
| 25.11 | Printing inherited classes using operator<< | 10 |
| 25.x | Chapter 25 summary and quiz | 11 |

---

## Within-Chapter Ordering Issues

### PASS: Virtual functions (25.2) come before override/final (25.3)
25.2 (sort 1) precedes 25.3 (sort 2). Correct.

### PASS: Virtual destructors (25.4) come after virtual functions (25.2)
25.4 (sort 3) follows 25.2 (sort 1). Correct.

### PASS: Early/late binding (25.5) comes after virtual functions (25.2)
25.5 (sort 4) follows 25.2 (sort 1). Correct.

### PASS: Pure virtual (25.7) comes after virtual functions (25.2)
25.7 (sort 6) follows 25.2 (sort 1). Correct.

### PASS: Virtual base classes (25.8) come after needed concepts
25.8 (sort 7) follows virtual functions (25.2), override (25.3), and references the diamond problem from 24.9. All prerequisites met.

### PASS: Object slicing (25.9) comes after polymorphism (25.2)
25.9 (sort 8) follows 25.2 (sort 1). Correct.

### PASS: dynamic_cast (25.10) comes after virtual functions (25.2)
25.10 (sort 9) follows 25.2 (sort 1). Correct.

### No out-of-scope concept references found
No references to CRTP, concepts/requires, coroutines, modules, std::variant, std::any, or other beyond-curriculum topics in any lesson summary or exercise.

---

## Issues Found

---

### ISSUE 1 -- BUG (severity: medium) -- 25.2 Ex2 "Polymorphic shape areas": Missing virtual destructor on `Shape` base class

**Location**: Lesson 25.2, Exercise 2 ("Polymorphic shape areas"), solution code

**Problem**: The `Shape` base class has a virtual `area()` function and objects are deleted through `Shape*` pointers (`delete s`), but `Shape` has no virtual destructor. The destructor is implicitly non-virtual. Deleting a derived object through a base pointer without a virtual destructor is undefined behavior per the C++ standard.

```cpp
class Shape
{
public:
    virtual double area() const { return 0.0; }
    // NO virtual destructor
};
// ...
for (auto* s : shapes)
{
    delete s;  // UB: non-virtual destructor on base
}
```

**Fix**: Add `virtual ~Shape() = default;` to the `Shape` class.

**Pedagogical note**: This is especially bad because lesson 25.4 (virtual destructors) comes two lessons later and explicitly teaches this exact rule. The exercise teaches a wrong pattern before students learn the correction. Consider either (a) adding a virtual destructor here with a brief forward note, or (b) restructuring the exercise to avoid `delete` through base pointers (e.g., use stack-allocated objects with references).

---

### ISSUE 2 -- BUG (severity: medium) -- 25.3 Ex1 "Override specifier catches mismatches": Missing virtual destructor on `Animal`

**Location**: Lesson 25.3, Exercise 1, solution code

**Problem**: `Animal` objects are created with `new Cat{}` and stored in `Animal*` pointers, then deleted through those pointers. `Animal` has no virtual destructor. This is the same UB pattern as Issue 1.

```cpp
class Animal
{
public:
    virtual std::string speak() const { return "Animal says: ..."; }
    // NO virtual destructor
};
// ...
for (int i{0}; i < n; ++i)
{
    delete animals[i];  // UB: non-virtual destructor
}
```

**Fix**: Add `virtual ~Animal() = default;` to `Animal`.

---

### ISSUE 3 -- BUG (severity: low) -- 25.3 Ex2 "Covariant return types with final": Missing virtual destructor on `Shape`

**Location**: Lesson 25.3, Exercise 2, solution code

**Problem**: `Shape` objects are created with `new Circle{...}` or `new Square{...}`, stored as `Shape*`, and deleted through `Shape*`. `Shape` has no virtual destructor. Same UB pattern.

```cpp
class Shape
{
public:
    virtual Shape* clone() const { return new Shape{*this}; }
    virtual std::string describe() const { return "Shape"; }
    // NO virtual destructor
};
```

**Fix**: Add `virtual ~Shape() = default;` to `Shape`.

---

### ISSUE 4 -- BUG (severity: medium) -- 25.9 Ex2 "Fix the slicing bug": Missing virtual destructor on `Shape`

**Location**: Lesson 25.9, Exercise 2, solution code

**Problem**: The entire point of this exercise is to fix a polymorphic code pattern, yet the `Shape` class being used polymorphically with `delete` through base pointers has no virtual destructor. This is particularly ironic given this lesson comes after 25.4 which teaches virtual destructors.

```cpp
class Shape
{
public:
    virtual std::string label() const { return "Shape"; }
    virtual double area() const { return 0.0; }
    // NO virtual destructor
};
// ...
for (auto* s : shapes)
{
    delete s;  // UB
}
```

**Fix**: Add `virtual ~Shape() = default;` to `Shape`.

---

### ISSUE 5 -- TEST CASE (severity: high) -- 25.6 Ex1 "Measuring the vptr overhead": Platform-dependent sizeof values hardcoded

**Location**: Lesson 25.6, Exercise 1, all 3 test cases

**Problem**: The test cases hardcode `sizeof` values that are specific to a 64-bit platform with a particular ABI:

```
Plain: 4
OneVirtual: 16
TwoVirtuals: 16
Derived: 16
```

These values assume:
- `sizeof(int)` = 4
- `sizeof(void*)` = 8 (vptr)
- Alignment/padding to 8-byte boundary

On a 32-bit platform (or Judge0 configured differently), the vptr would be 4 bytes, and the sizes would be: Plain=4, OneVirtual=8, TwoVirtuals=8, Derived=8. On some exotic ABIs, int could be 2 bytes.

**Judge0 uses x86-64 Linux, so the hardcoded values are correct for the actual runtime environment**, but the exercise premise claims these as universal truths rather than platform-specific results. The test will pass in practice, but the exercise is pedagogically misleading.

**Fix**: Either (a) make the exercise print relative comparisons instead of absolute sizes (e.g., "OneVirtual is X bytes larger than Plain"), or (b) add a comment in the summary_md and prompt noting these values are platform-specific.

---

### ISSUE 6 -- TEST CASE (severity: high) -- 25.6 Ex2 "Vtable dispatch in action": Platform-dependent sizeof values hardcoded

**Location**: Lesson 25.6, Exercise 2, all 3 test cases

**Problem**: Same issue as Issue 5. Test cases hardcode `Base 8`, `Alpha 8`, `Beta 16`. These assume sizeof(vptr)=8 on 64-bit.

Additionally, the exercise has a conceptual issue: `sizeof(*ptr)` where `ptr` is `Base*` always yields `sizeof(Base)`, not the dynamic type's size. The exercise works around this by storing the type string and selecting sizeof manually. The prompt says "This mirrors what you would see if you inspected each object's actual memory footprint" which is accurate, but the mechanism is awkward and could confuse students into thinking `sizeof(*ptr)` gives the dynamic size.

**Fix**: Same as Issue 5.

---

### ISSUE 7 -- PEDAGOGICAL (severity: low) -- 25.1 Ex2: `std::to_string` output is implementation-defined for precision

**Location**: Lesson 25.1, Exercise 2 ("Function taking Base& hides derived behavior")

**Problem**: The exercise uses `std::to_string(m_radius)` and expects output like `r=5.000000` (6 decimal places). The C++ standard says `std::to_string` for floating-point values produces the same output as `std::sprintf(buf, "%f", value)`, which yields 6 decimal digits. This is technically correct, but the test expectations depend on this default precision.

The test cases match this behavior:
- Input `5` -> `r=5.000000` (correct)
- Input `2.5` -> `r=2.500000` (correct)
- Input `10` -> `r=10.000000` (correct)

**Status**: PASS -- test cases are consistent with `std::to_string` behavior. No fix needed, but a minor pedagogical note that `std::to_string` always uses 6 decimal places would be helpful in the prompt.

---

### ISSUE 8 -- PEDAGOGICAL (severity: low) -- 25.5 lesson ordering is suboptimal

**Location**: Lesson 25.5 (Early binding and late binding), sort order 4

**Problem**: Early vs late binding is the conceptual foundation for understanding why `virtual` exists. Ideally it would come before or immediately after 25.2 (virtual functions). Currently it follows 25.4 (virtual destructors), placing a conceptual/explanatory lesson after multiple lessons that already assume the student understands the binding distinction.

That said, lesson 25.2's summary already explains "early binding (or static dispatch)" and "late binding (dynamic dispatch)" informally. Lesson 25.5 provides a deeper treatment. The current ordering is acceptable since 25.2 covers the basics, but moving 25.5 to sort order 2 (between 25.2 and 25.3) would create a more logical conceptual flow: "here's the problem (25.1) -> here's virtual functions (25.2) -> here's the underlying mechanism (25.5 early/late binding) -> here's how to use them safely (25.3 override/final)."

**Status**: Minor pedagogical suggestion, not a blocking issue.

---

### ISSUE 9 -- CODE (severity: low) -- 25.4 Ex2: Uses `static_cast` downcast before `dynamic_cast` is taught

**Location**: Lesson 25.4, Exercise 2 ("Resource-owning hierarchy with virtual destructor")

**Problem**: The exercise creates a `Resource` via `new` and stores it in a `Base*`, then needs to call `Resource::use()`. The prompt says to use `static_cast<Resource*>(ptr)->use()` and explicitly notes "Do not use dynamic_cast (that topic has not been covered yet)."

This is technically fine -- `static_cast` downcasting is valid when you know the actual type. The forward-reference avoidance note is appropriate. However, the need for a downcast at all is a code smell in an exercise about virtual destructors. The exercise could be redesigned to put `use()` as a virtual function in `Base` to avoid the downcast entirely, which would be a cleaner pedagogical pattern.

**Status**: Minor design suggestion. The code is technically correct.

---

### ISSUE 10 -- CODE (severity: low) -- 25.9 Ex1 "Spot the slice": Hardcoded literal `0` instead of demonstrating programmatic access

**Location**: Lesson 25.9, Exercise 1, solution code line: `std::cout << "Legs after slice: 0" << '\n';`

**Problem**: The exercise claims to demonstrate that derived data is lost during slicing, but instead of programmatically proving this (which is impossible since `Animal` has no `getLegs()`), it prints a hardcoded string `"Legs after slice: 0"`. This is valid from a pedagogical standpoint (you cannot access `m_legs` from an `Animal` object), but it weakens the demonstration. A student might wonder why they are just printing a constant.

**Status**: Acceptable but could be improved. Consider adding a virtual `int getLegs() const { return 0; }` to `Animal` and `int getLegs() const override { return m_legs; }` to `Cat`, then calling `sliced.getLegs()` to show that slicing causes the virtual dispatch to return the base version.

---

### ISSUE 11 -- CODE (severity: low) -- Multiple exercises use raw `new`/`delete` where `std::unique_ptr` is available

**Location**: 25.2 Ex2, 25.3 Ex1, 25.3 Ex2, 25.5 Ex2, 25.6 Ex2, 25.7 Ex1, 25.7 Ex2, 25.9 Ex2, 25.10 Ex1, 25.10 Ex2, 25.11 Ex2

**Problem**: Students have learned `std::unique_ptr` (Ch 22.5) and `std::make_unique` before reaching Ch 25. Many exercises use raw `new`/`delete` for polymorphic object management. While raw pointers are not wrong and the exercises correctly clean up memory, using `std::unique_ptr` would be the modern C++ best practice and would eliminate the risk of memory leaks.

The chapter summary quiz (25.x) correctly uses `std::unique_ptr` in both exercises, which is good. But the earlier exercises miss this opportunity.

**Status**: Not a bug, but a missed opportunity to reinforce modern C++ idioms. The 25.x exercises set a good example.

---

### ISSUE 12 -- PASS -- No forward-reference violations to post-chapter concepts

All exercises in Chapter 25 use only concepts from Chapters 0-24 plus concepts introduced in earlier lessons within Chapter 25 itself. Verified:

- `std::vector` (Ch 16) -- used throughout
- `std::unique_ptr`, `std::make_unique` (Ch 22) -- used in 25.x
- `std::move` (Ch 22) -- used in 25.x Ex2
- `std::string`, `std::string_view` (Ch 5) -- used throughout
- `std::to_string` (available via `<string>`) -- used in 25.1 Ex2
- `std::ostringstream`, `std::fixed`, `std::setprecision` (available via `<sstream>`, `<iomanip>`) -- used in 25.3 Ex2, 25.7 Ex2
- `operator<<` overloading (Ch 21) -- used in 25.11
- `friend` functions (Ch 15) -- used in 25.11
- Inheritance, multiple inheritance (Ch 24) -- used throughout
- `new`/`delete` (Ch 19) -- used throughout
- `dynamic_cast` -- introduced in 25.10, used only in 25.10 and 25.x (later)
- `std::move` used in 25.x with `std::string` constructor parameter -- correct (Ch 22)

No use of CRTP, concepts/requires, coroutines, modules, `std::variant`, `std::any`, `constexpr virtual`, or other out-of-scope features.

---

### ISSUE 13 -- PASS -- Override signatures are correct

Checked every exercise solution for override signature mismatches:

- All `override` specifiers match their base virtual function signatures (name, parameters, const qualification, return type)
- Covariant return types in 25.3 Ex2 are correctly applied (`Circle*` overriding `Shape*`, `Square*` overriding `Shape*`)
- No instances of hiding instead of overriding in solution code

---

### ISSUE 14 -- PASS -- Object slicing only occurs where intended

Verified that object slicing only occurs intentionally in:
- 25.9 Ex1: Deliberately demonstrates slicing with `Animal sliced{cat};`
- 25.9 Ex2: The "buggy" version would slice; the solution fixes it with pointers

No accidental slicing found in other exercises (all use pointers or references for polymorphic dispatch).

---

### ISSUE 15 -- PASS -- Test case outputs verified

Manually verified all non-trivial numerical test cases:

- **25.2 Ex2 Test1**: pi*25 + 24 = 78.539... + 24 = 102.539..., truncated = 102. Expected: 102. MATCH.
- **25.2 Ex2 Test2**: pi*1 + pi*4 + pi*9 = pi*14 = 43.982..., truncated = 43. Expected: 43. MATCH.
- **25.7 Ex1 Test1**: 3.14159265 * 25 = 78.5398..., formatted to 2 dp = 78.54. Expected: "Area: 78.54". MATCH.
- **25.7 Ex1 Test3**: 3.14159265 * 1 = 3.14159..., formatted to 2 dp = 3.14. Expected: "Area: 3.14". MATCH.
- **25.9 Ex2 Test1**: pi*25=78 (truncated), rect=24, pi*1=3 (truncated). Expected: 78, 24, 3. MATCH.
- **25.9 Ex2 Test3**: pi*10000=31415.9..., truncated = 31415. Expected: 31415. MATCH.
- **25.x Ex1 Test1**: pi*25=78.54, rect=24.00, pi*1=3.14, total=105.68. MATCH.
- **25.x Ex1 Test3**: pi*100=314.16, pi*0.25=0.79, total=314.95. MATCH.

---

## Summary

| Severity | Count | Description |
|---|---|---|
| **High** | 2 | Platform-dependent sizeof values hardcoded in test cases (25.6 Ex1, 25.6 Ex2) |
| **Medium** | 3 | Missing virtual destructors causing UB when deleting through base pointers (25.2 Ex2, 25.3 Ex1, 25.9 Ex2) |
| **Low** | 5 | Missing virtual destructor (25.3 Ex2), suboptimal lesson ordering (25.5), static_cast downcast design (25.4 Ex2), hardcoded slicing output (25.9 Ex1), raw new/delete instead of smart pointers (multiple) |

### Required Fixes (High + Medium)

1. **25.2 Ex2**: Add `virtual ~Shape() = default;` to `Shape`.
2. **25.3 Ex1**: Add `virtual ~Animal() = default;` to `Animal`.
3. **25.3 Ex2**: Add `virtual ~Shape() = default;` to `Shape`.
4. **25.9 Ex2**: Add `virtual ~Shape() = default;` to `Shape`.
5. **25.6 Ex1 + Ex2**: Either accept that these are 64-bit-specific and note it clearly, or redesign to use relative size comparisons instead of absolute values. If the Judge0 runtime is always x86-64, the tests will pass, but the pedagogy should acknowledge platform dependence.

### Counts

- **Lessons audited**: 12 (25.1 through 25.x)
- **Exercises audited**: 22
- **Test cases audited**: 66
- **Forward-reference violations**: 0
- **Out-of-scope concept references**: 0
- **Ordering issues**: 0 blocking, 1 minor suggestion (25.5)
- **Code correctness bugs**: 4 (missing virtual destructors causing UB)
- **Test case mismatches**: 0 value errors, 2 platform-dependency issues
