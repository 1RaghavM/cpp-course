## The idea

A full class template specialization pins down every template parameter. But what if you want to say: "Use a different implementation whenever T is a pointer, regardless of what T points to"? That is exactly what partial template specialization handles — you fix some of the template parameters while leaving others generic.

Think of it as a filter with multiple slots. A full specialization fills every slot with a specific value. A partial specialization fills some slots and leaves the rest open: "whenever the second slot is a pointer, use this blueprint, regardless of what fills the first slot."

Partial specializations are only allowed for class templates, not function templates. If you need type-specific behaviour in a function for a family of types (not just one), you will typically write a partial specialization of a helper class and then have the function call into it — or use function overloads.

## How it works

**A primary template and a partial specialization**

Suppose you have a utility that wraps and prints a value, but you want pointers to be dereferenced automatically:

```cpp
#include <iostream>

template <typename T>
class Printer {
public:
    static void print(const T& val) {
        std::cout << "value: " << val << "\n";
    }
};

// Partial specialization: matches any T* (pointer to T)
template <typename T>
class Printer<T*> {
public:
    static void print(T* val) {
        std::cout << "ptr->: " << *val << "\n";
    }
};
```

`Printer<int>` uses the primary. `Printer<int*>` uses the partial specialization. `Printer<double*>` also uses the partial specialization.

```cpp
int x = 42;
Printer<int>::print(x);     // prints  value: 42
Printer<int*>::print(&x);   // prints  ptr->: 42
```

**Partial specialization with multiple parameters**

If you have `template <typename T, typename U>`, you can specialize where only one of them is fixed:

```cpp
template <typename T, typename U>
class Pair {
public:
    static void info() { std::cout << "generic pair\n"; }
};

// Specialization where both types are the same
template <typename T>
class Pair<T, T> {
public:
    static void info() { std::cout << "same-type pair\n"; }
};
```

`Pair<int, double>` → primary. `Pair<int, int>` → specialization.

**Partial specializations can add constraints using non-type parameters**

```cpp
template <typename T, int N>
class Buffer {
public:
    T data[N]{};
    void describe() { std::cout << "buffer of " << N << "\n"; }
};

// Specialization for single-element buffers
template <typename T>
class Buffer<T, 1> {
public:
    T data[1]{};
    void describe() { std::cout << "single-element buffer\n"; }
};
```

`Buffer<int, 5>` → primary. `Buffer<double, 1>` → specialization.

## Common mistakes

**Mistake 1 — Trying to partially specialize a function template**

Partial specialization is only valid for class templates. Writing a partial specialization for a function template is a compile error:

```cpp
template <typename T>
void show(T v) { std::cout << v; }

// WRONG — partial function template specialization is not allowed
template <typename T>
void show<T*>(T* v) { std::cout << *v; }   // error
```

The workaround is either a non-template overload (`void show(T* v)`) or a partially specialized helper struct.

**Mistake 2 — Ambiguous specializations**

If you write two partial specializations that could both match the same type, the compiler reports an ambiguity error:

```cpp
template <typename T, typename U>
struct Combo {};

template <typename T>
struct Combo<T, int> {};    // matches Combo<X, int>

template <typename T>
struct Combo<int, T> {};    // matches Combo<int, X>

Combo<int, int> c;  // ambiguous: matches both
```

Design specializations to be non-overlapping.

**Mistake 3 — Using `template <>` instead of `template <typename T>` for a partial specialization**

A partial specialization still has open parameters, so the header must list them:

```cpp
// WRONG — this claims to be a full specialization but Printer<T*> still needs T
template <>
class Printer<T*> { ... };   // error: T is undeclared

// RIGHT
template <typename T>
class Printer<T*> { ... };
```

The header for a partial specialization looks like the primary template's header but with only the remaining (unfixed) parameters.

## When to use this

Partial template specialization is the backbone of compile-time type dispatch in C++. It powers `std::is_pointer<T>`, `std::remove_pointer<T>`, and most of `<type_traits>`. In application code, use it when you need a container or utility class to behave differently for a whole family of types (all pointers, all arrays, all pairs with identical types) without duplicating the class for each individual type. If you only need to intercept one specific type, a full specialization from "Class template specialization" is simpler.
