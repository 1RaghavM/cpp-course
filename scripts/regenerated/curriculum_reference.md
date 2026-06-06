# C++ Curriculum Reference — Topic Introduction Order

This document lists which C++ concepts, types, keywords, and standard library features are introduced in each chapter. A lesson in Chapter N may ONLY use concepts from Chapters 0 through N-1, plus concepts introduced in earlier lessons within Chapter N itself.

## Chapter 0: Introduction / Getting Started
- **Concepts**: What programs are, compilation vs interpretation, C vs C++ history, IDE setup, compiler/linker/library pipeline, build configurations, compiler extensions, warning levels, language standards
- **Syntax shown (but not formally taught)**: `#include <iostream>`, `int main()`, `std::cout << "text"`, `return 0;`, `std::format` (C++20)
- **NOT available**: No C++ coding concepts are formally taught. Students can recognize `main()` and `std::cout` from examples but have not been taught variables, types, operators, etc.

## Chapter 1: C++ Basics
- **Lessons**: 1.1–1.11, 1.x
- **Introduces**: Statements, semicolons, `int main()`, `return` from main, `//` and `/* */` comments, objects, variables (`int` type only), direct/copy/list initialization (`int x = 5`, `int x(5)`, `int x{5}`), `#include <iostream>`, `std::cout`, `<<` for output, `std::cin`, `>>` for input, `std::endl`, `'\n'`, uninitialized variables, undefined behavior, C++ keywords, naming rules (identifiers), integer literals, basic arithmetic operators (`+`, `-`, `*`, `/`), expressions, operator precedence (basic), assignment operator `=`
- **Types available**: `int` only
- **NOT available**: `double`, `float`, `bool`, `char`, `std::string`, `void` (as a type), `const`, `constexpr`, `if`/`else`, loops, functions (other than `main`), multiple files, namespaces, preprocessor details

## Chapter 2: C++ Basics: Functions and Files
- **Lessons**: 2.1–2.13, 2.x
- **Introduces**: User-defined functions, function return values (`int` return), `void` functions, function parameters/arguments (`int` params), local scope, forward declarations, multiple code files (`.cpp`), naming collisions, namespaces (`namespace`, `::`), preprocessor (`#include`, `#define`, `#ifdef`, `#ifndef`, `#endif`), header files (`.h`), header guards (`#ifndef`/`#pragma once`), program design
- **Types available**: `int`, `void` (for functions)
- **NOT available**: `double`, `float`, `bool`, `char`, `std::string`, `const`, `constexpr`, `if`/`else`, `switch`, loops of any kind, `static_cast`, references, pointers, structs, classes, templates, `enum`

## Chapter 3: Debugging C++ Programs
- **Lessons**: 3.1–3.10, 3.x
- **Introduces**: Syntax errors vs semantic errors, debugging process, debugging strategies, `std::cerr`, commenting out code, using an integrated debugger (stepping, breakpoints, watching variables, call stack), defensive programming practices
- **Types available**: `int`, `void`
- **NOT available**: Same as Chapter 2 — no new types or language features introduced

## Chapter 4: Fundamental Data Types
- **Lessons**: 4.1–4.12, 4.x
- **Introduces**: Fundamental data types overview, `void` (as a type, detailed), `sizeof` operator, signed integers (`short`, `int`, `long`, `long long`), unsigned integers (`unsigned`), fixed-width integers (`int8_t`, `int16_t`, `int32_t`, `int64_t`, `std::size_t`), scientific notation, floating-point types (`float`, `double`, `long double`), `bool` (`true`/`false`), **basic `if` statements and `else`** (lesson 4.10), `char` type, implicit type conversion intro, `static_cast<>()`
- **Types available**: `int`, `void`, `short`, `long`, `long long`, `unsigned` variants, fixed-width ints, `float`, `double`, `long double`, `bool`, `char`
- **NOT available**: `const`, `constexpr`, `std::string`, `std::string_view`, ternary operator, `switch`, loops, `&&`/`||`/`!` logical operators, relational operators beyond what's used in basic `if`

## Chapter 5: Constants and Strings
- **Lessons**: 5.1–5.9, 5.x
- **Introduces**: `const` variables, literal suffixes (`u`, `l`, `f`, etc.), numeral systems (binary `0b`, hex `0x`, octal `0`), as-if rule, constant expressions, `constexpr` variables, `std::string` (`#include <string>`), `std::string_view` (`#include <string_view>`), string operations (`.length()`, `.size()`, `+` concatenation for `std::string`)
- **Types available**: All from Ch 0–4 plus `const`, `constexpr`, `std::string`, `std::string_view`
- **NOT available**: Ternary operator, relational operators (detailed), logical operators, `switch`, loops, references, pointers

## Chapter 6: Operators
- **Lessons**: 6.1–6.8, 6.x
- **Introduces**: Operator precedence and associativity (full table), arithmetic operators (detailed: `+`, `-`, `*`, `/`, unary `-`), remainder/modulo `%`, increment/decrement `++`/`--` (prefix and postfix), side effects, comma operator `,`, **conditional/ternary operator `?:`**, relational operators (`==`, `!=`, `<`, `>`, `<=`, `>=`), floating-point comparison issues, logical operators (`&&`, `||`, `!`), short-circuit evaluation, De Morgan's law
- **Types available**: All from Ch 0–5 plus all operators listed above
- **NOT available**: `switch`, loops of any kind, compound assignment (`+=`, `-=`, etc. — covered here or in Ch 1? Usually Ch 1.9 covers `=` only), references, pointers

## Chapter 7: Scope, Duration, and Linkage
- **Lessons**: 7.1–7.14, 7.x
- **Introduces**: Compound statements/blocks `{}`, user-defined namespaces, scope resolution operator `::` (detailed), local variables (duration, scope), global variables, variable shadowing (name hiding), internal linkage (`static` keyword on globals), external linkage (`extern` keyword), `inline` functions, `inline` variables, sharing global constants (inline variables across files), static local variables, `using` declarations, `using` directives, unnamed namespaces, inline namespaces
- **Types available**: All from Ch 0–6 plus `static`, `extern`, `inline`, `using`
- **NOT available**: `switch`, loops, `while`, `for`, `do-while`, `break`, `continue`, random numbers

## Chapter 8: Control Flow
- **Lessons**: 8.1–8.15, 8.x
- **Introduces**: Control flow concepts, `if`/`else` blocks (detailed, nested), common `if` problems, `constexpr if`, `switch` statement (`case`, `default`, `break`), switch fallthrough, `[[fallthrough]]` attribute, switch scoping, `goto` (and why to avoid), `while` loops, `do while` loops, `for` loops, `break`, `continue`, `std::exit()`, `std::abort()`, `std::atexit()`, `<random>` header, `std::mt19937`, `std::uniform_int_distribution`, `std::random_device`, `<chrono>` for seeding
- **Types available**: All from Ch 0–7 plus all loop/control constructs
- **Compound assignment**: `+=`, `-=`, `*=`, `/=`, `%=` (if not already covered — these are used freely in loop examples)
- **NOT available**: `assert`, error handling patterns, function overloading, templates, references, pointers, structs, classes, `auto` (for type deduction)

## Chapter 9: Error Detection and Handling
- **Lessons**: 9.1–9.6, 9.x
- **Introduces**: Testing strategies, code coverage, common semantic errors, error detection/handling patterns, `std::cin` error states (`.fail()`, `.clear()`, `.ignore()`), `assert()` (`#include <cassert>`), `static_assert`, `NDEBUG`
- **Types available**: All from Ch 0–8

## Chapter 10: Type Conversion, Type Aliases, and Type Deduction
- **Lessons**: 10.1–10.9, 10.x
- **Introduces**: Implicit type conversion (detailed rules), floating-point promotion, integral promotion, numeric conversions, narrowing conversions, list initialization preventing narrowing, `constexpr` initializers for narrowing, arithmetic conversions, `static_cast` (detailed), `typedef`, `using` type aliases, `auto` keyword (type deduction for objects), return type deduction (`auto` for function return)
- **Types available**: All from Ch 0–9 plus `typedef`, `using` aliases, `auto`

## Chapter 11: Function Overloading and Function Templates
- **Lessons**: 11.1–11.10, 11.x
- **Introduces**: Function overloading, overload differentiation rules, overload resolution, ambiguous matches, `= delete` (deleting functions), default arguments, function templates (`template <typename T>`), template instantiation, multiple template type parameters, non-type template parameters (`template <int N>`), using templates across files
- **Types available**: All from Ch 0–10 plus function templates, `template`, `typename`

## Chapter 12: Compound Types: References and Pointers
- **Lessons**: 12.1–12.15, 12.x
- **Introduces**: Compound data types overview, value categories (lvalues, rvalues), lvalue references (`int& ref = x`), `const` lvalue references (`const int& ref`), pass by lvalue reference, pass by `const` lvalue reference, pointers (`int* ptr`), address-of operator `&`, dereference operator `*`, null pointers (`nullptr`), `const` with pointers (`const int*`, `int* const`), pass by address, pass by address (part 2), return by reference, return by address, in/out parameters, type deduction with pointers/references/const, `std::optional` (`#include <optional>`)
- **Types available**: All from Ch 0–11 plus references (`&`), pointers (`*`), `nullptr`, `std::optional`

## Chapter 13: Compound Types: Enums and Structs
- **Lessons**: 13.1–13.15, 13.x, 13.y
- **Introduces**: Program-defined (user-defined) types concept, unscoped enumerations (`enum Color { red, green, blue }`), enumerator integral conversions, enum-to-string and string-to-enum conversion, **overloading I/O operators `<<` and `>>`** (for enums), scoped enumerations (`enum class`), structs (`struct`), struct members, member selection operator `.`, aggregate initialization, designated initializers (C++20), default member initialization, passing structs to functions (by value, by const ref), returning structs, struct miscellany (nested structs, size/padding), member selection with pointers (`->`) and references, **class templates** (`template <typename T> struct Pair`), class template argument deduction (CTAD), deduction guides, alias templates (`template <typename T> using ...`)
- **Types available**: All from Ch 0–12 plus `enum`, `enum class`, `struct`, class templates, CTAD, alias templates

## Chapter 14: Introduction to Classes
- **Lessons**: 14.1–14.17, 14.x
- **Introduces**: Object-oriented programming concepts, `class` keyword, member functions (methods), `const` member functions, `public`/`private` access specifiers, access functions (getters/setters), returning references to data members, data hiding (encapsulation), constructors, member initializer lists, default constructors, `= default`, delegating constructors, temporary class objects, copy constructor, copy elision, converting constructors, `explicit` keyword, `constexpr` aggregates and classes
- **Types available**: All from Ch 0–13 plus `class`, access specifiers, constructors, `explicit`

## Chapter 15: More on Classes
- **Lessons**: 15.1–15.10, 15.x
- **Introduces**: Hidden `this` pointer, member function chaining, classes in header files, nested types (member types), destructors (`~ClassName()`), class templates with member functions, `static` member variables, `static` member functions, `friend` non-member functions, `friend` classes, `friend` member functions, ref qualifiers (`&`, `&&` on member functions)
- **Types available**: All from Ch 0–14 plus destructors, `friend`, `static` members, `this`, ref qualifiers

## Chapter 16: Dynamic arrays: std::vector
- **Lessons**: 16.1–16.12, 16.x
- **Introduces**: Container concept, array concept, `std::vector` (`#include <vector>`), list constructors, `.size()`, `[]` subscript operator, unsigned length/subscript issues, `static_cast<int>(vec.size())`, passing `std::vector` (by const ref, by ref), returning `std::vector` (move semantics intro), arrays and loops, sign challenge solutions, range-based `for` loops (`for (auto x : vec)`), `for (auto& x : vec)`, indexing with enumerators, `.resize()`, `.reserve()`, `.capacity()`, `.push_back()`, `.pop_back()`, `.empty()`, `std::vector<bool>`
- **Types available**: All from Ch 0–15 plus `std::vector`, range-based for, container operations

## Chapter 17: Fixed-size arrays: std::array and C-style arrays
- **Lessons**: 17.1–17.13, 17.x
- **Introduces**: `std::array` (`#include <array>`), `std::array` length/indexing, `.size()`, `std::get<>()`, passing/returning `std::array` (by const ref), `std::array` of class types, brace elision, `std::reference_wrapper` (`#include <functional>`), arrays of references, arrays with enumerations, C-style arrays (`int arr[5]`), array decay (to pointer), pointer arithmetic, pointer subscripting, C-style strings (`const char*`, `char[]`), null terminator `\0`, C-string functions (`strlen`, `strcpy`, `strcmp` from `<cstring>`), C-style string symbolic constants, multidimensional C-style arrays, multidimensional `std::array`
- **Types available**: All from Ch 0–16 plus `std::array`, C-style arrays, pointer arithmetic, C-strings, `std::reference_wrapper`

## Chapter 18: Iterators and Algorithms
- **Lessons**: 18.1–18.4
- **Introduces**: Selection sort algorithm, iterators (`.begin()`, `.end()`, `*it`, `++it`), `<algorithm>` header, `std::sort`, `std::find`, `std::count`, `std::for_each` (with named functions), `std::min_element`, `std::max_element`, `std::accumulate`, `<chrono>` for timing code, `std::chrono::steady_clock`
- **Types available**: All from Ch 0–17 plus iterators, standard algorithms, `<chrono>` timing
- **NOT available**: Lambdas, function pointers, `std::function` (all Ch 20). Predicate-based algorithms (`std::find_if`, `std::count_if`) and `std::reduce` are deferred to Ch 20 where lambdas are introduced.

## Chapter 19: Dynamic Allocation
- **Lessons**: 19.1–19.5
- **Introduces**: `new` operator, `delete` operator, dynamic memory allocation, memory leaks, dangling pointers, `new[]` and `delete[]` for arrays, dynamically allocating arrays, destructors in dynamic allocation context, pointers to pointers (`int**`), dynamic multidimensional arrays, `void*` pointers, `void` pointer casting
- **Types available**: All from Ch 0–18 plus `new`, `delete`, dynamic allocation, `void*`

## Chapter 20: Functions
- **Lessons**: 20.1–20.7, 20.x
- **Introduces**: Function pointers (`int (*fcnPtr)(int)`), `using`/`typedef` for function pointer types, callback functions, the stack and the heap (detailed), stack overflow, recursion, recursive algorithms (factorial, Fibonacci), memoization concept, `argc`/`argv` (command line arguments), `std::string_view` from `argv`, ellipsis (`...`) and `<cstdarg>`, why to avoid ellipsis, **lambdas** (`[](int x){ return x * 2; }`), lambda syntax, lambda captures (`[=]`, `[&]`, `[var]`, `[&var]`), `mutable` lambdas, generic lambdas (`auto` parameters), return type deduction for lambdas, `std::function` (`#include <functional>`)
- **Types available**: All from Ch 0–19 plus function pointers, lambdas, lambda captures, `std::function`

## Chapter 21: Operator Overloading
- **Lessons**: 21.1–21.14, 21.x, 21.y
- **Introduces**: Operator overloading concepts, overloading arithmetic operators (`+`, `-`, `*`, `/`) using friend functions, overloading operators using normal (non-friend) functions, overloading I/O operators (`<<`, `>>`) for classes, overloading operators using member functions, overloading unary operators (`+`, `-`, `!`), overloading comparison operators (`==`, `!=`, `<`, `>`, `<=`, `>=`), overloading increment/decrement (`++`, `--`, prefix and postfix), overloading subscript operator `[]`, overloading parenthesis/function call operator `()`, functor concept, overloading typecasts, overloading assignment operator `=`, copy assignment, self-assignment check, shallow vs deep copying, rule of three, overloading operators with function templates
- **Types available**: All from Ch 0–20 plus custom operator overloads

## Chapter 22: Move Semantics and Smart Pointers
- **Lessons**: 22.1–22.7, 22.x
- **Introduces**: Smart pointer motivation, move semantics motivation, rvalue references (`int&&`), move constructors, move assignment operators, `std::move` (`#include <utility>`), rule of five, `std::unique_ptr` (`#include <memory>`), `std::make_unique`, `std::shared_ptr`, `std::make_shared`, reference counting, `std::weak_ptr`, circular dependency problem and solution
- **Types available**: All from Ch 0–21 plus `&&`, `std::move`, `std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`

## Chapter 23: Object Relationships
- **Lessons**: 23.1–23.7, 23.x
- **Introduces**: Object relationship types overview, composition (has-a, part-of, value semantics), aggregation (has-a, not part-of, pointer/reference semantics), association (uses-a, bidirectional possible), dependencies (uses-a, transient), container classes (wrapping `std::vector` or similar), `std::initializer_list` (`#include <initializer_list>`), initializer list constructors
- **Types available**: All from Ch 0–22 plus `std::initializer_list`, relationship design patterns

## Chapter 24: Inheritance
- **Lessons**: 24.1–24.9, 24.x
- **Introduces**: Inheritance concept (is-a relationship), `class Derived : public Base`, construction order (base then derived), derived class constructors calling base constructors, inheritance access specifiers (`public`, `protected`, `private` inheritance), `protected` access specifier, adding new functionality to derived classes, calling inherited functions, overriding behavior, `using` declarations for changing access, hiding inherited functionality, multiple inheritance, diamond problem
- **Types available**: All from Ch 0–23 plus inheritance, `protected`, multiple inheritance

## Chapter 25: Virtual Functions
- **Lessons**: 25.1–25.11, 25.x
- **Introduces**: Pointers/references to base class of derived objects, virtual functions (`virtual`), polymorphism, `override` specifier, `final` specifier, covariant return types, virtual destructors, virtual assignment, `override` to prevent hiding, early binding vs late binding, virtual table (vtable) concept, pure virtual functions (`= 0`), abstract base classes, interface classes, virtual base classes (solving diamond problem), object slicing, `dynamic_cast`, RTTI
- **Types available**: All from Ch 0–24 plus `virtual`, `override`, `final`, `= 0`, `dynamic_cast`, abstract classes
