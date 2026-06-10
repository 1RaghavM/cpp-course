## The idea

Every value in a C++ program has a type, and the language occasionally needs to move a value from one type to another automatically — without you writing any conversion code. This automatic process is called **implicit type conversion** (also called an implicit cast or coercion). You have already used it without realizing it: any time you assign an `int` to a `double`, or pass an integer literal to a function expecting a `double` parameter, the compiler silently transforms the value for you.

Think of it like currency exchange at a bank. When you give the teller 100 euros and ask for dollars, the teller does the conversion behind the scenes and hands back an equivalent amount in a different denomination. Neither you nor the teller pretends the two currencies are the same thing — a transformation genuinely happened. Implicit conversion is the compiler acting as that teller: it reads the source type, determines a compatible target type, and produces a new value in the target type.

The key insight is that implicit conversion always produces a **new value**. The original variable is never changed. If you store an `int x = 5` and the compiler implicitly converts it to `double`, the `int` variable `x` remains 5; the compiler just creates a temporary `double 5.0` for use in that expression.

## How it works

Implicit conversions happen in several situations. The three most common are initializations and assignments, function calls, and arithmetic expressions.

**Initialization and assignment**

```cpp
#include <iostream>

int main() {
    int i = 7;
    double d = i;          // int → double, d is 7.0
    std::cout << d << "\n"; // prints 7
    return 0;
}
```

When the compiler sees `double d = i;` it recognizes that `int` cannot be stored directly in a `double` slot, so it converts `7` to `7.0`. The result is an exact representation because small integers are representable as doubles.

**Function calls**

```cpp
#include <iostream>

void printDouble(double x) {
    std::cout << x << "\n";
}

int main() {
    int count = 42;
    printDouble(count);   // int 42 implicitly converted to double 42.0
    return 0;
}
```

At the call site `printDouble(count)`, the compiler sees that the parameter type is `double` but the argument is `int`. It applies the same `int → double` conversion automatically. The function receives a freshly created `double` copy; the original `int count` is unaffected.

**Arithmetic expressions**

```cpp
#include <iostream>

int main() {
    int apples = 3;
    double priceEach = 1.25;
    double total = apples * priceEach;   // int 3 → double 3.0, then 3.0 * 1.25
    std::cout << total << "\n";           // prints 3.75
    return 0;
}
```

When the compiler sees `apples * priceEach`, it has an `int` on the left and a `double` on the right. The rules say `int` promotes to `double`, so it converts `3` to `3.0`, then multiplies two doubles to get `3.75`.

## Common mistakes

**Mistake 1: Assuming integer arithmetic gives a decimal result**

```cpp
#include <iostream>

int main() {
    int a = 7;
    int b = 2;
    double result = a / b;   // programmer expects 3.5
    std::cout << result << "\n"; // actually prints 3
    return 0;
}
```

The conversion to `double` happens *after* the division. Both `a` and `b` are `int`, so the division `a / b` is integer division producing `3`, and then `3` is converted to `3.0`. The programmer wanted `3.5`. The fix is to ensure at least one operand is `double` before the division, or to use an explicit cast — but explicit casts are covered in a later lesson. For now, recognize why this trap exists: implicit conversion does not reach inside a subexpression and change the types of already-typed operands.

**Mistake 2: Expecting `bool` to print "true" or "false"**

```cpp
#include <iostream>

int main() {
    bool flag = true;
    int n = flag;            // bool → int: true becomes 1
    std::cout << n << "\n";  // prints 1, not "true"
    return 0;
}
```

`bool` is treated as a small integer type: `true` converts to `1` and `false` to `0`. This is a legitimate implicit conversion and the compiler will not warn about it. If you want text output you need `std::boolalpha` from `<iostream>`, but the core point here is that the conversion itself is silent and loss-free.

**Mistake 3: Implicit conversion hiding a signed/unsigned mismatch**

```cpp
#include <iostream>

int main() {
    unsigned int u = 5;
    int s = -1;
    double d = u + s;      // s converts to unsigned: -1 becomes a huge positive
    std::cout << d << "\n"; // prints a very large number, not 4
    return 0;
}
```

When one operand is `unsigned int` and the other is `int`, the `int` is converted to `unsigned int`. The value `-1` wraps around to `4294967295` on a 32-bit system, and *that* is what gets stored in `d`. The implicit conversion did not protect you; it silently produced a nonsensical result. Compilers typically warn about signed/unsigned comparison but not always about mixed arithmetic.

## When to use this

Implicit conversion is not something you "choose" — it happens automatically whenever the source and target types differ and a safe conversion rule exists. The relevant skill is recognizing when an implicit conversion is occurring so you can reason about whether it is benign or dangerous. Widening conversions — `int` to `double`, `char` to `int`, `bool` to `int` — are generally safe because no information is lost. Narrowing conversions — `double` to `int`, `long` to `short` — can lose information and will be covered in the lesson on narrowing conversions. For now, treat implicit conversion as the compiler doing you a favor in simple widening cases, and be alert when types diverge in ways that could change the numeric outcome.
