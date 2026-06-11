## The idea

Every non-static member function in C++ receives a secret extra argument: a pointer to the object it was called on. This pointer is called `this`. You never write it in the parameter list — the compiler adds it invisibly — but it exists, and you can use it explicitly whenever you need to. The `this` pointer solves a simple problem: a function needs to know *which* object's data it should read or modify. Because `this` always points to the calling object, it ties the function body to the right piece of memory without any extra bookkeeping on your part.

The second idea in this lesson builds directly on `this`: **method chaining**. A member function can return `*this` — a reference to the object itself — so the caller can invoke another member function on the same object without repeating the variable name. You have seen this pattern whenever you write `std::cout << a << b << c`; the stream is the object, each `operator<<` returns the same stream, and the next `<<` applies to it again.

## How it works

**Accessing `this` explicitly**

Inside any non-static member function, `this` is a pointer of type `ClassName*` (or `const ClassName*` for const member functions). You can dereference it to get the object or use it to disambiguate a name that would otherwise be shadowed.

```cpp
struct Counter {
    int count{0};

    void set(int count) {
        this->count = count; // 'this->count' is the member; 'count' is the parameter
    }

    void print() const {
        std::cout << this->count << '\n'; // identical to just 'count'
    }
};
```

In `set`, the parameter is also called `count`. Without `this->`, the name on the left would refer to the parameter (a no-op assignment to itself). Writing `this->count` unambiguously names the member. In `print`, `this->count` and plain `count` mean the same thing — the `this->` is optional but sometimes clarifies intent.

**Returning `*this` for chaining**

A function that returns `ClassName&` can return `*this` — the dereferenced pointer — which is a reference to the calling object. The caller then applies the next call to that same reference.

```cpp
struct Builder {
    int x{0}, y{0};

    Builder& setX(int val) { x = val; return *this; }
    Builder& setY(int val) { y = val; return *this; }

    void print() const {
        std::cout << x << ' ' << y << '\n';
    }
};

int main() {
    Builder b;
    b.setX(3).setY(7).print(); // prints: 3 7
}
```

`setX(3)` returns a reference to `b`; `.setY(7)` is called on that reference (still `b`); `.print()` is called on `b` again. The chain reads left-to-right like a sentence: "set x, then set y, then print."

**`this` in const member functions**

When a member function is declared `const`, the type of `this` becomes `const ClassName*`. That means `this->member` is read-only — any attempt to modify a data member through `this` inside a `const` function produces a compile error.

```cpp
struct Box {
    int side{5};

    int volume() const {
        // side = 10; // error: this is 'const Box*'
        return side * side * side;
    }
};
```

The `const` qualifier is part of the function's signature and lets the compiler enforce immutability automatically.

## Common mistakes

**Mistake 1 — Returning `*this` by value instead of by reference**

```cpp
// WRONG — returns a copy, not the original
Builder setX(int val) { x = val; return *this; }
```

`return *this` without the `&` on the return type copies the object. The next call in the chain modifies the copy, not the original. The original `b` is never fully configured. Fix: add `&` to the return type: `Builder& setX(int val)`.

**Mistake 2 — Using `this` in a static member function**

```cpp
struct Foo {
    int data{0};
    static void show() {
        std::cout << this->data; // compile error: 'this' unavailable in static function
    }
};
```

Static member functions have no `this` pointer because they are not called on any particular object. The compiler error is typically: *'this' is unavailable for static member functions*. There is no fix other than making the function non-static or passing the object explicitly.

**Mistake 3 — Forgetting `const` on a getter, then being unable to chain on a const object**

```cpp
struct Point {
    int x{0}, y{0};
    int getX() { return x; }     // non-const getter
};

void inspect(const Point& p) {
    p.getX(); // compile error: cannot call non-const function on const object
}
```

Once you plan to chain member functions or pass objects by `const` reference, every function that does not modify the object must be marked `const`. Omitting `const` on a getter silently prevents it from being called on `const` objects — a mistake that often surfaces only later when you write a `const` parameter.

## When to use this

Use `this->member` explicitly only when a name collision makes the code ambiguous — typically when a parameter or local variable has the same name as a data member. In all other cases, plain member access is cleaner.

Return `*this` by reference whenever a member function sets a configuration value and callers are likely to set several values in succession. Builder-style configuration, string formatting helpers, and output stream operators are classic examples. Avoid chaining when the operations have side-effects that must be sequenced carefully: the left-to-right visual order of a chain is clear, but if each step can throw or depends on a prior step's success, a chain can obscure the control flow.

If every call in a chain is on a temporary (an rvalue), prefer returning `*this` with an rvalue ref-qualifier or simply accept that the chain returns a new value — but that topic belongs to a later lesson.
