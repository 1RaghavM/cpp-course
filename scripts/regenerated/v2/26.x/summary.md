## The idea

Chapter 26 explored how C++ templates extend beyond simple function and class templates to cover specialization — the ability to give a template a completely custom implementation for a specific type argument. You began with template classes (the generic machinery), then added precision control with non-type parameters, and finally learned to specialize: fully for a single concrete type, partially for a family of types defined by a pattern (such as all pointer types), and fully for a pointer type when partial is too broad.

The chapter's central insight is that a template is a blueprint with a default behavior, and specialization is how you install an exception — a hand-written implementation that the compiler picks automatically when the type argument matches. This mechanism powers significant parts of the C++ standard library: `std::hash`, `std::less`, `std::numeric_limits`, and smart pointer wrappers all rely on partial or full specialization.

## How it works

**Template classes**

A class template parameterizes the class on one or more types. The compiler instantiates a concrete class for every distinct set of template arguments it encounters.

```cpp
template <typename T>
class Box {
    T value_;
public:
    explicit Box(T v) : value_{v} {}
    T get() const { return value_; }
};
```

`Box<int>`, `Box<double>`, and `Box<std::string>` are three distinct classes generated from the same template.

**Non-type parameters**

A template can take a value as a parameter, not just a type. The value must be a compile-time constant:

```cpp
template <typename T, int N>
class FixedArray {
    T data_[N]{};
public:
    int size() const { return N; }
    T&  operator[](int i) { return data_[i]; }
};
```

`FixedArray<int, 5>` has a five-element array baked in at compile time — no heap allocation, size known to the compiler.

**Function template specialization**

A full specialization replaces the template's body for one specific type. The `template <>` header marks it as a full specialization:

```cpp
template <typename T>
void print(T v) { std::cout << v << "\n"; }

template <>
void print<bool>(bool v) {
    std::cout << (v ? "true" : "false") << "\n";
}
```

`print(42)` uses the primary template. `print(true)` uses the specialization. The compiler picks the most specific match.

**Class template specialization**

A class can be fully specialized for one type:

```cpp
template <typename T>
class Wrapper {
    T data_;
public:
    explicit Wrapper(T v) : data_{v} {}
    void show() const { std::cout << "generic: " << data_ << "\n"; }
};

template <>
class Wrapper<bool> {
    bool data_;
public:
    explicit Wrapper(bool v) : data_{v} {}
    void show() const { std::cout << "bool: " << (data_ ? "yes" : "no") << "\n"; }
};
```

`Wrapper<bool>` is a completely separate class from `Wrapper<int>`. It can have different members, different constructors, and different member functions.

**Partial template specialization**

A partial specialization matches a pattern rather than a single type. It still has free type parameters:

```cpp
template <typename T>
class Pair {
    T first_, second_;
public:
    Pair(T a, T b) : first_{a}, second_{b} {}
    void show() const { std::cout << first_ << " " << second_ << "\n"; }
};

template <typename T>
class Pair<T*> {           // matches any pointer type
    T* first_;
    T* second_;
public:
    Pair(T* a, T* b) : first_{a}, second_{b} {}
    void show() const { std::cout << *first_ << " " << *second_ << "\n"; }
};
```

`Pair<int>` uses the primary. `Pair<int*>` uses the pointer partial specialization.

**Partial specialization for pointers (specific pattern)**

The most common pattern: a primary template handles values, a `T*` partial specialization handles all pointer types:

```cpp
template <typename T>
class Store {
    T data_;
public:
    explicit Store(T v) : data_{v} {}
    T get() const { return data_; }
};

template <typename T>
class Store<T*> {
    T copy_;             // store a copy of the pointed-to value
public:
    explicit Store(T* p) : copy_{*p} {}
    T get() const { return copy_; }
};
```

`Store<int*> s{&x}` copies the int into `copy_`. After `x` is destroyed, `s.get()` still returns the captured value.

## Common mistakes

**Trying to write a partial specialization for a function template**

Function templates support full specialization only — not partial. Attempting `template <typename T> void f<T*>(T* p)` is a compile error. The workaround is to use a class template with a static function and partially specialize the class, or to use overloading instead of specialization for functions.

```cpp
// WRONG: partial function template specialization
template <typename T>
void process<T*>(T* p) { /* ... */ }  // compile error

// RIGHT: overload instead
template <typename T>
void process(T* p) { /* ... */ }      // separate overload, not a specialization
```

**Forgetting that `T*` and `const T*` are distinct in partial specializations**

`Store<T*>` matches `Store<int*>` with `T = int`. It also matches `Store<const int*>` with `T = const int`. This usually works, but if the specialization modifies through the pointer it will fail at compile time for `const T*`. Add a separate specialization for `const T*` when needed.

**Member definitions outside a partial specialization must carry the partial template header**

When defining a member function outside the class body, the syntax requires the partial header `template <typename T>` and the qualifier `ClassName<T*>::`:

```cpp
template <typename T>
Store<T*>::Store(T* p) : copy_{*p} {}   // correct

Store<T*>::Store(T* p) : copy_{*p} {}   // WRONG: missing template header
```

Without the header, the compiler cannot resolve `T`.

## When to use this

Reach for template classes when you want a generic container or utility that works identically for multiple types — `Box<T>`, `Stack<T>`, `Pair<T, U>`. Add non-type parameters when a size or count must be compile-time constant (fixed buffers, index ranges, bit masks).

Use full specialization when one specific type needs fundamentally different behavior — `std::hash<bool>`, `Wrapper<bool>`. Use partial specialization when a *pattern* of types shares the same special behavior — all pointers, all arrays, all `std::pair<T, U>`. Prefer overloading to partial function specialization, since function templates only support full specialization.
