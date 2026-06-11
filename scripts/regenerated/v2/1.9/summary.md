## The idea

A literal is a fixed value written directly in your source code — the number `42`, for example. When you write `int x = 42;`, the `42` on the right is a literal: a hard-coded piece of data that the compiler sees as-is. An operator is a symbol that takes one or more values and produces a result. The `+` in `3 + 4` is an operator; it takes the literals `3` and `4` and produces `7`. Together, literals and operators are the raw ingredients of computation. Every arithmetic calculation you write in C++ is built entirely from these two building blocks.

Think of literals as the nouns in your code — the concrete values — and operators as the verbs — actions applied to those values to produce something new.

## How it works

**Literals**

An integer literal is any whole-number constant written directly in your code. In chapter 1, the only type you need is `int`, so every literal you write right now is an `int` literal.

```cpp
#include <iostream>

int main()
{
    std::cout << 5 << '\n';    // 5 is an integer literal
    std::cout << -12 << '\n';  // -12 is also an integer literal
    return 0;
}
```

When you write `5` in source code, the compiler treats it as the integer value five. The negative sign on `-12` is technically the unary minus operator applied to the literal `12`, but for practical purposes you can read `-12` as a single negative literal.

**Binary arithmetic operators**

The four familiar arithmetic operators work on integer values exactly as you expect — with one important exception for division:

```cpp
#include <iostream>

int main()
{
    int a = 10;
    int b = 3;

    std::cout << a + b << '\n';  // 13  (addition)
    std::cout << a - b << '\n';  // 7   (subtraction)
    std::cout << a * b << '\n';  // 30  (multiplication)
    std::cout << a / b << '\n';  // 3   (integer division — truncates toward zero)
    std::cout << a % b << '\n';  // 1   (remainder / modulo)
    return 0;
}
```

`a / b` prints `3`, not `3.333...`. When both operands are integers, C++ performs integer division: the fractional part is dropped (truncated toward zero). The `%` operator gives you the remainder — what is left over after integer division.

**Operator arity: unary vs. binary**

An operator's *arity* is the number of operands it takes. Most arithmetic operators are *binary* — they need two operands (one on each side). The minus sign can also be *unary* — applied to a single value to negate it:

```cpp
#include <iostream>

int main()
{
    int x = 5;
    int neg = -x;      // unary minus: neg is -5
    int pos = +x;      // unary plus: pos is still 5 (rarely used)

    std::cout << neg << '\n';  // -5
    std::cout << pos << '\n';  // 5
    return 0;
}
```

The unary minus is the same `-` character as binary subtraction; the compiler figures out which is intended based on context.

**The assignment operator**

`=` is also an operator — the *assignment operator*. It takes the value on the right side and stores it in the variable on the left. This is different from the mathematical equality sign: `x = 7` means "store 7 into x", not "x equals 7".

## Common mistakes

**Mistake 1 — forgetting that integer division truncates**

```cpp
int result = 7 / 2;
std::cout << result << '\n';  // prints 3, not 3.5
```

If you expected `3.5`, you will be surprised. Both `7` and `2` are integer literals, so C++ performs integer division and discards the `.5`. The result is stored in `result` as `3`. There is no rounding — the fractional part is simply cut off. To get a decimal result you would need floating-point types, which have not been covered yet.

**Mistake 2 — confusing `=` (assignment) with equality**

```cpp
int score = 0;
score = 100;     // assignment: stores 100 in score
```

Beginners coming from math or Python often read `=` as "equals". In C++, `=` always means "assign the right-hand value to the left-hand variable". The concept of testing whether two values are equal uses a different operator (`==`), which is covered in a later lesson. Confusing `=` with equality will become a source of bugs the moment you write conditions, so build the mental habit now: `=` is assignment, not comparison.

**Mistake 3 — unary minus on a variable produces a new value, not a change in place**

```cpp
int x = 5;
-x;              // evaluates to -5, but x is still 5
std::cout << x << '\n';  // prints 5, not -5
```

The expression `-x` computes the negation of `x` but does not modify `x` itself. If you want `x` to become `-5`, you need `x = -x;`. Writing `-x;` as a standalone statement computes a value and immediately discards it — the compiler may even warn you about this.

## When to use this

You will use integer literals everywhere: initializing variables, doing arithmetic in expressions, comparing values. The arithmetic operators `+`, `-`, `*`, `/`, and `%` are the foundation of all numeric computation. Reach for `%` (modulo) whenever you need to check divisibility or wrap a counter around a range. Be conscious of integer division any time you are dividing two integer values — if you need a fractional result, you will need floating-point types (covered in a later chapter). The assignment operator `=` appears in nearly every statement you write; remembering that it stores a value rather than asserting equality will prevent an entire category of bugs.
