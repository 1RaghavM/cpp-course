## The idea

When a function needs to hand a `std::vector` back to its caller, the natural instinct is to worry: the function built a whole vector locally, and returning it means copying every element — potentially thousands of bytes — just to throw the original away. That concern is understandable, but modern C++ sidesteps it almost entirely through **move semantics**.

Move semantics is the language's way of transferring ownership of a resource from one object to another instead of duplicating it. Think of it like handing someone the keys to a car rather than cloning the vehicle. The source gives up its contents; the destination takes them. No copy is made, no extra memory is allocated.

For `std::vector`, this matters a lot. A vector owns a heap-allocated buffer. Moving a vector just hands that buffer pointer to the new owner and marks the old vector as empty. The cost is a few pointer swaps rather than copying every element.

You do not need to call any special function or write any special syntax to get this benefit when returning a vector from a function. The compiler arranges it for you.

## How it works

**Returning a local vector — the basic case**

```cpp
#include <iostream>
#include <vector>

std::vector<int> makeEvenNumbers(int count)
{
    std::vector<int> result;
    for (int i = 0; i < count; ++i)
        result.push_back((i + 1) * 2);
    return result;
}

int main()
{
    std::vector<int> evens { makeEvenNumbers(5) };
    for (int n : evens)
        std::cout << n << ' ';
    std::cout << '\n';
}
```

Output: `2 4 6 8 10`

When `return result;` executes, the compiler sees that `result` is a local variable about to go out of scope. It can construct `evens` directly in place — a technique called **copy elision** (specifically NRVO, Named Return Value Optimization). Even in cases where elision does not happen, the compiler automatically uses the vector's move constructor because `result` is a local variable being returned. Either way, no element-by-element copy occurs.

**Why returning by value is preferred over out-parameters**

Before move semantics, a common pattern was to pass a vector by reference to be filled in:

```cpp
// old-style out-parameter approach — not recommended
void fillSquares(std::vector<int>& out, int n)
{
    for (int i = 1; i <= n; ++i)
        out.push_back(i * i);
}

int main()
{
    std::vector<int> squares;
    fillSquares(squares, 4);   // caller must pre-declare and pass in
}
```

This is awkward: the caller must declare the vector first, and the function cannot communicate errors through its return value. With move semantics, returning by value is just as efficient and much cleaner.

**What a moved-from vector looks like**

A vector that has been moved from is left in a valid but unspecified state — you can safely assign to it or destroy it, but you should not read from it until you reset it.

```cpp
#include <iostream>
#include <vector>

std::vector<int> produce()
{
    std::vector<int> v { 10, 20, 30 };
    return v;  // move or elision happens here
}

int main()
{
    std::vector<int> a { produce() };
    std::cout << a.size() << '\n';  // prints 3
}
```

The temporary created by `produce()` moves into `a`. The temporary is then destroyed — an empty, already-moved vector — at no cost.

## Common mistakes

**Mistake 1: Returning a reference to a local variable**

```cpp
// WRONG — undefined behavior
std::vector<int>& getBad()
{
    std::vector<int> local { 1, 2, 3 };
    return local;  // local is destroyed when the function returns
}
```

The function returns a reference to `local`, which no longer exists once the function exits. Accessing the returned reference is undefined behavior — the program may crash, print garbage, or appear to work. Return by value instead; the move mechanism handles the cost.

**Mistake 2: Thinking a return-by-value copy is unavoidable**

Many learners add an unnecessary `std::move` call:

```cpp
std::vector<int> buildData()
{
    std::vector<int> data { 1, 2, 3 };
    return std::move(data);  // usually counterproductive
}
```

Writing `std::move` here actually prevents NRVO. The compiler can no longer elide the construction entirely because `std::move` turns `data` into an rvalue expression, suppressing the optimization. Just write `return data;` and let the compiler do the right thing.

**Mistake 3: Assuming the moved-from object is still usable**

```cpp
std::vector<int> src { 1, 2, 3 };
std::vector<int> dst { std::move(src) };  // src is now "empty"
std::cout << src[0] << '\n';  // undefined: src has been moved from
```

After a move, `src` may be empty or in some other valid-but-indeterminate state. Do not read from a moved-from vector unless you have reassigned it.

## When to use this

Return a `std::vector` by value whenever a function creates or transforms a collection and the caller needs the result. Move semantics (and copy elision) ensure this is cheap. Prefer this over filling an out-parameter passed by reference — return-by-value is clearer and equally fast. If you need to give a function access to an existing vector without copying it, pass by `const` reference (covered in "Passing std::vector") instead.
