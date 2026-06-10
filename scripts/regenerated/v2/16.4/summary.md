## The idea

You already know how to pass scalars and structs to functions by value or by reference. The same rules apply to `std::vector`, but the stakes are higher: a vector can hold thousands of elements. Passing it by value means copying every single element, which is slow. Passing it by `const` reference lets the function read the vector cheaply without copying anything. Passing it by non-const reference lets the function modify the original.

The mental model is identical to what you learned for `std::string` in earlier chapters: expensive-to-copy objects should be passed by `const` reference for read-only access, and by reference (or by pointer) when modification is needed. The only new wrinkle is that template syntax appears in the parameter type — `std::vector<int>&` is "reference to a vector of int" — but the semantics are identical.

## How it works

**Pass by const reference — reading without copying.**

When a function only needs to inspect the vector, declare the parameter as `const std::vector<T>&`:

```cpp
#include <iostream>
#include <vector>

void printAll(const std::vector<int>& v)
{
    for (int i = 0; i < std::ssize(v); ++i)
        std::cout << v[i] << '\n';
}

int main()
{
    std::vector<int> scores { 85, 92, 74 };
    printAll(scores);  // no copy made
    return 0;
}
```

The `const` prevents the function from accidentally modifying the vector. The `&` (reference) means the function works on the original object directly, no copy is made. This is the correct default when a function does not need to change the vector.

**Pass by (non-const) reference — modifying the caller's vector.**

When the function needs to change the vector, drop `const`:

```cpp
void doubleAll(std::vector<int>& v)
{
    for (int i = 0; i < std::ssize(v); ++i)
        v[i] *= 2;
}

int main()
{
    std::vector<int> nums { 1, 2, 3 };
    doubleAll(nums);
    // nums is now { 2, 4, 6 }
    return 0;
}
```

The caller's vector is modified in place; no copy is needed. The absence of `const` signals to readers that this function is allowed to change the argument.

**Pass by value — when you need your own copy.**

Occasionally a function needs to modify a local copy without affecting the caller. Passing by value creates a full copy:

```cpp
std::vector<int> sorted(std::vector<int> v)  // v is a copy
{
    // sort v here, return it
    // ... (sorting covered in later lessons)
    return v;
}
```

This is rarely the right choice for large vectors because the copy is expensive. Prefer `const` reference unless you explicitly need an independent copy.

**What happens if you forget the `&`.**

```cpp
void countElements(std::vector<int> v)  // by value — whole vector is copied!
{
    std::cout << v.size() << '\n';
}
```

This compiles and runs correctly, but silently copies every element on every call. For a vector of one million ints, that is one million copy operations each time you call this function. The compiler will not warn you. The `const &` form is almost always the right choice for inspection functions.

## Common mistakes

**Mistake 1: forgetting `const` on an in-parameter, then accidentally modifying it.**

```cpp
void sum(std::vector<int>& v)  // should be const&
{
    int total = 0;
    for (int i = 0; i < std::ssize(v); ++i)
        total += v[i];
    std::cout << total << '\n';
}
```

Without `const`, nothing stops someone from writing `v[0] = 0;` inside the function, silently corrupting the caller's data. Always add `const` when a function only reads.

**Mistake 2: passing a temporary or literal vector to a non-const reference parameter.**

```cpp
void inspect(std::vector<int>& v) { /* ... */ }

int main()
{
    inspect({ 1, 2, 3 });  // compile error
}
```

A temporary (like a brace-initialized vector) cannot bind to a non-const reference. The fix is either to make the parameter `const std::vector<int>&` (which can bind to temporaries) or to store the vector in a named variable first.

**Mistake 3: modifying an element of a `const` reference parameter.**

```cpp
void clearFirst(const std::vector<int>& v)
{
    v[0] = 0;  // compile error: cannot assign through const reference
}
```

This is caught at compile time, which is good — the `const` is doing its job. The fix is to either remove `const` (if modification is intended) or remove the assignment (if only reading is intended).

## When to use this

Whenever a function needs to work with the contents of a vector, pass by `const std::vector<T>&` as the default. Switch to `std::vector<T>&` only when the function's purpose is to mutate the caller's vector (fill it, sort it in place, etc.). Pass by value only when the function genuinely needs an independent copy and you are prepared to pay the copy cost — or when the vector is small and the function will move-from it (move semantics, covered later in this chapter). The same rule applies to vectors of any element type: `const std::vector<std::string>&`, `const std::vector<double>&`, and so on.
