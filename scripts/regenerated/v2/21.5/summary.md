## The idea

So far you have overloaded operators as free functions (with or without `friend`). C++ offers a second approach: defining the operator directly inside the class body as a member function. When an operator is a member, the left operand is always the object the function is called on — the implicit `this` — and only the right operand appears in the parameter list.

Member functions and free functions produce identical results in most cases, but each has distinct strengths. The important thing is knowing which form to reach for, because some operators *must* be members and others *should* stay as free functions.

## How it works

**Example 1: Member operator+ side-by-side with free operator+**

Here are the two forms for the same operator:

```cpp
// Free function form
Vec2 operator+(const Vec2& lhs, const Vec2& rhs) {
    return Vec2{lhs.x() + rhs.x(), lhs.y() + rhs.y()};
}

// Member function form (inside the Vec2 class body)
Vec2 operator+(const Vec2& rhs) const {
    return Vec2{m_x + rhs.m_x, m_y + rhs.m_y};
}
```

In the member form, `m_x` and `m_y` refer to the left operand implicitly via `this`. The `const` at the end marks that the operator does not modify `*this`. When you write `a + b`, the compiler calls `a.operator+(b)`.

**Example 2: Member operators that mutate — compound assignment**

Compound assignment operators (`+=`, `-=`, `*=`, `/=`) are almost always defined as members, because they always modify the left operand (which is `*this`):

```cpp
class Vec2 {
    int m_x{}, m_y{};
public:
    Vec2(int x, int y) : m_x{x}, m_y{y} {}

    Vec2& operator+=(const Vec2& rhs) {
        m_x += rhs.m_x;
        m_y += rhs.m_y;
        return *this;   // return reference to allow a += b += c
    }
    int x() const { return m_x; }
    int y() const { return m_y; }
};

int main() {
    Vec2 v{1, 2};
    v += Vec2{3, 4};
    std::cout << v.x() << " " << v.y() << "\n";  // 4 6
    return 0;
}
```

`operator+=` returns `Vec2&` (reference to `*this`) so chained assignment works. Notice it accesses `rhs.m_x` directly — member functions of a class can access private members of *any* object of the same class, not just `*this`.

**Example 3: When member functions don't work — the asymmetry problem**

Consider scaling a vector: `v * 3` and `3 * v` are both useful. A member `operator*` handles only the first:

```cpp
class Vec2 {
    int m_x{}, m_y{};
public:
    Vec2(int x, int y) : m_x{x}, m_y{y} {}

    // Member: left operand is always Vec2
    Vec2 operator*(int scale) const {
        return Vec2{m_x * scale, m_y * scale};
    }
};

Vec2 v{2, 3};
Vec2 r1 = v * 4;     // OK: calls v.operator*(4)
Vec2 r2 = 4 * v;     // ERROR: int has no operator*(Vec2)
```

To support `4 * v` you need a free function `operator*(int, const Vec2&)`. This is why symmetric arithmetic operators stay as free functions.

## Common mistakes

**Mistake 1: Forgetting `const` on non-mutating member operators**

```cpp
// WRONG — missing const
Vec2 operator+(const Vec2& rhs) {   // not const
    return Vec2{m_x + rhs.m_x, m_y + rhs.m_y};
}
```

Without `const`, you cannot call `operator+` on a `const Vec2` object. Any function that takes `const Vec2&` and tries to add two vectors together will fail:

```cpp
void printSum(const Vec2& a, const Vec2& b) {
    Vec2 r = a + b;   // error: calling non-const member on const a
}
```

Mark `operator+` and all other read-only operators as `const`.

**Mistake 2: Returning `*this` from arithmetic operators**

```cpp
// WRONG — modifies left operand
Vec2& operator+(const Vec2& rhs) {
    m_x += rhs.m_x;
    m_y += rhs.m_y;
    return *this;
}
```

Arithmetic operators should not modify either operand — they should return a new value. Returning `*this` corrupts the left operand and makes `a + b` a destructive operation. Reserve `return *this` for compound assignment (`+=`, etc.).

**Mistake 3: Making `operator<<` or `operator>>` a member**

```cpp
class Point {
public:
    // WRONG: leaves << with wrong operand order
    std::ostream& operator<<(std::ostream& out) const {
        out << m_x << " " << m_y;
        return out;
    }
};
```

With this definition `p.operator<<(std::cout)` becomes the call syntax, and you must write `p << std::cout` — which has `std::cout` on the right. The standard convention is `std::cout << p`, which requires a free function. I/O operators must always be free functions.

## When to use this

Use member functions for operators where the left operand is always an instance of your class and you want the tightest possible coupling:

- Compound assignment operators (`+=`, `-=`, `*=`, `/=`) — always a member
- Subscript `[]`, function call `()`, conversion operators — *must* be members (the language requires it)
- Unary operators (`-`, `+`, `!`, prefix `++`) — natural as members

Use free functions for:

- Binary arithmetic (`+`, `-`, `*`, `/`) — supports mixed-type and commutative calls
- Comparison operators when you want symmetric treatment of both operands
- `operator<<` and `operator>>` — must be free (as shown above)

A practical rule: if the left operand might be a type you don't own (like `int` or `std::ostream`), it must be a free function.
