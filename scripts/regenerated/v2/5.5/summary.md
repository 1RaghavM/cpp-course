## The idea

Not every expression can be evaluated at compile time, and not every expression needs to be. A **constant expression** is an expression whose value the compiler can determine while it is compiling your program — before any line of your code runs on a CPU. The key insight is that this is a *property of the expression*, not just a description of what happens to be optimized away.

Think of it this way: the compiler is reading your source file and doing arithmetic in its head. Some subproblems are solvable right then — `4 + 5`, the product of two integer constants, the value of a named `const int` initialized from other constants. Other subproblems are unsolvable until runtime — user input, the result of a function that reads a file, the current time. A constant expression is one the compiler can solve without any runtime information.

Why does this matter? Because certain C++ features require values that are known at compile time. Array sizes, template arguments, and (in later chapters) `static_assert` all need constant expressions. Understanding what qualifies gives you the mental model needed to reason about why some constructs compile and others do not.

## How it works

**Example 1 — a simple constant expression**

```cpp
#include <iostream>

int main() {
    const int tiles_per_row = 8;
    const int total_tiles = tiles_per_row * tiles_per_row;  // constant expression
    std::cout << total_tiles << "\n";
    return 0;
}
```

Both `tiles_per_row` and `total_tiles` are constant expressions. `tiles_per_row` is initialized with the literal `8` (a constant expression), and `total_tiles` is initialized with `tiles_per_row * tiles_per_row`, which is also a constant expression because both operands are known at compile time. The compiler can compute `64` without running the program.

**Example 2 — a non-constant expression**

```cpp
#include <iostream>

int main() {
    int x;
    std::cin >> x;
    int y = x * 2;  // NOT a constant expression — x is unknown at compile time
    std::cout << y << "\n";
    return 0;
}
```

Here, `x * 2` is not a constant expression. The compiler cannot know what the user will type, so the multiplication must happen at runtime. This is perfectly fine code — most runtime values are non-constant — but `y` cannot be used anywhere that requires a compile-time value.

**Example 3 — a const variable that is not a constant expression**

```cpp
#include <iostream>

int getNumber() {
    int n;
    std::cin >> n;
    return n;
}

int main() {
    const int limit = getNumber();  // const, but NOT a constant expression
    std::cout << limit << "\n";
    return 0;
}
```

This is the subtle case. `limit` is `const` — it will not change after it is set — but its initial value depends on user input. The compiler cannot know `limit` at build time. So `limit` is `const` but is not a constant expression. The `const` keyword means "this variable will not change"; it does not mean "this variable is known at compile time."

## Common mistakes

**Mistake 1 — confusing `const` with "compile-time constant"**

Many beginners assume that any `const` variable is a constant expression. This is only true when the initializer is itself a constant expression:

```cpp
const int a = 5;        // constant expression — initializer is a literal
const int b = a + 1;    // constant expression — a is a constant expression

int runtimeVal = 7;
const int c = runtimeVal;  // const, but NOT a constant expression
                           // runtimeVal could have been anything
```

`c` cannot be used where a compile-time constant is required, even though it is `const`. The value of `c` depends on `runtimeVal`, which was set at runtime.

**Mistake 2 — thinking that variables with obvious values are constant expressions**

Even if the human reader can see the value will always be `7`, the compiler reasons about types and initialization chains, not about what seems obvious:

```cpp
int x = 7;             // x is not const — could be modified later
const int y = x;       // y is const but NOT a constant expression
                       // initialized from a non-constant expression
```

Because `x` is not `const`, `x` is not a constant expression, so `y`'s initializer is not a constant expression either, even though the value will always be `7` in practice.

**Mistake 3 — assuming a function return value is a constant expression**

Regular functions (not marked `constexpr`, which is covered in the next lesson) never produce constant expressions, even if the function body only uses constant values:

```cpp
int double_it(int n) { return n * 2; }

int main() {
    const int result = double_it(5);  // NOT a constant expression
    return 0;
}
```

`double_it(5)` is a runtime call. The compiler does not evaluate regular function bodies at compile time. The `constexpr` keyword (next lesson) is what makes functions usable in constant expressions.

## When to use this

Constant expressions become important whenever a language feature demands a compile-time value — fixed-size arrays, `static_assert`, and template parameters are the most common examples in later chapters. For now, the practical takeaway is to prefer `const` with literal or compile-time initializers whenever a value will not change, and to understand that `const` alone is not enough when compile-time evaluation is required.

The concept also helps you understand why the compiler sometimes rejects code with messages like "expression must be a constant expression" — the value needed was not computable at compile time, even if it looks obvious to you. The next lesson on `constexpr` variables gives you the explicit tool to require and verify compile-time evaluation.
