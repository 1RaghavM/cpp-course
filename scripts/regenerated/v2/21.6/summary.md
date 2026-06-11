## The idea

Unary operators work on a single operand. When you write `-temperature`, the minus sign doesn't add two things together — it flips the sign of one. When you write `!flag`, there is no second value involved; you're asking "is this thing false?" Three unary operators are especially useful to overload for your own types: unary `+` (positive), unary `-` (negation), and `!` (logical not). The goal is to let your class participate naturally in expressions that look exactly like built-in arithmetic and logic — `if (!account)`, `auto flipped = -velocity`, `auto confirmed = +measured`.

Because these operators take no right-hand argument from the programmer's perspective, the implementation is simpler than binary operators. There is no second operand to pass, no commutativity to worry about, and no friend function is needed when you implement them as member functions.

## How it works

**Unary minus on a 2D vector**

The simplest case: flip the signs of both components and return a new object.

```cpp
#include <iostream>

class Vec2 {
public:
    double x{};
    double y{};

    Vec2 operator-() const {
        return Vec2{ -x, -y };
    }
};

int main() {
    Vec2 v{ 3.0, -5.0 };
    Vec2 w = -v;
    std::cout << w.x << ' ' << w.y << '\n'; // -3 5
}
```

The member function takes no parameters because the implicit `this` pointer already points at the operand. The `const` qualifier is essential: negation should not change the original object. The function returns a brand-new `Vec2` by value, leaving `v` untouched.

**Unary plus**

Unary `+` usually returns the object unchanged — a no-op for built-in types. It still makes sense to overload it for symmetry or when you want it to return a normalized or canonical form.

```cpp
class Celsius {
public:
    double value{};

    Celsius operator+() const {
        return Celsius{ value };   // returns a copy, no change
    }

    Celsius operator-() const {
        return Celsius{ -value };
    }
};
```

Omitting `operator+` is perfectly valid; most classes skip it entirely. Include it only when the operation has a meaning in your domain.

**Logical not on a nullable integer**

`operator!` conventionally returns a `bool` (or something implicitly convertible to `bool`) and indicates "this object is in a falsy state". Think of it the same way you think of `!ptr` for a pointer.

```cpp
#include <iostream>

class OptionalInt {
public:
    int value{};
    bool hasValue{ false };

    bool operator!() const {
        return !hasValue;
    }
};

int main() {
    OptionalInt empty{};
    OptionalInt full{ 42, true };

    if (!empty) std::cout << "empty has no value\n"; // prints
    if (!full)  std::cout << "full has no value\n";  // does not print
}
```

The return type of `operator!` is almost always `bool`. Returning some other type is legal but confusing and should be avoided.

**Member vs. free-function style**

All three unary operators work naturally as member functions because there is only one operand — the object itself. You can also write them as free (friend) functions for symmetry with your binary overloads, but members are the conventional choice here:

```cpp
// As a friend function (less common for unary operators):
class Score {
    int m_pts{};
public:
    Score(int p) : m_pts{ p } {}
    friend Score operator-(const Score& s);
};

Score operator-(const Score& s) {
    return Score{ -s.m_pts };
}
```

Both styles compile and behave identically for the caller.

## Common mistakes

**Forgetting `const` and accidentally modifying the object**

```cpp
// Wrong: operator- modifies the object instead of returning a new one
Vec2 operator-() {        // missing const
    x = -x;              // mutates!
    y = -y;
    return *this;
}
```

The result is that `-v` changes `v` in place, so `v` and `-v` now hold the same (already-flipped) values. Always return a new object from unary `-` and `+`, and mark the function `const`.

**Returning `*this` instead of a new object**

```cpp
// Wrong:
Vec2 operator-() const {
    return *this;         // forgot to negate; returns the original
}
```

This compiles silently and produces no compiler warning, but `-v` equals `v`. Trace through mentally: `return Vec2{ -x, -y }` is what you want.

**Making `operator!` return something that isn't `bool`**

```cpp
// Problematic — returns OptionalInt instead of bool:
OptionalInt operator!() const {
    return OptionalInt{ 0, !hasValue };
}
```

Code like `if (!empty)` still compiles if `OptionalInt` is implicitly convertible to `bool` or `int`, but it is surprising and fragile. Return `bool` directly.

## When to use this

Overload unary `-` whenever your type represents a quantity that has a natural opposite — velocities, forces, temperature offsets, monetary debits. Overload `operator!` when your type has a meaningful notion of emptiness or invalidity, like a nullable wrapper, a result type, or a handle that can be unset. Skip unary `+` unless your domain genuinely needs it (e.g., a unit type that promotes to a canonical form).

When both unary and binary arithmetic make sense for the same type — like `Vec2` above — combine them with the binary overloads covered in "Overloading the arithmetic operators using friend functions" and the member-function style from "Overloading operators using member functions". The user of your class should never have to think about whether operators are members or friends; the syntax should just work.
