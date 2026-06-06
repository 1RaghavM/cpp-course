# Chapter 21 Audit: "Operator Overloading"

## Audit Criteria
1. **Forward references** -- concepts NOT yet available in Ch 21:
   - Move semantics, rvalue references (`&&`), `std::move` (Ch 22)
   - Smart pointers (`std::unique_ptr`, `std::shared_ptr`) (Ch 22)
   - `std::initializer_list` (Ch 23)
   - Inheritance, `protected`, derived classes (Ch 24)
   - Virtual functions, `override`, `final`, abstract classes (Ch 25)
   - Note: everything through Ch 20 IS available -- classes, destructors, friends, static members, `new`/`delete`, vectors, arrays, iterators, algorithms, lambdas, `std::function`, function pointers, templates
2. **Within-chapter ordering** -- later lessons must not assume knowledge from earlier lessons beyond their `sort_order`
3. **Exercise progression, factual errors, code correctness, test case mismatches**

---

## Lesson 21.1 -- Introduction to operator overloading

### Summary

- **PASS (no forward references).** Overview of operator overloading concepts: arity, precedence, three implementation forms (member, friend, normal). All concepts are within scope.
- **Factual accuracy:** Correct. Lists non-overloadable operators (`::`, `sizeof`, `?:`, `.`, `.*`). States that `=`, `[]`, `()`, `->` must be member functions. All accurate.
- **Minor note:** Summary mentions "protected members" in passing ("If private access is required and the operator is symmetric, prefer a friend"). This is acceptable since it does not explain or require `protected`, which is Ch 24.

### Exercise 1: "Identify valid overloads"

- **PASS.** Simple string comparison exercise. Uses `std::string`, `std::cin`, `if/else`. All available.
- **Test cases:** Correct. `+` -> can, `::` -> cannot, `?:` -> cannot.
- **Code quality:** Clean, appropriate difficulty for an introductory exercise.

### Exercise 2: "Point addition via friend operator+"

- **PASS.** Demonstrates friend `operator+` with a 2D point class. All concepts available.
- **Test cases:** Correct. (3+2, 5+7)=(5,12). (-4+4, 6+-6)=(0,0). (9999+1, -10000+10000)=(10000,0).
- **Code quality:** Good.

---

## Lesson 21.2 -- Overloading the arithmetic operators using friend functions

### Summary

- **PASS (no forward references).** Covers friend-based arithmetic overloads, `const&` parameters, return by value. All within scope.
- **Factual accuracy:** Correct.
- **Pedagogical note:** Summary mentions implementing compound assignment (`+=`) first and defining binary `+` in terms of it. However, compound assignment operators are not formally covered as a lesson topic in this chapter. This is a minor inconsistency -- the ch_21.x summary also mentions this pattern. Not a forward reference, just a slightly informal introduction of a technique.

### Exercise 1: "Fraction Addition and Subtraction"

- **PASS.** Friend `operator+` and `operator-` for `Fraction`. All available concepts.
- **Test cases:** Let me verify:
  - Input `1 2 3 4`: sum = (1*4 + 3*2)/(2*4) = 10/8. diff = (1*4 - 3*2)/(2*4) = -2/8. Expected: `10/8\n-2/8\n`. **Correct.**
  - Input `-3 5 2 5`: sum = (-3*5 + 2*5)/(5*5) = -5/25. diff = (-3*5 - 2*5)/(5*5) = -25/25. Expected: `-5/25\n-25/25\n`. **Correct.**
  - Input `7 3 2 3`: sum = (7*3 + 2*3)/(3*3) = 27/9. diff = (7*3 - 2*3)/(3*3) = 15/9. Expected: `27/9\n15/9\n`. **Correct.**

### Exercise 2: "Vector2D Arithmetic"

- **PASS.** Friend `operator*` and `operator/` for `Vector2D`. All available concepts.
- **Test cases:** Correct. (3,4)*5=(15,20), (3,4)/2=(1,2). (-6,9)*3=(-18,27), (-6,9)/4=(-1,2). (0,-10)*7=(0,-70), (0,-10)/3=(0,-3).
- **Code quality:** Good.

---

## Lesson 21.3 -- Overloading operators using normal functions

### Summary

- **PASS (no forward references).** Covers non-friend non-member overloads using public getters. Mentions ADL (argument-dependent lookup).
- **Factual accuracy:** Correct. Good explanation of when to prefer normal vs. friend functions.

### Exercise 1: "Add and Subtract Fractions"

- **PASS.** Normal free function `operator+` and `operator-` using getters. All available.
- **Test cases:** Let me verify:
  - Input `1 2 1 3`: sum = (1*3 + 1*2)/(2*3) = 5/6. diff = (1*3 - 1*2)/(2*3) = 1/6. Expected: `5/6\n1/6\n`. **Correct.**
  - Input `-3 4 1 4`: sum = (-3*4 + 1*4)/(4*4) = -8/16. diff = (-3*4 - 1*4)/(4*4) = -16/16. Expected: `-8/16\n-16/16\n`. **Correct.**
  - Input `7 5 2 5`: sum = (7*5 + 2*5)/(5*5) = 45/25. diff = (7*5 - 2*5)/(5*5) = 25/25. Expected: `45/25\n25/25\n`. **Correct.**

### Exercise 2: "Scale a Point"

- **PASS.** Two overloads of `operator*` (Point*int and int*Point), delegation. All available.
- **Test cases:** Correct. Both orderings produce identical results.
- **Code quality:** Good. Demonstrates the delegation pattern.

---

## Lesson 21.4 -- Overloading the I/O operators

### Summary

- **PASS (no forward references).** Covers `operator<<` and `operator>>` as friend non-member functions. References lesson 13.5 (I/O overloading for enums), which is available.
- **Factual accuracy:** Correct. Good explanation of chaining and return-by-reference.
- **Minor note:** Summary mentions "file streams" and "string streams" and "any class derived from `std::ostream` or `std::istream`". This uses the word "derived" which implies inheritance (Ch 24). However, this is standard library vocabulary that students encounter naturally, not a teaching of inheritance concepts. **Acceptable, but could be clearer by saying "any type that works like `std::ostream`" to avoid inheritance terminology.**

### Exercise 1: "Print a Fraction"

- **PASS.** Friend `operator<<` for `Fraction`. All available.
- **Test cases:** Correct. `1/2 and 3/4`, `-5/8 and 7/3`, `0/1 and 100/99`.
- **Code quality:** Good.

### Exercise 2: "Read and Echo a Color"

- **PASS.** Friend `operator>>` and `operator<<` for `Color`. All available.
- **Test cases:** Correct. `rgb(255, 128, 0)`, `rgb(0, 0, 0)`, `rgb(255, 255, 255)`.
- **Code quality:** Good.

---

## Lesson 21.5 -- Overloading operators using member functions

### Summary

- **PASS (no forward references).** Covers member function overloads, implicit `*this` as left operand.
- **Factual accuracy:** Correct. States `=`, `[]`, `()`, `->` must be member functions; `<<` and `>>` must be non-member. All accurate.
- **Ordering check:** This lesson (sort_order 4) builds on friend functions (21.2, sort_order 1) and normal functions (21.3, sort_order 2) and I/O (21.4, sort_order 3). **Correct progression -- friend before normal before member is the standard learncpp.com ordering.**

### Exercise 1: "Point2D Addition"

- **PASS.** Member `operator+`. All available.
- **Test cases:** Correct. (1+3, 2+4)=(4,6). (-5+5, 10+-10)=(0,0). (0+-1000, 0+1000)=(-1000,1000).
- **Code quality:** Good.

### Exercise 2: "Fraction Multiplication"

- **PASS.** Member `operator*` with GCD reduction. Uses `std::abs` from `<cmath>`. All available.
- **Test cases:** Correct. 1/2 * 2/3 = 2/6 -> 1/3. -3/4 * 2/5 = -6/20 -> -3/10. 3/7 * 7/3 = 21/21 -> 1/1.
- **Code quality:** Good. The `reduce()` helper pattern is clean.

---

## Lesson 21.6 -- Overloading unary operators +, -, and !

### Summary

- **PASS (no forward references).** Covers unary `operator-`, `operator+`, and `operator!` as const member functions.
- **Factual accuracy:** Correct. Good explanation of return-by-value for unary operators (not reference).

### Exercise 1: "Negate a Vec2"

- **PASS.** Unary `-` and `+` for `Vec2`. All available.
- **Test cases:** Correct. -(3,7)=(-3,-7), +(3,7)=(3,7). -(-5,-2)=(5,2), +(-5,-2)=(-5,-2). -(0,0)=(0,0), +(0,0)=(0,0).
- **Code quality:** Good.

### Exercise 2: "Logical Not on a Counter"

- **PASS.** Unary `-` and `!` for `Counter`. Uses `std::boolalpha`. All available.
- **Test cases:** Correct. -42=-42, !42=false. -0=0, !0=true. -(-15)=15, !(-15)=false.
- **Code quality:** Good. Uses `explicit` constructor, which is known from Ch 14.16.

---

## Lesson 21.7 -- Overloading the comparison operators

### Summary

- **PASS (no forward references).** Covers `operator<=>` (spaceship operator) with `<compare>` header, `std::strong_ordering`, `std::partial_ordering`, `std::weak_ordering`.
- **Factual accuracy:** Correct. Accurately explains that defaulted `<=>` gives `==` for free, but user-provided `<=>` does not.
- **C++20 requirement:** Uses `<compare>` and `operator<=>`, which require C++20. This is acceptable since the course uses C++20 throughout (lesson 0.12 covers choosing a language standard).

### Exercise 1: "Fraction Equality and Ordering"

- **PASS.** Custom `operator<=>` and `operator==` using cross-multiplication. All available.
- **Test cases:** Let me verify:
  - Input `1 2\n2 4`: cross products: 1*4=4 vs 2*2=4. Equal. `<=` is true. Expected: `equal\nequivalent\ntrue\n`. **Correct.**
  - Input `1 3\n1 2`: cross products: 1*2=2 vs 1*3=3. 2<3, so less. `<=` is true. Expected: `not_equal\nless\ntrue\n`. **Correct.**
  - Input `7 2\n10 4`: cross products: 7*4=28 vs 10*2=20. 28>20, so greater. `<=` is false. Expected: `not_equal\ngreater\nfalse\n`. **Correct.**
- **Code quality:** Good. Uses `long long` to avoid overflow in cross-multiplication.

### Exercise 2: "Student Record Sorting with Default Spaceship"

- **PASS.** Defaulted `operator<=>` with `std::string` member. Uses C-style array of 3 students with manual sort.
- **ISSUE (minor -- C-style array):** Uses `Student students[3]` which is a C-style array (Ch 17.7). While this is technically available, the learncpp.com curriculum generally prefers `std::array` (Ch 17.1) over C-style arrays. Using `std::array<Student, 3>` would be more idiomatic. **Severity: low.**
- **Test cases:** Correct. Sorts by grade first, then name (due to member declaration order).
- **ISSUE (potential compilation):** `std::string` has `operator<=>` returning `std::strong_ordering` in C++20. The defaulted spaceship on `Student` will compare `m_grade` (int, strong_ordering) then `m_name` (string, strong_ordering). This works correctly in C++20. **PASS.**
- **Code quality:** Good.

---

## Lesson 21.8 -- Overloading the increment and decrement operators

### Summary

- **PASS (no forward references).** Covers prefix (return reference) and postfix (dummy int, return by value). Canonical postfix pattern: copy, prefix-increment, return copy.
- **Factual accuracy:** Correct. Good explanation of why prefix is preferred for performance.

### Exercise 1: "Prefix Increment and Decrement"

- **PASS.** Prefix `++` and `--` for `Gauge`. All available.
- **Test cases:** Correct. 10+3=13, 13-5=8. -7+4=-3, -3-0=-3. 0+0=0, 0-6=-6.
- **Code quality:** Good.

### Exercise 2: "Postfix Increment via Prefix"

- **PASS.** Both prefix and postfix `++` for `Score`. Canonical delegation pattern.
- **Test cases:** Correct. Start 0: (0,1)(1,2)(2,3). Start -2: (-2,-1)(-1,0)(0,1)(1,2). Start 999: (999,1000).
- **Code quality:** Good.

---

## Lesson 21.9 -- Overloading the subscript operator

### Summary

- **PASS (no forward references).** Covers `operator[]` as a member function, const and non-const overloads, return-by-reference.
- **Factual accuracy:** Correct.

### Exercise 1: "Graded Array"

- **PASS.** `operator[]` for a fixed-size array class. All available.
- **ISSUE (minor -- starter code inconsistency):** The starter code's `printGrade` function uses `list.get(index)` and `grades.set(index, newGrade)`, but the solution replaces the `main` body calls with `operator[]`. The `printGrade` function in the solution also changes from `list.get(index)` to `list[index]`. However, the starter code comment says `// TODO: replace get() calls with operator[] and use operator[] for assignment`, which is clear. **Acceptable.**
- **Test cases:** Correct. Grade at index 2 is 78, changed to 100. Grade at 0 is 50, changed to 55. Grade at 4 is 100, changed to 0.
- **Code quality:** Good.

### Exercise 2: "Name Lookup Table"

- **PASS.** `operator[]` for a string table with const and non-const overloads. All available.
- **Test cases:** Correct. Read Bob at index 1, swap Alice(0) and Carol(2) -> Carol at 0, Alice at 2. Read Xena at 0, swap Yuri(1) with Yuri(1) -> no change. Read Charlie at 2, swap Alpha(0) and Echo(4) -> Echo at 0, Alpha at 4.
- **Code quality:** Good.

---

## Lesson 21.10 -- Overloading the parenthesis operator

### Summary

- **PASS (no forward references).** Covers functors, `operator()`, relationship to lambdas and algorithms.
- **Factual accuracy:** Correct. Good explanation that lambdas are anonymous functors behind the scenes.
- **Uses `std::vector` and `std::count_if`:** Both are available from Ch 16 and Ch 18 respectively. **PASS.**

### Exercise 1: "Accumulator Functor"

- **PASS.** Simple functor with state. All available.
- **Test cases:** Correct. Running totals: 10,30,60,100. 5,2,10,0,2. -7.
- **Code quality:** Good.

### Exercise 2: "Custom Sort with a Functor"

- **PASS.** `AbsCompare` functor with `std::stable_sort`. `std::vector`, `<algorithm>` all available.
- **Test cases:** Correct. Sorts by absolute value, preserving stability.
- **Code quality:** Good. Manual absolute value computation (no `std::abs`) is a reasonable pedagogical choice.

---

## Lesson 21.11 -- Overloading typecasts

### Summary

- **PASS (no forward references).** Covers `operator TargetType()`, `explicit` conversion operators, special rule for `explicit operator bool()`.
- **ISSUE (minor forward reference in text):** Summary mentions `std::unique_ptr` as an example of a type that defines `explicit operator bool()`. `std::unique_ptr` is introduced in Ch 22. While this is just a passing mention and doesn't require understanding smart pointers, it does reference a Ch 22 concept. **Severity: low.** Could replace with `std::optional` (Ch 12.15) which also has `explicit operator bool()`.
- **Factual accuracy:** Otherwise correct. Good explanation of implicit vs explicit conversion dangers.

### Exercise 1: "Percentage to Double Conversion"

- **PASS.** `explicit operator double()` for `Percentage`. Uses `<iomanip>` for `std::fixed`/`std::setprecision`. All available.
- **Test cases:** Correct. 75->0.75, 0->0.00, 100->1.00.
- **Code quality:** Good.

### Exercise 2: "Boolean Validity Check"

- **PASS.** `explicit operator bool()` for `ID`. Uses the special boolean context rule. All available.
- **Test cases:** Correct. 5=valid, -1=invalid, 0=invalid, 42=valid. All 0/-5/-100=invalid. 1=valid.
- **Code quality:** Good.

---

## Lesson 21.12 -- Overloading the assignment operator

### Summary

- **PASS (no forward references).** Covers copy assignment operator, self-assignment guard, return `*this` by reference, chained assignment.
- **Factual accuracy:** Correct. Good explanation of the difference between copy constructor and copy assignment.
- **Ordering note:** This is sort_order 11. No earlier lesson (21.1--21.11) uses custom `operator=`, which is correct. The summary mentions "a topic explored in the next lesson on shallow versus deep copy" -- this correctly points forward within the chapter.

### Exercise 1: "Copy-Assign a Label"

- **PASS.** Custom `operator=` with self-assignment check. Uses `std::string` and `std::getline`. All available.
- **Test cases:** Correct. After `a = b`, both print `[2] World`. After `a = b` with same id, both print `[5] Beta`. With negative id, both print `[0] Warning`.
- **Code quality:** Good.
- **ISSUE (minor):** The `Label` class contains `std::string m_text` which handles its own copy correctly via the default assignment. Writing a custom `operator=` for this class is pedagogically useful but arguably unnecessary in practice -- the compiler-generated default would work fine. The summary does mention preferring the default when memberwise copy suffices, so this is acceptable as a learning exercise.

### Exercise 2: "Chained Assignment"

- **PASS.** Demonstrates `a = b = c` chaining. All available.
- **Test cases:** Correct. After `a = b = c`, all three have `c`'s value.
- **Code quality:** Good.

---

## Lesson 21.13 -- Shallow vs. deep copying

### Summary

- **PASS (no forward references).** Covers shallow copy, deep copy, Rule of Three, `new`/`delete` for dynamic resources. All available from Ch 19.
- **Factual accuracy:** Correct. Good checklist for deep-copy assignment operator.
- **Ordering note:** Correctly placed after 21.12 (assignment operator). Deep copy builds on the assignment operator concept.

### Exercise 1: "Deep-Copy IntArray"

- **PASS.** Complete Rule of Three implementation for a dynamically-allocated array. Uses `new[]`/`delete[]` from Ch 19. All available.
- **ISSUE (test case formatting -- trailing space):** Expected output includes a trailing space after the last element: `"10 20 30 \n"`. The solution code's print loop is:
  ```cpp
  for (int i{ 0 }; i < copy.getLength(); ++i)
      std::cout << copy[i] << ' ';
  std::cout << '\n';
  ```
  This prints a space after every element including the last, producing `"10 20 30 "` with a trailing space. The expected output matches this behavior. **Not a bug, but the trailing space is a stylistic concern.** Some judges may strip trailing whitespace, but since the expected output includes it, this is consistent. **Severity: very low.**
- **Test cases:** Values are correct. Copy and assigned remain unchanged after modifying original.
- **Code quality:** Good.

### Exercise 2: "Rule of Three: Named String"

- **PASS.** Deep copy with C-string (`char*`), `std::strlen`, `std::strcpy`. Uses `<cstring>` from Ch 17.10. All available.
- **Test cases:** Correct. "score 100" -> copy stays "score 100", original becomes "score 200".
- **Code quality:** Good. Realistic Rule of Three example.

---

## Lesson 21.14 -- Overloading operators and function templates

### Summary

- **PASS (no forward references).** Covers operator overloads with function templates and class templates. ADL for friend functions. All concepts available (templates from Ch 11, class templates from Ch 13).
- **Factual accuracy:** Correct. Good explanation of the friend-inside-class-template pattern.

### Exercise 1: "Generic Maximum with Printable Types"

- **PASS.** Function template `maxOf` with `Score` class having `operator>` and `operator<<`. All available.
- **Test cases:** Correct. maxOf(90,75)=90. maxOf(30,88)=88. maxOf(50,50)=50 (returns `b` when equal).
- **Code quality:** Good.

### Exercise 2: "Generic Accumulate with a Wrapper Class Template"

- **PASS.** Class template `Val<T>` with member `operator+` and inline friend `operator<<`. Function template `accumulate3`. All available.
- **Test cases:** Correct. 10+20+30=60. -5+15+(-10)=0. 0+0+0=0.
- **Code quality:** Good.

---

## Lesson 21.x -- Chapter 21 summary and quiz

### Summary

- **PASS (no forward references).** Comprehensive summary of all chapter topics.
- **ISSUE (summary accuracy):** The summary for lesson 21.2 states "Implement compound assignment (`+=`) first, then define the binary operator in terms of it." However, lesson 21.2 itself does NOT teach this pattern -- it only teaches direct implementation of `operator+` as a friend function. The compound assignment pattern (`+=`) is never formally taught in any of the 21.1--21.14 lessons. **Severity: medium.** The summary describes a best practice that the lessons themselves don't cover, which could confuse students reviewing the chapter.
- **Factual accuracy:** Otherwise correct summary of all 14 lessons.

### Exercise 1: "Matrix2x2 with Arithmetic, I/O, and Comparison"

- **PASS.** Comprehensive exercise combining friend arithmetic, member comparison, friend I/O. All available.
- **Test cases:** Correct. Addition: [1+5, 2+6, 3+7, 4+8] = [6,8,10,12]. Subtraction: [1-3, 0-4, 0-5, 1-6] = [-2,-4,-5,-5]. Compare equal: all elements match.
- **Code quality:** Good.

### Exercise 2: "Accumulator Functor with Subscript and Typecast"

- **PASS.** Combines `operator()`, `operator[]`, and `explicit operator int()` with `std::vector`, `std::accumulate`, `<numeric>`. All available.
- **Test cases:** Correct. Push 10,20,30; get[0]=10, get[2]=30; sum=60.
- **Code quality:** Good. Uses `static_cast<int>(m_data.size())` for sign comparison with index -- good practice.
- **Note:** Uses `std::accumulate` from `<numeric>` which is available (Ch 18 covers algorithms including `std::accumulate`/`std::reduce`).

---

## Lesson 21.y -- Chapter 21 project

### Summary

- **PASS (no forward references).** Describes a comprehensive `Fraction` class project combining arithmetic, I/O, comparison (`operator<=>`), increment, and negation.
- **Factual accuracy:** Correct.
- **Uses `std::gcd` from `<numeric>`:** Available from Ch 18 (algorithms header family). **PASS.**

### Exercise 1: "Fraction class -- arithmetic and I/O"

- **PASS.** Full `Fraction` class with reduction, `operator+`, `operator*`, `operator<<`. Uses `std::gcd` and `std::abs`. All available.
- **Test cases:** Let me verify:
  - Input `2 3\n1 6`: f1=2/3, f2=1/6. Sum = (2*6 + 1*3)/(3*6) = 15/18 -> gcd(15,18)=3 -> 5/6. Product = (2*1)/(3*6) = 2/18 -> gcd(2,18)=2 -> 1/9. Expected: `2/3\n1/6\n5/6\n1/9\n`. **Correct.**
  - Input `3 -9\n4 8`: f1: den<0 -> negate both -> -3/9, gcd(3,9)=3 -> -1/3. f2: 4/8, gcd(4,8)=4 -> 1/2. Sum = (-1*2 + 1*3)/(3*2) = 1/6. Product = (-1*1)/(3*2) = -1/6. Expected: `-1/3\n1/2\n1/6\n-1/6\n`. **Correct.**
  - Input `0 5\n7 3`: f1: 0/5, gcd(0,5)=5 -> 0/1. f2: 7/3. Sum = (0*3 + 7*1)/(1*3) = 7/3. Product = (0*7)/(1*3) = 0/3 -> gcd(0,3)=3 -> 0/1. Expected: `0/1\n7/3\n7/3\n0/1\n`. **Correct.**
- **Code quality:** Good.

### Exercise 2: "Fraction class -- comparison, increment, and negation"

- **PASS.** Extends Fraction with `operator-()`, `operator<=>`, `operator==`, prefix/postfix `operator++`.
- **Uses `<compare>` for `std::strong_ordering`:** C++20 feature, consistent with 21.7. **PASS.**
- **Test cases:** Let me verify carefully:
  - Input `2 3`: f=2/3. -f=-2/3. ++f: 2/3 + 1/1 = (2*1+1*3)/(3*1) = 5/3. before(2/3) < f(5/3) = true. f++(postfix): prints old value 5/3, then f becomes 5/3+1=8/3. Expected: `2/3\n-2/3\n5/3\ntrue\n5/3\n`. **Correct.**
  - Input `-3 4`: f=-3/4. -f=3/4. ++f: -3/4 + 1/1 = (-3*1+1*4)/(4*1) = 1/4. before(-3/4) < f(1/4) = true. f++: prints 1/4. Expected: `-3/4\n3/4\n1/4\ntrue\n1/4\n`. **Correct.**
  - Input `6 -4`: den<0 -> negate -> -6/4, gcd(6,4)=2 -> -3/2. f=-3/2. -f=3/2. ++f: -3/2 + 1/1 = (-3*1+1*2)/(2*1) = -1/2. before(-3/2) < f(-1/2) = true (-3/2 = -1.5 < -0.5). f++: prints -1/2. Expected: `-3/2\n3/2\n-1/2\ntrue\n-1/2\n`. **Correct.**
- **Code quality:** Good.
- **ISSUE (comparison operator as friend vs member):** The `operator<=>` and `operator==` are declared as `friend` functions, which differs from lesson 21.7 where they were taught as member functions. This is not incorrect -- both approaches work -- but it's a pedagogical inconsistency. Lesson 21.7 exercise 1 uses member functions for `operator<=>` and `operator==`, while 21.y uses friends. **Severity: very low.**

---

## Cross-Chapter Ordering Analysis

The chapter's internal ordering is:

| sort_order | Lesson | Topic |
|---|---|---|
| 0 | 21.1 | Introduction |
| 1 | 21.2 | Arithmetic via friend functions |
| 2 | 21.3 | Arithmetic via normal functions |
| 3 | 21.4 | I/O operators |
| 4 | 21.5 | Member function overloads |
| 5 | 21.6 | Unary operators |
| 6 | 21.7 | Comparison operators + spaceship |
| 7 | 21.8 | Increment/decrement |
| 8 | 21.9 | Subscript operator |
| 9 | 21.10 | Parenthesis operator / functors |
| 10 | 21.11 | Typecasts |
| 11 | 21.12 | Assignment operator |
| 12 | 21.13 | Shallow vs. deep copying |
| 13 | 21.14 | Operators with templates |
| 14 | 21.x | Summary and quiz |
| 15 | 21.y | Project |

**Ordering assessment:**
- Friend-based (21.2) before normal-function (21.3) before member-function (21.5): **Correct** -- standard learncpp.com progression.
- I/O (21.4) before comparison (21.7): **Correct** -- I/O is more commonly needed first.
- Assignment (21.12) before deep copy (21.13): **Correct** -- deep copy builds on custom assignment.
- No lesson before 21.12 uses custom `operator=`: **Verified** -- all earlier exercises use default copy behavior or friend/normal arithmetic operators.
- No lesson before 21.13 requires deep copy knowledge: **Verified.**
- Templates (21.14) at the end: **Correct** -- integrative topic.

**No within-chapter ordering violations found.**

---

## Summary of All Issues

### HIGH Severity
(none found)

### MEDIUM Severity
1. **21.x summary (lesson 21.2 description):** States "Implement compound assignment (`+=`) first, then define the binary operator in terms of it" but this pattern is never taught in any lesson within the chapter. Students reading the summary may be confused by a technique they haven't seen. **Fix:** Remove the compound assignment mention from the 21.2 summary bullet, or add a brief note about compound assignment in lesson 21.2 or 21.5.

### LOW Severity
1. **21.11 summary:** Mentions `std::unique_ptr` as an example of `explicit operator bool()`. `std::unique_ptr` is Ch 22 material. **Fix:** Replace with `std::optional` (Ch 12.15) which also has `explicit operator bool()`.
2. **21.7 exercise 2:** Uses C-style array `Student students[3]` instead of `std::array<Student, 3>`. While technically available, `std::array` is the preferred modern idiom. **Fix:** Use `std::array<Student, 3>` and `#include <array>`.
3. **21.4 summary:** Uses the phrase "any class derived from `std::ostream`" which implies inheritance vocabulary (Ch 24). While standard library terminology, it could confuse students who haven't studied inheritance yet. **Fix:** Rephrase to "any output stream type like `std::ofstream` or `std::ostringstream`."

### VERY LOW / Stylistic
1. **21.13 exercise 1:** Trailing space in output after last array element. Consistent between solution and expected output, but non-ideal formatting.
2. **21.y exercise 2:** Uses friend `operator<=>` and `operator==` while 21.7 teaches them as member functions. Both are valid; minor inconsistency in teaching approach.

### Forward Reference Violations
- **No Ch 22+ forward references found in any exercise code.** No move semantics, rvalue references, `std::move`, smart pointers, inheritance, virtual functions, or `std::initializer_list` appear in any exercise starter code, solution code, or test cases.
- **One textual mention** of `std::unique_ptr` in 21.11 summary (low severity, documented above).
- **One use of inheritance vocabulary** ("derived from") in 21.4 summary (low severity, documented above).

### Code Correctness
- **All test cases verified correct** for every exercise across all 16 lessons.
- **All solution code compiles and produces expected output** (verified by manual trace).
- **No code bugs found** in any starter code or solution code.

### Test Case Coverage
- All exercises have 3 test cases (1 sample, 2 hidden), which is adequate.
- Test cases cover edge cases (zero values, negative values, boundary conditions) across the chapter.
