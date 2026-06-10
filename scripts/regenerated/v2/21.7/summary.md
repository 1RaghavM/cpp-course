## The idea

When you write `if (a < b)` with two integers, the compiler knows exactly how to compare them. When `a` and `b` are objects of your own class, the compiler has no idea — there is no built-in rule for comparing two `Fraction` values or two `Point` values. Comparison operator overloading is how you teach the compiler what "less than", "equal to", "greater than", and friends mean for your type.

The six comparison operators are `==`, `!=`, `<`, `>`, `<=`, and `>=`. Once you define them for a class, your objects can be sorted, searched, tested for equality, and used in any standard algorithm that relies on ordering — without the user of your class ever needing to call a named function like `.lessThan()`. The code reads the same way it would for plain integers.

## How it works

**Equality and inequality**

Equality is usually defined first. Decide which members make two objects "the same", then check those fields. Inequality is just the logical opposite, so delegate to `operator==` to avoid duplicating logic.

```cpp
#include <iostream>

struct Fraction {
    int num{};
    int den{ 1 };

    bool operator==(const Fraction& rhs) const {
        return num * rhs.den == rhs.num * den;
    }

    bool operator!=(const Fraction& rhs) const {
        return !(*this == rhs);
    }
};

int main() {
    Fraction a{ 1, 2 };
    Fraction b{ 2, 4 };
    std::cout << (a == b) << '\n'; // 1 (equal in value: 0.5 == 0.5)
}
```

Cross-multiplying avoids floating-point conversion and keeps everything in integer arithmetic. `operator!=` delegates to `operator==` — change the equality logic in one place and inequality follows automatically.

**Ordering operators**

Less-than (`<`) is the most important ordering operator because the standard library's sort algorithms only require `<`. Once you have `<`, the other three can be defined in terms of it: `a > b` is `b < a`, `a <= b` is `!(b < a)`, `a >= b` is `!(a < b)`.

```cpp
struct Weight {
    double kg{};

    bool operator<(const Weight& rhs) const { return kg < rhs.kg; }
    bool operator>(const Weight& rhs) const { return rhs < *this; }
    bool operator<=(const Weight& rhs) const { return !(rhs < *this); }
    bool operator>=(const Weight& rhs) const { return !(*this < rhs); }
};
```

Notice that `>`, `<=`, and `>=` all delegate to `operator<`. This means you only have one place to change the ordering logic.

**Friend functions vs. member functions**

Comparison operators are commonly written as member functions (as above) because the left operand is always `*this`. You can also write them as friend functions when you need access to private data without member access, or when you want both operands to be treated symmetrically:

```cpp
struct Point {
    int x{};
    int y{};

    friend bool operator==(const Point& lhs, const Point& rhs) {
        return lhs.x == rhs.x && lhs.y == rhs.y;
    }
    friend bool operator<(const Point& lhs, const Point& rhs) {
        if (lhs.x != rhs.x) return lhs.x < rhs.x;
        return lhs.y < rhs.y;
    }
};
```

The `Point` example uses lexicographic order: sort by x first, then by y for ties — a common and natural ordering for 2D points.

## Common mistakes

**Defining `>` independently instead of delegating to `<`**

```cpp
// Tempting but wrong if logic ever diverges:
bool operator>(const Weight& rhs) const { return kg > rhs.kg; }
```

There is now duplicate logic. If you later change the definition of `<` (e.g., to sort by absolute value), you must remember to update `>` too. Delegating to `<` is safer and keeps consistency guaranteed.

**Comparing fractions with floating-point arithmetic**

```cpp
// Wrong — floating-point precision issues:
bool operator==(const Fraction& rhs) const {
    return (double)num / den == (double)rhs.num / rhs.den;
}
```

`1/3` represented as a `double` may not equal `2/6` exactly. Cross-multiply with integers instead: `num * rhs.den == rhs.num * den`.

**Forgetting `const` on the member function**

```cpp
bool operator==(const Fraction& rhs) {  // missing const
    return num * rhs.den == rhs.num * den;
}
```

The function is now non-`const`, meaning it cannot be called on a `const Fraction`. Any code that receives a `const Fraction&` and tries to use `==` will get a compile error. Always mark comparison operators `const`.

## When to use this

Overload comparison operators whenever your class represents a value that users naturally want to compare or sort: fractions, coordinates, dates, durations, identifiers, scores. Skip them for types that have no meaningful ordering — comparing two `DatabaseConnection` objects with `<` would be meaningless.

If you only need equality (no ordering), define only `==` and `!=`. If you need full ordering for sorting or use in sorted containers, define all six — or at minimum `==` and `<` — using the delegation pattern shown above. This connects naturally to the arithmetic overloads from "Overloading the arithmetic operators using friend functions" and the I/O operators from "Overloading the I/O operators", giving your type a complete, natural interface.
