## The idea

Function template specialization lets you override one function for a specific type. Class template specialization does the same thing but for an entire class — you provide a completely different implementation of a class for one particular type argument.

The motivation is that some types behave so differently that a generic implementation would be wrong, wasteful, or impossible. The classic example is a collection of `bool` values: the generic template might store each `bool` in a full `int` (4 bytes), while a specialization can pack eight booleans into a single byte. The outside interface stays the same; the internal machinery is entirely different.

Another common motivation is correctness: a `Storage<T>` that stores objects by value works fine for most types, but `Storage<const char*>` storing a raw pointer would be dangerously wrong for string data — it needs to deep-copy the characters. A class template specialization gives you a different implementation with the same name.

## How it works

**The primary template**

Start with the generic class:

```cpp
#include <iostream>

template <typename T>
class Storage {
    T data_;
public:
    explicit Storage(T v) : data_{v} {}
    void print() const { std::cout << "Value: " << data_ << "\n"; }
};
```

**Writing a full class specialization**

A full class specialization is written with `template <>` and the concrete type in angle brackets after the class name. You rewrite the entire class body:

```cpp
template <>
class Storage<bool> {
    bool data_;
public:
    explicit Storage(bool v) : data_{v} {}
    void print() const {
        std::cout << "Bool: " << (data_ ? "true" : "false") << "\n";
    }
};
```

Now `Storage<int>` uses the primary template (prints `Value: 5`), while `Storage<bool>` uses the specialization (prints `Bool: true`).

**Defining member functions outside the specialization**

Member functions of the specialization that are defined outside the class body do NOT use `template <>` again — they belong to a concrete class, not to a template:

```cpp
template <>
class Storage<double> {
    double data_;
public:
    explicit Storage(double v);
    void print() const;
};

// No template<> here — Storage<double> is a concrete class
Storage<double>::Storage(double v) : data_{v} {}
void Storage<double>::print() const {
    std::cout << "Double: " << data_ << "\n";
}
```

This is a key difference from the primary template, where out-of-class definitions require `template <typename T>`.

**A more complete example**

Here is a `Wrapper` that behaves differently for `const char*` to safely hold a string:

```cpp
#include <cstring>

template <typename T>
class Wrapper {
    T val_;
public:
    Wrapper(T v) : val_{v} {}
    T get() const { return val_; }
};

template <>
class Wrapper<const char*> {
    char buf_[128]{};
public:
    explicit Wrapper(const char* s) { std::strncpy(buf_, s, 127); }
    const char* get() const { return buf_; }
};
```

The string specialization copies characters into a local buffer rather than storing a pointer.

## Common mistakes

**Mistake 1 — Adding `template <>` to the specialization's out-of-class member definitions**

A specialization creates a concrete class, so its out-of-class member definitions look like regular (non-template) class member definitions — not template ones:

```cpp
// WRONG — template<> does not belong here
template <>
void Storage<double>::print() const { ... }

// RIGHT
void Storage<double>::print() const { ... }
```

Adding `template <>` on the member definition is a compile error.

**Mistake 2 — Assuming the specialization inherits members from the primary template**

The specialization is an entirely independent class. If the primary template has a member function `info()` and the specialization does not, calling `info()` on the specialization is a compile error. You must re-implement every member you need.

```cpp
Storage<int> si{5};  si.info();    // OK — primary has info()
Storage<bool> sb{true}; sb.info(); // error — specialization has no info()
```

**Mistake 3 — Forgetting to declare all necessary constructors**

Because the specialization is a separate class, it does not inherit the primary's constructors. You must write every constructor you need, including copy/move constructors if your specialization manages resources.

## When to use this

Class template specialization is most valuable for type-safe wrappers around fundamentally different representations (bit-packed booleans, null-terminated strings, SIMD types) and for correctness patches (raw pointer specializations that copy instead of pointing). In library code, specializations of `std::hash`, `std::numeric_limits`, and `std::iterator_traits` all follow this pattern.

For most application code, prefer the generic template with good defaults. A specialization is a maintenance commitment — every new member function you add to the primary template must also be added to every specialization. Use it only when the generic version is genuinely wrong or unacceptably slow for the specialized type.
