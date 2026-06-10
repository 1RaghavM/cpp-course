## The idea

A boolean is the simplest type in C++: it holds exactly one of two values, `true` or `false`. Think of it as a light switch — it is either on or off, nothing in between. Booleans exist because programs constantly need to answer yes/no questions: Is this number even? Did the user enter a valid value? Are two measurements close enough to be considered equal? Rather than encoding those answers as 0 and 1 inside an `int`, C++ gives you a dedicated `bool` type that makes the intent of your code immediately clear.

The boolean type is named after George Boole, the mathematician who formalized the algebra of true/false logic in the 19th century. Modern C++ builds on that algebra directly — `bool` variables, comparison operators, and logical operators all follow Boole's rules.

## How it works

**Declaring and printing booleans**

```cpp
#include <iostream>

int main()
{
    bool doorOpen { true };
    bool lightOn  { false };

    std::cout << doorOpen << '\n';  // prints 1
    std::cout << lightOn  << '\n';  // prints 0
    return 0;
}
```

By default, `std::cout` prints `true` as `1` and `false` as `0`. If you want the words "true" and "false", use the `std::boolalpha` manipulator:

```cpp
#include <iostream>

int main()
{
    bool isReady { true };
    std::cout << std::boolalpha << isReady << '\n';  // prints true
    std::cout << std::noboolalpha << isReady << '\n'; // prints 1
    return 0;
}
```

`std::boolalpha` stays active until you turn it off with `std::noboolalpha`, so be deliberate about when you set it.

**Booleans from comparison and logical operators**

The real power of `bool` is that comparison expressions evaluate to boolean results. Every expression like `x < y` or `a == b` produces a `bool` value you can store or print directly:

```cpp
#include <iostream>

int main()
{
    int temperature { 22 };
    bool isWarm    { temperature > 20 };    // true: 22 > 20
    bool isFreezing{ temperature < 0 };    // false: 22 < 0
    bool isExact   { temperature == 22 };  // true: exact match

    std::cout << std::boolalpha;
    std::cout << "Warm?    " << isWarm     << '\n';  // true
    std::cout << "Freezing?" << isFreezing << '\n';  // false
    std::cout << "Exact?   " << isExact    << '\n';  // true
    return 0;
}
```

You can also combine boolean values with logical operators:
- `&&` (AND): both sides must be true
- `||` (OR): at least one side must be true
- `!` (NOT): flips the value

```cpp
int voltage { 115 };
bool inLowRange  { voltage >= 100 };        // true
bool inHighRange { voltage <= 120 };        // true
bool inRange     { inLowRange && inHighRange }; // true
bool outOfRange  { !inRange };               // false
```

**Booleans and integers**

C++ lets you convert between `bool` and integer types. Any non-zero integer value converts to `true`; zero converts to `false`. Going the other direction, `true` converts to `1` and `false` to `0`. This is handy but can surprise you:

```cpp
bool b1 { 5 };   // b1 is true  (5 is non-zero)
bool b2 { 0 };   // b2 is false (0 is zero)
int  n  { b1 };  // n is 1
```

Narrowing conversion warnings apply here. If you initialize a `bool` directly from a non-zero literal using brace initialization, the compiler will accept it but may warn. Direct initialization `bool b(5)` is explicit; brace initialization `bool b{5}` may produce a narrowing warning.

**Reading booleans from input**

`std::cin` reads booleans as integers by default: `0` → `false`, `1` → `true`. You can enable alpha mode with `std::cin >> std::boolalpha` to accept the words "true" and "false" as input.

```cpp
#include <iostream>

int main()
{
    bool answer {};
    std::cin >> answer;   // expects 0 or 1 from stdin
    std::cout << std::boolalpha << answer << '\n';
    return 0;
}
```

## Common mistakes

**Mistake 1: Comparing a bool to `true` or `false` explicitly**

Beginners sometimes write `if (doorOpen == true)` or `if (lightOn == false)`. This is redundant and can lead to subtle bugs if the variable holds an integer value other than exactly 1:

```cpp
int value { 5 };
bool b { value };   // b is true (non-zero)
// b == true evaluates as: 1 == 1 (correct — but only because bool normalises to 1)
// However, value == true evaluates as: 5 == 1 → FALSE — a surprise!
```

Prefer `if (doorOpen)` and `if (!lightOn)` — they test the bool value directly and avoid any implicit conversion confusion. With booleans, the comparison operator is always `!`, `&&`, or `||`, not `== true` or `== false`.

**Mistake 2: Expecting `std::cout << bool` to print "true"/"false" by default**

Many learners expect:

```cpp
bool ready { true };
std::cout << ready;   // prints 1, NOT "true"
```

The integer representation is the default. If your output looks like `1` and `0` when you expected words, add `std::cout << std::boolalpha` before any boolean output.

**Mistake 3: Integer zero vs boolean false confusion**

```cpp
bool b1 { 1 };   // true
bool b2 { 0 };   // false
bool b3 { 2 };   // true — any non-zero is true, might surprise you
```

Comparing `b3 == b1` gives `true` because both are stored as 1 internally. But `b3 == 2` would give `false`, because 2 != 1. This kind of mismatch arises when you mix integer arithmetic with boolean logic. Store boolean intent in a `bool`, not an `int`.

## When to use this

Use `bool` whenever a value is inherently binary: a flag that tracks whether something has happened, the result of a validation check, a condition computed from other data. Storing such values as `bool` makes the code self-documenting — anyone reading `bool fileFound { ... }` immediately knows the variable represents a yes/no fact rather than a count or measurement.

Avoid shoehorning a boolean result into an `int` just because you later want to do arithmetic with it. If you need to count how many conditions were true, compute each condition into a `bool` first, then convert explicitly. This keeps your logic clearly separated from your arithmetic, which connects back to the type-clarity principle introduced in "Introduction to fundamental data types."
