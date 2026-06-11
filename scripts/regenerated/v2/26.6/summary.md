## The idea

The previous lesson introduced partial template specialization in its general form. This lesson focuses on the most common practical application: writing specializations specifically for pointer types. Pointers deserve special treatment in many generic contexts because a pointer is not the same as the thing it points to — iterating over a `const char*` means reading characters, not reading an address; comparing two `T*` values often means you want to compare the pointed-to objects, not the pointer addresses.

The pattern is always the same: the primary template handles value types, and the partial specialization `ClassName<T*>` intercepts any pointer regardless of what `T` is. The specialization typically dereferences, deep-copies, or otherwise treats the pointer transparently.

This is also how the standard library distinguishes `std::less<T>` for values versus `std::less<T*>` for pointers, and it is the foundation of smart-pointer wrappers that store raw pointers internally but present a value-like interface.

## How it works

**The basic pattern**

A partial specialization for pointers receives the raw pointer type, then works with the pointed-to value:

```cpp
#include <iostream>

template <typename T>
class DisplayAs {
public:
    static void show(const T& v) {
        std::cout << "value: " << v << "\n";
    }
};

template <typename T>
class DisplayAs<T*> {
public:
    static void show(T* p) {
        if (p)
            std::cout << "deref: " << *p << "\n";
        else
            std::cout << "null\n";
    }
};
```

`DisplayAs<int>` prints `value: 42`. `DisplayAs<int*>` dereferences and prints `deref: 42`. `DisplayAs<double*>` also uses the specialization.

**Storing a copy of the pointed-to value**

A specialization can deep-copy rather than storing the pointer, making the container safe even after the pointed-to object goes out of scope:

```cpp
#include <cstring>

template <typename T>
class Store {
    T data_;
public:
    explicit Store(T v) : data_{v} {}
    T get() const { return data_; }
};

template <typename T>
class Store<T*> {
    T copy_;          // store a copy of the value, not the pointer
public:
    explicit Store(T* p) : copy_{*p} {}
    T get() const { return copy_; }
};
```

`Store<int*> s{&x}` copies the `int`, not the address. Even if `x` is destroyed later, `s.get()` returns the captured value safely.

**Member functions outside the specialization body**

Definitions outside a partial specialization still carry the partial template header:

```cpp
template <typename T>
class Store<T*> {
    T copy_;
public:
    explicit Store(T* p);
    T get() const;
};

template <typename T>
Store<T*>::Store(T* p) : copy_{*p} {}

template <typename T>
T Store<T*>::get() const { return copy_; }
```

The qualifier `Store<T*>::` uses the specialization pattern; the header `template <typename T>` retains the free type parameter.

## Common mistakes

**Mistake 1 — Storing the pointer rather than copying the value**

The whole point of a pointer specialization is often to treat the object, not the address. Storing the raw pointer re-introduces lifetime and aliasing problems:

```cpp
// WRONG — stores the address; object may be destroyed
template <typename T>
class Store<T*> {
    T* ptr_;   // dangerous: who owns this? when does it become invalid?
public:
    explicit Store(T* p) : ptr_{p} {}
    T get() const { return *ptr_; }  // undefined behaviour if p is gone
};
```

If you must store the pointer (e.g., a non-owning view), document the lifetime requirement explicitly.

**Mistake 2 — Not handling null pointers**

A pointer argument can always be null. If the specialization dereferences without checking, it exhibits undefined behaviour on null input:

```cpp
template <typename T>
class DisplayAs<T*> {
public:
    static void show(T* p) {
        std::cout << *p << "\n";   // crash if p == nullptr
    }
};
```

Always guard with a null check, or document that the function requires a non-null pointer.

**Mistake 3 — Forgetting that `T*` and `const T*` are different partial specializations**

The specialization `Store<T*>` matches `Store<int*>` but does NOT match `Store<const int*>`. A `const int*` pointer has a different type — `T` would be deduced as `const int`, which matches `Store<T*>` with `T = const int`. This usually works correctly but can surprise you if your specialization assumes it can modify through the pointer.

## When to use this

Pointer partial specializations are the right tool when a class or utility must behave differently for pointer types as a category — without writing a separate specialization for every possible pointer (`int*`, `double*`, `MyClass*`). Common uses: smart-pointer-like wrappers, comparison functors that compare pointed-to values, serializers that dereference before encoding, and null-safe printers.

When you only need special behaviour for one specific pointer type (such as `const char*` for C-strings), a full specialization for that exact type is cleaner and more expressive than a partial specialization. Combine both techniques as needed: a partial specialization for all pointers, overridden by a full specialization for `const char*`.
