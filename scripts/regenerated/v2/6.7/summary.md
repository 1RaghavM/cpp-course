## The idea

Relational operators compare two values and produce a `bool` result: `true` or `false`. They are the building blocks of every decision in a program. You use them to ask questions like "is this number bigger than that one?" or "are these two values equal?" The six relational operators are `<` (less than), `>` (greater than), `<=` (less than or equal), `>=` (greater than or equal), `==` (equal), and `!=` (not equal).

Comparing integers and characters is straightforward — the rules match mathematical intuition and the results are exact. Comparing floating-point numbers (`float`, `double`) is a different story. Because floating-point values are stored as binary approximations, tiny rounding errors accumulated during arithmetic can make two values that ought to be equal appear unequal when tested with `==`. Recognizing this pitfall and knowing how to work around it is one of the most practically important skills in numerical C++ programming.

## How it works

**Basic relational operators on integers**

```cpp
#include <iostream>

int main() {
    int a = 10;
    int b = 20;

    std::cout << (a <  b) << "\n";  // 1 (true)
    std::cout << (a >  b) << "\n";  // 0 (false)
    std::cout << (a == b) << "\n";  // 0 (false)
    std::cout << (a != b) << "\n";  // 1 (true)
    std::cout << (a <= 10) << "\n"; // 1 (true)
    return 0;
}
```

`std::cout` prints `true` as `1` and `false` as `0` by default. Relational comparisons follow mathematical intuition for integers. The result type is always `bool`, which means you can store it in a `bool` variable, pass it to a function, or use it directly as the condition of a `?:` expression.

**Floating-point comparison problem**

```cpp
#include <iostream>

int main() {
    double a = 0.1 + 0.2;
    double b = 0.3;

    std::cout << (a == b) << "\n";  // 0 (false!) even though mathematically equal
    std::cout << a << "\n";         // prints 0.3, but the internal bits differ
    return 0;
}
```

The binary representation of `0.1 + 0.2` is not identical to the representation of `0.3`. Both are tiny approximations that diverge at the least-significant bit. The `==` operator sees the raw bit pattern and returns `false`. This is not a C++ bug — it is how IEEE 754 floating-point arithmetic works in every mainstream language. Arithmetic on `double` values accumulates tiny errors, and direct equality tests do not account for those errors.

**Epsilon comparison — the correct pattern for floating-point equality**

```cpp
#include <iostream>
#include <cmath>

int main() {
    double a = 0.1 + 0.2;
    double b = 0.3;

    const double epsilon = 1e-9;
    bool nearlyEqual = std::abs(a - b) < epsilon;
    std::cout << nearlyEqual << "\n";  // 1 (true)
    return 0;
}
```

Instead of `a == b`, compute `std::abs(a - b)` and check whether it is smaller than a small tolerance value called epsilon. `std::abs` from `<cmath>` returns the absolute (non-negative) value of its argument. The choice of epsilon depends on how much rounding the computation has accumulated. For most double arithmetic with numbers near 1.0, `1e-9` is a reasonable starting point. For ordering comparisons (`<`, `>`, `<=`, `>=`) floating-point values, the operators work correctly without any epsilon adjustment — epsilon is only needed when you are testing equality.

## Common mistakes

**Using `==` to compare floating-point values**

```cpp
double x = 1.0 / 3.0;
double y = 3.0 * x;
if (y == 1.0) {
    std::cout << "equal\n";  // may never print
}
```

Mathematically `3 × (1/3) == 1`, but floating-point arithmetic introduces a rounding error. The `==` test almost certainly fails silently. Replace with an epsilon comparison: `std::abs(y - 1.0) < 1e-9`.

**Confusing `=` (assignment) with `==` (equality test)**

```cpp
int n = 5;
if (n = 10) {  // assigns 10 to n, then evaluates to 10
    std::cout << "match\n";  // always prints — n is now 10
}
```

`n = 10` is an assignment expression that evaluates to 10 (nonzero, therefore true), not a comparison. The condition is always true and the variable is silently modified. Compilers with `-Wall` warn about this, but it compiles. The fix is `n == 10`. Many teams adopt the habit of writing constants on the left (`10 == n`) to make the accidental-assignment form a compile error, though either style is valid.

**Misunderstanding ASCII ordering when comparing characters**

```cpp
char c = 'Z';
if (c > 'a') {
    std::cout << "Z comes after a alphabetically\n";  // does NOT print
}
```

Characters are compared by their underlying integer code. In ASCII, uppercase `'Z'` is 90 and lowercase `'a'` is 97. So `'Z' > 'a'` is false — uppercase letters have smaller codes than lowercase letters. Alphabetical case-insensitive ordering is not the same as ASCII ordering.

## When to use this

Relational operators appear in practically every program that makes a decision. They fill the condition slot of the `?:` operator you just studied, and they will be the conditions inside if-else statements and loops in later chapters. For integer and character comparisons, use all six operators freely — they behave exactly as expected. For floating-point comparisons, use `<` and `>` for ordering (safe to use directly), but replace `==` and `!=` with an epsilon-based check using `std::abs` from `<cmath>`. Any time a `double` value is the result of arithmetic rather than a literal, assume an epsilon comparison is needed before testing equality.
