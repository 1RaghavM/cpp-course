## The idea

The subscript operator `[]` is how C++ lets you write `container[index]` to read or modify an element. Built-in arrays support it directly; for your own class, you have to teach the compiler what `myObject[i]` means by overloading `operator[]`. The appeal is that your custom container — a fixed-size buffer, a sparse matrix, a ring buffer — can be accessed with the same bracket syntax as a plain array. Users don't need to call a separate `.get(i)` method; the familiar `obj[i]` just works.

The key design decision is whether `obj[i]` should be readable, writable, or both. For that, you usually provide two overloads: one that returns a `T&` for non-`const` objects (allows assignment) and one that returns a `const T&` for `const` objects (read-only access).

## How it works

**A basic fixed-size integer array**

The simplest subscript overload returns a reference to an internal element:

```cpp
#include <iostream>

class IntArray {
    int m_data[5]{};
public:
    int& operator[](int index) {
        return m_data[index];
    }
};

int main() {
    IntArray arr;
    arr[0] = 10;       // calls operator[], assigns through the reference
    arr[2] = 30;
    std::cout << arr[0] << ' ' << arr[2] << '\n'; // 10 30
}
```

Because `operator[]` returns `int&`, the caller can both read and write. `arr[0] = 10` stores a value; `arr[0]` reads it back.

**Adding the const overload**

When a `const IntArray` is passed to a function, the non-`const` `operator[]` is not callable. You need a second overload that takes `const` on the function itself:

```cpp
class IntArray {
    int m_data[5]{};
public:
    int& operator[](int index) {
        return m_data[index];
    }

    const int& operator[](int index) const {
        return m_data[index];
    }
};
```

The compiler chooses between the two overloads based on whether the object is `const`. On a `const IntArray`, only the `const` version is reachable; it returns `const int&`, preventing modification.

**Avoiding code duplication between the two overloads**

When the body is more than a one-liner, duplicating it in two overloads creates maintenance risk. One clean pattern: implement the non-`const` overload by casting away constness temporarily:

```cpp
int& operator[](int index) {
    return const_cast<int&>(
        static_cast<const IntArray&>(*this)[index]
    );
}

const int& operator[](int index) const {
    return m_data[index];   // real logic lives here
}
```

The logic lives in the `const` overload. The non-`const` overload adds `const` to `*this`, calls the `const` version, then casts the result back to a non-`const` reference. This is safe because `*this` is not actually `const` when the non-`const` overload is called.

## Common mistakes

**Returning by value instead of by reference**

```cpp
int operator[](int index) const { return m_data[index]; }
```

This works for reading, but `arr[0] = 10` becomes a no-op: you are assigning to a temporary copy that is immediately discarded. Always return a reference from `operator[]` unless you explicitly want read-only access.

**Missing the const overload**

```cpp
int& operator[](int index) { return m_data[index]; }
// No const overload
```

Code that takes a `const IntArray&` and tries to read `arr[i]` fails to compile, with an error like "no viable overloaded operator[] for type 'const IntArray'". Provide both overloads whenever the class will be passed around as `const`.

**Forgetting bounds checking**

The standard does not require `operator[]` to check bounds — `std::vector::operator[]` does not check either. If you access out-of-range indices the behavior is undefined, just like a raw array. Either add an assertion, or document the precondition clearly so callers know what inputs are valid. Do not silently return garbage.

**Returning a reference to a local or temporary**

```cpp
int& operator[](int index) {
    int copy = m_data[index];
    return copy;     // dangling reference — copy is destroyed on return
}
```

Returning a reference to a local variable leaves the caller with a dangling reference. Always return a reference to a member variable (or an element stored inside one), not to a stack-allocated copy.

## When to use this

Overload `operator[]` when your class represents a collection or sequence and you want natural element-access syntax. The prime use cases are fixed-size wrappers around arrays (like the `IntArray` above), custom string-like types with character access, and sparse data structures where the index-to-storage mapping is non-trivial.

Two-dimensional data is trickier: `operator[]` with a single index must return some proxy object to chain a second `[]`, which adds complexity. For a matrix or grid, overloading `operator()` with two parameters (covered in the next lesson) is simpler and more readable.

Skip `operator[]` for types that do not model a collection. A `Fraction` class does not need subscript access. When your class wraps a pointer to dynamically allocated memory, make sure you also handle the rule of three (copy constructor, copy-assignment, destructor) to keep element access safe — a topic connected to "Overloading the assignment operator" and "Shallow vs. deep copying" later in this chapter.
