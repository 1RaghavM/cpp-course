## The idea

Every pointer you have used so far carries type information: an `int*` points to an `int`, a `double*` points to a `double`. The type tells the compiler how many bytes to read, how to interpret the bit pattern, and what operations are legal on the pointed-to value.

A **void pointer** (`void*`) is a pointer stripped of that type information. It holds a memory address, but the compiler has no idea what kind of object lives there. Because there is no type, you cannot dereference a `void*` directly, increment it by one element, or call any member functions through it. It is, in essence, a raw address.

The main use for `void*` is writing code that must work with any type of data — classically, generic memory operations like `memcpy` and older C-style interfaces that pre-date templates. In modern C++ with templates, `void*` appears far less often, but understanding it clarifies why C's `malloc` returns `void*` and how low-level memory manipulation functions operate.

## How it works

**Assigning to and from a void pointer**

Any pointer type converts implicitly to `void*`. Converting back requires an explicit cast:

```cpp
#include <iostream>
#include <cstring>

int main() {
    int value = 42;
    void* vp = &value;          // implicit: int* → void*

    int* ip = static_cast<int*>(vp);   // explicit cast back
    std::cout << *ip << "\n";          // 42
}
```

You must know the original type before casting back. Casting to the wrong type and dereferencing is undefined behavior.

**A function that accepts any pointer type**

The classic use case: a function that handles raw bytes without caring about the element type. `std::memcpy` from `<cstring>` has the signature `void* memcpy(void* dest, const void* src, std::size_t n)` — it copies `n` bytes from any source to any destination:

```cpp
#include <iostream>
#include <cstring>

int main() {
    int src[3] = {10, 20, 30};
    int dst[3] = {};

    std::memcpy(dst, src, sizeof(src));   // copy raw bytes

    for (int i = 0; i < 3; ++i)
        std::cout << dst[i] << " ";
    std::cout << "\n";   // 10 20 30
}
```

`memcpy` does not care that the data is `int` — it just copies bytes. That is only safe when the types on both ends are identical (and trivially copyable).

**`void*` and dynamic allocation**

C's `malloc` returns `void*` because it has no knowledge of the type being allocated. In C++ you would write:

```cpp
#include <cstdlib>
#include <iostream>

int main() {
    void* raw = std::malloc(sizeof(int));   // allocate sizeof(int) bytes
    int* p = static_cast<int*>(raw);        // must cast before use
    *p = 7;
    std::cout << *p << "\n";  // 7
    std::free(raw);            // must use free(), not delete
}
```

In C++ code, prefer `new`/`delete` over `malloc`/`free`. They are shown here only to illustrate where `void*` appears in C interfaces.

## Common mistakes

**Mistake 1 — Trying to dereference a void pointer directly**

```cpp
void* vp = /* some address */;
int x = *vp;   // compile error: cannot dereference a void*
```

The compiler refuses because it does not know how many bytes to read or how to interpret them. You must cast to a concrete type first.

**Mistake 2 — Casting back to the wrong type**

```cpp
double d = 3.14;
void* vp = &d;
int* ip = static_cast<int*>(vp);   // wrong type
std::cout << *ip << "\n";           // undefined behavior — reads double bits as int
```

The address is valid, but interpreting `double` bytes as `int` produces nonsense. `void*` gives you no safety net — the programmer is entirely responsible for knowing the original type.

**Mistake 3 — Mixing `malloc`/`free` with `new`/`delete`**

```cpp
int* p = new int{5};
std::free(p);    // undefined behavior — p came from new, must use delete

void* raw = std::malloc(sizeof(int));
delete static_cast<int*>(raw);   // undefined behavior — raw came from malloc
```

`malloc`/`free` and `new`/`delete` use different allocator machinery. Crossing them is undefined behavior. Always pair `malloc` with `free` and `new` with `delete`.

## When to use this

`void*` is appropriate when implementing a type-erased interface or calling a C library that requires it (e.g., passing a user-data pointer to a callback). It also appears in low-level memory utilities (`memcpy`, `memset`, `memmove`). In modern C++, templates provide type-safe generic code that eliminates most historical uses of `void*`. If you find yourself reaching for `void*` in new C++ code, first consider whether a template function or `std::byte*` (a type-safe byte pointer introduced in C++17) would serve better.
