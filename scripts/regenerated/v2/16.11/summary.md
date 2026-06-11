## The idea

A stack is a data structure where you can only add and remove items at one end — the "top." Think of a stack of plates: you put a new plate on top, and when you need a plate you always take from the top. The most recently added item is the first one removed. This ordering is called last-in, first-out, or LIFO.

`std::vector` already supports all the operations a stack needs: `push_back` adds to the end, `pop_back` removes from the end, and `back` peeks at the last element without removing it. Because these three operations are all you need for LIFO behaviour, a vector serves as a perfectly capable stack out of the box — no extra data structure required. You can use it as a stack in one part of your program and still use `size`, subscripts, and range-based loops elsewhere, making it more flexible than a dedicated stack class.

## How it works

**push_back, back, and pop_back as stack operations**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> stack;

    stack.push_back(10);   // stack: [10]
    stack.push_back(20);   // stack: [10, 20]
    stack.push_back(30);   // stack: [10, 20, 30]

    std::cout << stack.back() << '\n';   // 30 (peek top)
    stack.pop_back();                    // stack: [10, 20]
    std::cout << stack.back() << '\n';   // 20
}
```

`back()` returns a reference to the last element but does not remove it. `pop_back()` removes the last element but returns nothing — it has return type `void`. The idiom for "read then remove" is always two separate calls: `back()` first to capture the value, then `pop_back()` to discard it. Trying to combine them in one expression does not work because `pop_back` returns nothing.

**Checking before popping**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> stack;

    stack.push_back(5);
    stack.push_back(3);

    while (!stack.empty())
    {
        std::cout << stack.back() << ' ';
        stack.pop_back();
    }
    std::cout << '\n';   // prints: 3 5
}
```

Always guard `pop_back` and `back` with an `empty()` check when the vector might be empty. Calling either on an empty vector is undefined behaviour — no exception is thrown, no diagnostic is printed; the program simply has undefined behaviour. The `empty()` function returns `true` when `size() == 0` and is the canonical check.

**Reversing a sequence with the stack pattern**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> original = {1, 2, 3, 4, 5};
    std::vector<int> rev;

    for (int i = 0; i < (int)original.size(); ++i)
        rev.push_back(original[i]);

    while (!rev.empty())
    {
        std::cout << rev.back() << ' ';
        rev.pop_back();
    }
    std::cout << '\n';   // 5 4 3 2 1
}
```

Pushing all elements onto a stack and then draining it is a standard reversal pattern — each element removed from the back comes out in reverse order of insertion. This exact idiom appears in bracket-matching parsers, expression evaluators, and depth-first traversal algorithms.

## Common mistakes

**Mistake 1: calling back() or pop_back() on an empty vector**

```cpp
std::vector<int> v;
std::cout << v.back();   // undefined behaviour — v is empty
v.pop_back();            // undefined behaviour — v is empty
```

Both `back()` and `pop_back()` require the vector to be non-empty. There is no automatic error or exception from the standard library for these calls on an empty vector — the behaviour is simply undefined. The fix is to check `!v.empty()` or `v.size() > 0` before every call to `back` or `pop_back` when the vector may have been drained.

**Mistake 2: trying to use pop_back() as if it returns the removed value**

```cpp
std::vector<int> v = {1, 2, 3};
int top = v.pop_back();   // compile error: pop_back() returns void
```

`pop_back()` returns `void`. To capture the value and remove it, you always need two statements:

```cpp
int top = v.back();
v.pop_back();
```

This two-step design is intentional — it avoids an unnecessary copy in generic code when the caller does not need the removed value.

**Mistake 3: assuming pop_back releases capacity**

```cpp
std::vector<int> v = {1, 2, 3, 4, 5};
v.pop_back();
// v.size() == 4, but v.capacity() is unchanged (still 5 or more)
```

Like `resize` to a smaller size, `pop_back` reduces the element count by one but does not shrink the allocated memory block. Capacity remains at least as large as before. This is usually desirable — it avoids an expensive reallocation every time you remove an element — but it surprises people who expect memory to be freed immediately.

## When to use this

Use the vector-as-stack pattern whenever your algorithm needs LIFO ordering: undo histories, bracket-matching parsers, depth-first graph traversal, expression evaluators, and call-stack simulations all naturally reach for a stack. Using `std::vector` is idiomatic for these cases in C++ because a vector also supports random access and iteration, giving you more tools than a dedicated stack class.

If you specifically need to enforce the stack contract and prevent callers from accidentally accessing arbitrary indices, `std::stack` from `<stack>` wraps a vector (or deque) and exposes only `push`, `pop`, `top`, and `empty`. For learning purposes and most application code, the plain `std::vector` with `push_back` / `pop_back` / `back` is the more common and flexible choice.
