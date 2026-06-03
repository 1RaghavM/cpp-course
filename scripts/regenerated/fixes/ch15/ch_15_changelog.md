# Chapter 15 Fix Changelog

## Summary of Changes

11 HIGH-severity issues fixed, 6 MEDIUM-severity issues fixed, 3 LOW-severity issues fixed.

---

## Lesson 15.1 -- Exercise 3: "Chainable String Formatter with const Print"

**Issue (HIGH):** Solution did not compile. `printBefore()` returned `const TextLine&`, then non-const `toUpper()`/`toLower()` was called on it -- a const violation. The comment in the original code claiming "the underlying object is non-const" was factually wrong; the C++ type system checks the static type of the expression.

**Fix:** Changed `printBefore()` from `const TextLine& printBefore() const` to `TextLine& printBefore()` (non-const, returns non-const reference). Changed `printAfter()` to `void printAfter() const` (no need to return from the last call in the chain). Updated prompt, starter code, and solution to match. The chain `TextLine(word1).append(word2).printBefore().toUpper().printAfter()` now compiles correctly because `printBefore()` returns a mutable reference.

---

## Lesson 15.2 -- Exercise 2: "Chainable Temperature Logger with Header-Style Separation"

**Issue (HIGH):** Used `std::vector<double>` as a private member. Vectors are Ch 16/17 material.

**Fix:** Replaced `std::vector<double> m_readings` with a fixed-size `double m_readings[100]{}` array and an `int m_count{0}` counter. The `add()` method stores at `m_readings[m_count]` and increments `m_count`. `minTemp()` and `maxTemp()` use manual loops instead of `std::min_element`/`std::max_element`. Removed `#include <vector>` and `#include <algorithm>`.

---

## Lesson 15.3 -- Summary

**Issue (MEDIUM):** Factual error: stated "the nested class can see public members of the outer class (but not private members unless it is a friend)". Since C++11, nested classes implicitly have access to the enclosing class's private and protected members.

**Fix:** Replaced the incorrect sentence with: "Since C++11, a nested class is implicitly considered a friend of the enclosing class, meaning it has access to the enclosing class's private and protected members. The outer class can also access all members of the nested class."

---

## Lesson 15.4 -- Summary

**Issue (MEDIUM):** Summary example used `new int[size]` and `delete[] data` (Ch 19 material). Also name-dropped `std::unique_ptr`, `std::lock_guard`, and Rule of Five.

**Fix:** Replaced the `Buffer` example with a `LogFile` class using `std::ofstream` (already available). Removed mentions of `std::unique_ptr`, `std::lock_guard`, and Rule of Five from the summary. RAII is now demonstrated with file handles rather than heap allocation.

---

## Lesson 15.4 -- Exercise 2: "RAII integer array wrapper"

**Issue (HIGH):** Used `new int[size]` and `delete[]` -- dynamic allocation is Ch 19 material.

**Fix:** Replaced entirely with "Scoped Logger: RAII with nested blocks" -- an exercise that demonstrates RAII and destructor ordering using nested scope blocks and stack-allocated `Logger` objects that print on construction/destruction. No heap allocation needed. The exercise reads three resource names from stdin and creates Logger objects in nested `{}` blocks to show automatic cleanup in reverse order.

---

## Lesson 15.6 -- Exercise 1: "Instance Counter with Static Member"

**Issue (HIGH):** Used `std::vector<Robot*>` with `new`/`delete` -- both Ch 16/17 and Ch 19 material.

**Fix:** Redesigned to use a recursive helper function `createRobots(int n)` that creates one `Robot` on the stack per call. When the recursion bottoms out, it prints the count. As the stack unwinds, destructors fire and the count drops back to 0. No containers, no heap allocation. Input is just the number N; output is two lines showing the count at peak and after all destruction.

---

## Lesson 15.6 -- Exercise 2: "Unique ID Generator with Static Counter"

**Issue (HIGH):** Used `std::vector<Ticket>` with `.reserve()` and `.emplace_back()`. Also had `m_id` as public despite having a getter.

**Fix:** Removed `std::vector` entirely. Now constructs one `Ticket` per loop iteration as a local variable, prints its ID immediately, and lets it go out of scope. Made `m_id` private with the getter as the only accessor. Added `static int nextId()` accessor for the static counter. The total is computed from the static counter at the end.

---

## Lesson 15.7 -- Exercise 1: "Instance Counter" (Widget)

**Issue (HIGH):** Used `std::vector<Widget>`. Also a near-duplicate of 15.6 Ex1 and 15.x Ex1 (third instance-counter exercise in the chapter).

**Fix:** Replaced entirely with "Static Config Registry" -- a completely different exercise that tests static member functions by maintaining a class-wide configuration (a string label and an integer verbosity level). Two instances demonstrate that static state is shared. No containers, no heap allocation, and no redundancy with other exercises in the chapter.

---

## Lesson 15.7 -- Exercise 2: "Widget Factory Counter"

**Issue (HIGH):** Used `std::vector<Widget*>` with `new`/`delete` -- both Ch 16/17 and Ch 19 material.

**Fix:** Redesigned to use `std::optional<Widget>` (covered in Ch 12.15) to control Widget lifetime on the stack. `emplace()` constructs a new Widget (destroying the previous one if any), and `reset()` destroys it. The `create` command calls `emplace()`, `destroy` calls `reset()`. This correctly demonstrates `s_created` (monotonic) vs `s_alive` (tracks lifetime) without any heap allocation or containers. Updated test cases to reflect the new semantics (only one Widget can be alive at a time with `std::optional`).

---

## Lesson 15.7 -- Summary

**Issue (LOW):** Used `std::println` from `<print>` (C++23), while the rest of the curriculum uses `std::cout`.

**Fix:** Replaced `std::println("Live objects: {}", Counter::count());` with `std::cout << "Live objects: " << Counter::count() << '\n';` and changed the include from `<print>` to `<iostream>`.

---

## Lesson 15.7 -- Exercise 4: "Temperature Log with Static Summary"

**Issue (HIGH):** Solution used `std::vector<TempLog>` to store objects.

**Fix:** The vector was unnecessary since the static members accumulate everything. Changed `main` to construct temporaries with `TempLog{t};` in a loop instead of storing them. Removed `#include <vector>`. Updated starter code and solution accordingly.

---

## Lesson 15.8 -- Exercise 1: "Friend operator+ for a Distance Class"

**Issue (HIGH):** Used `operator+` overloading -- operator overloading beyond I/O is Ch 21 material.

**Fix:** Replaced `operator+` with a regular friend function `addDistance(const Distance& a, const Distance& b)` that performs the same addition and normalization logic. Updated the prompt title from "operator+ and operator<<" to "operator<< and addDistance". Updated `main` to call `addDistance(d1, d2)` instead of `d1 + d2`. Same test cases, same output format.

---

## Lesson 15.8 -- Exercise 3: "Friend operator== and operator!= for a Rectangle Class"

**Issue (HIGH):** Used `operator==` and `operator!=` overloading -- comparison operator overloads are Ch 21 material. Also had confusing prompt around private `area()` + friend `getArea()`.

**Fix:** Replaced entirely with "Friend sameArea and operator<< for a Rectangle Class". Instead of `operator==`/`operator!=`, uses a regular friend function `sameArea(const Rectangle&, const Rectangle&)` that compares areas (via direct private access). The `getArea` friend function provides area computation. Simplified the design: no private `area()` method confusion. The output now says "Same area" or "Different area" instead of "r1 == r2" / "r1 != r2". Updated test cases -- including a case where 4x6 and 3x8 have the same area (24) to make the exercise more interesting.

---

## Lesson 15.8 -- Exercise 4: "Temperature class with friend operator<< and static conversion helper"

**Issue (LOW):** Used degree sign character `°` which could cause encoding issues on some systems.

**Fix:** Changed output format from `100°C` to `100 degrees C` (plain ASCII). Updated prompt, solution, and all test cases to use `degrees` text instead of the degree sign character.

---

## Lesson 15.10 -- Summary

**Issue (LOW):** Incorrect cross-reference: "This concept connects directly to the move semantics preview from Static member variables" -- no such content exists in the static member variables lesson.

**Fix:** Removed the incorrect cross-reference. Changed to: "This concept connects to the resource-ownership ideas discussed in Introduction to destructors."

---

## Lesson 15.x -- Exercise 1: "Instance Counter with Destructor"

**Issue (HIGH + MEDIUM):** Used `std::vector<Tracked>` (Ch 16/17). Also the third instance-counter exercise in the chapter (severe redundancy). Additionally had a copy-semantics bug where `push_back` would produce wrong counts because the implicitly-generated copy constructor does not increment `s_alive`.

**Fix:** Replaced entirely with "Chainable StatTracker with Destructor Report" -- a capstone exercise that combines static members, destructors, method chaining with lvalue ref qualifiers, and scoped lifetimes. The exercise creates `StatTracker` objects in nested blocks, chains `add()` and `scale()` operations, and observes destructor output as scopes close. No containers, no heap allocation. Tests a genuinely different combination of chapter concepts instead of repeating the instance-counter pattern.

---

## Redundancy Resolution

The original chapter had three near-identical instance-counter exercises:
1. 15.6 Ex1 (Robot) -- **kept but redesigned** (scope-based, recursive)
2. 15.7 Ex1 (Widget) -- **replaced** with Static Config Registry
3. 15.x Ex1 (Tracked) -- **replaced** with Chainable StatTracker capstone

Each now tests a distinct concept combination.
