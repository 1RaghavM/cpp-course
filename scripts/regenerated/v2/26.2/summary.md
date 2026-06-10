## The idea

So far, every template parameter you have used has been a type — `typename T` lets the compiler substitute `int`, `double`, or any other type. But templates can also accept values as parameters. A non-type template parameter is a compile-time constant baked directly into the type. Instead of writing `Buffer<int, 64>` where `64` is just another runtime variable, `64` becomes part of the type itself: `Buffer<int, 64>` and `Buffer<int, 128>` are completely different types, and the size is known and fixed at compile time.

The mental model: think of non-type parameters as extra labels stamped on the blueprint. The cookie cutter not only knows the shape of the dough (the type parameter) but also the exact thickness (the non-type parameter). Two cutters with different thicknesses produce incompatible cookies.

This is how `std::array` works under the hood: `std::array<int, 10>` is a class instantiated with a type (`int`) and a non-type size value (`10`).

## How it works

**Declaring a non-type parameter**

Declare non-type parameters after your type parameters (or instead of them). The most common kind is a `std::size_t` or `int`:

```cpp
#include <iostream>
#include <cassert>

template <typename T, int N>
class FixedArray {
    T data_[N]{};
public:
    T& operator[](int i) { assert(i >= 0 && i < N); return data_[i]; }
    const T& operator[](int i) const { assert(i >= 0 && i < N); return data_[i]; }
    int size() const { return N; }
};
```

Instantiate with a value:

```cpp
FixedArray<int, 5>  a;     // size 5, fixed at compile time
FixedArray<double, 3> b;   // size 3

a[0] = 10;
std::cout << a.size();   // prints 5
```

`FixedArray<int, 5>` and `FixedArray<int, 10>` are separate types — they cannot be assigned to each other.

**Non-type parameters can be used in compile-time expressions**

Because `N` is a compile-time constant, you can use it anywhere a constant expression is required: array sizes, `static_assert`, and `sizeof`-style calculations:

```cpp
template <int N>
struct Bits {
    static_assert(N > 0 && N <= 64, "N must be between 1 and 64");
    unsigned long long mask{ (N == 64) ? ~0ULL : (1ULL << N) - 1 };
};

Bits<8>  byte_mask;   // mask = 0xFF
Bits<0>  bad_mask;    // compile error from static_assert
```

The `static_assert` fires at compile time, not runtime — the error message appears before the program even runs.

**Out-of-class member definitions with non-type parameters**

The same rule that applies to type parameters applies here: repeat the full template header on every out-of-class definition.

```cpp
template <typename T, int N>
class Ring {
    T buf_[N]{};
    int head_{0};
public:
    void insert(const T& v);
};

template <typename T, int N>
void Ring<T, N>::insert(const T& v) {
    buf_[head_] = v;
    head_ = (head_ + 1) % N;
}
```

Notice both `T` and `N` appear in the qualifier `Ring<T, N>::`.

## Common mistakes

**Mistake 1 — Passing a non-constant as a non-type argument**

Non-type template arguments must be compile-time constants. Passing a runtime variable is a compile error:

```cpp
int n = 10;
FixedArray<int, n> arr;   // error: 'n' is not a constant expression
```

Fix: use a `constexpr` variable or an integer literal.

```cpp
constexpr int n = 10;
FixedArray<int, n> arr;   // OK
```

**Mistake 2 — Mixing up instances of different sizes**

Because `FixedArray<int, 5>` and `FixedArray<int, 10>` are different types, you cannot assign one to the other or pass one where the other is expected:

```cpp
FixedArray<int, 5>  small;
FixedArray<int, 10> large;
large = small;   // compile error: incompatible types
```

This is intentional — the compiler catches size mismatches that would be silent runtime bugs with a heap-allocated array. But it surprises learners who expect the template parameter to behave like a runtime size.

**Mistake 3 — Forgetting the non-type parameter in out-of-class definitions**

Just like type parameters, non-type parameters must appear in both the template header and the class-name qualifier:

```cpp
// WRONG
template <typename T>       // missing , int N
void Ring<T>::insert(const T& v) { ... }   // also missing <T, N>

// RIGHT
template <typename T, int N>
void Ring<T, N>::insert(const T& v) { ... }
```

Omitting `N` produces a "no matching function" or "wrong number of template parameters" error.

## When to use this

Non-type parameters are the right tool when a value is inherently part of a type's identity and must be known at compile time: fixed-size containers, compile-time bitmasks, dimension-checked math vectors (`Vec<float, 3>` vs `Vec<float, 4>`), and protocol frame sizes. Compile-time checking of these values catches whole classes of bugs — indexing past the end, mismatched dimensions — before the program runs.

If the size or value must vary at runtime, a non-type parameter is the wrong tool; use a constructor argument or a `std::vector` instead. Non-type parameters build on the template class concept from "Template classes" and set the stage for template specialization in the next two lessons.
