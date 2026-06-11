## The idea

Imagine you have a `Temperature` class that stores a value in Celsius. If you write `Temperature t = 98.6;`, should that compile? The answer depends on how you designed the class. By default, a constructor that can be called with a single argument acts as an implicit conversion channel — the compiler will quietly convert `98.6` into a `Temperature` whenever that conversion would make an expression valid. This can be incredibly convenient or incredibly dangerous depending on the type.

The `explicit` keyword lets you close that channel. Marking a constructor `explicit` means it can still be called directly, but the compiler will never use it for implicit conversions or copy-initialization from a mismatched type. You write `explicit` once, at the point of declaration, and every call site that relied on the invisible conversion immediately becomes a compile error — a good thing when the conversion is semantically surprising.

## How it works

**Converting constructors**

Any constructor that can be called with a single argument is called a *converting constructor*. This includes constructors with exactly one parameter, and constructors with multiple parameters where all but the first have defaults.

```cpp
class Dollars {
public:
    Dollars(int cents) : m_cents{cents} {}
    int cents() const { return m_cents; }
private:
    int m_cents;
};

void print(Dollars d) {
    std::cout << d.cents() << " cents\n";
}

int main() {
    print(500);          // implicit: 500 → Dollars{500} — compiles!
    Dollars d = 300;     // implicit copy initialization — also compiles
}
```

The compiler inserts the conversion automatically because `Dollars(int)` is not marked `explicit`. Most of the time this is a bug waiting to happen — calling `print(500)` reads like printing an integer, not a monetary amount.

**The explicit keyword**

Adding `explicit` disables implicit conversions and copy-initialization from a mismatched type:

```cpp
class Dollars {
public:
    explicit Dollars(int cents) : m_cents{cents} {}
    int cents() const { return m_cents; }
private:
    int m_cents;
};

void print(Dollars d) { std::cout << d.cents() << " cents\n"; }

int main() {
    print(500);           // error: no implicit conversion from int to Dollars
    print(Dollars{500});  // OK: explicit construction
    Dollars d{300};       // OK: direct-list initialization bypasses the restriction
    Dollars e = 300;      // error: copy initialization from int not allowed
    Dollars f = Dollars{300}; // OK: explicit construction on the right
}
```

After adding `explicit`, direct construction (`Dollars{300}`, `Dollars(300)`) still works. Only the *implicit* path is blocked.

**When explicit applies to multi-parameter constructors**

`explicit` also matters for constructors called via copy-list initialization `= {…}`:

```cpp
class Point {
public:
    explicit Point(int x, int y) : m_x{x}, m_y{y} {}
    int x() const { return m_x; }
    int y() const { return m_y; }
private:
    int m_x, m_y;
};

void draw(Point p) { std::cout << p.x() << "," << p.y() << "\n"; }

int main() {
    draw({1, 2});          // error: explicit constructor, no implicit conversion
    draw(Point{1, 2});     // OK
    Point p = {3, 4};      // error: copy-list initialization blocked by explicit
    Point q{3, 4};         // OK: direct-list initialization
}
```

## Common mistakes

**Mistake 1 — Forgetting explicit on single-argument constructors**

The most common mistake is omitting `explicit` on a single-argument constructor and later being surprised by silent conversions:

```cpp
class Duration {
public:
    Duration(int seconds) : m_s{seconds} {}  // no explicit
private:
    int m_s;
};

void delay(Duration d);

void run() {
    delay(5);   // silently converts 5 seconds — OK intentionally?
    delay(true); // also compiles: bool→int→Duration — almost never intended
}
```

When `bool` can be silently converted to your class because it can first convert to `int`, you almost certainly have a bug waiting. Mark single-argument constructors `explicit` unless the conversion is genuinely natural (like `std::string` accepting a `const char*`).

**Mistake 2 — Thinking explicit blocks direct-list initialization**

A common misconception is that `explicit` prevents *all* construction forms:

```cpp
explicit Dollars(int cents);

Dollars d{100};   // fine — direct-list initialization still works
Dollars e(100);   // fine — direct initialization still works
Dollars f = 100;  // error — copy initialization from int blocked
```

`explicit` only blocks the *implicit* conversion path. Any syntax where you name the type explicitly still works.

**Mistake 3 — Applying explicit to copy constructors**

Marking the copy constructor `explicit` is legal but almost never correct:

```cpp
struct Bad {
    explicit Bad(const Bad& other) = default;  // this compiles...
};

Bad a{};
Bad b = a;  // error: copy initialization blocked — extremely surprising!
```

Copy constructors with `explicit` break standard idioms like function return values and pass-by-value parameters. Virtually all copy constructors should be non-explicit.

## When to use this

Use `explicit` on every single-argument constructor unless the conversion it represents is genuinely unsurprising and well-documented — `std::string(const char*)` is the canonical example of an intentionally implicit conversion. For domain types like `Dollars`, `Temperature`, `Duration`, or `Color`, an implicit conversion from a raw integer almost always leads to confusing call sites. Mark these `explicit` and let callers be deliberate.

Multi-argument constructors are rarely invoked implicitly, but `explicit` still matters if you want to prevent `= {…}` copy-list initialization on the right-hand side of an assignment.

Cross-reference: the interaction between `explicit` and the initialization forms was introduced in "Class initialization and copy elision". The copy constructor's `explicit` behavior also connects to "Introduction to the copy constructor".
