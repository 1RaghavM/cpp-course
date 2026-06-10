## The idea

Chapter 16 introduced `std::vector` as C++'s go-to dynamic array — a container that manages a contiguous block of heap memory, grows automatically as you add elements, and gives you O(1) random access. Over twelve lessons you moved from the simplest declaration all the way to the vector's stack interface and its unusual `bool` specialisation.

The unifying theme is that `std::vector` gives you flexibility (unknown size at compile time, runtime growth) at the cost of one layer of indirection to the heap — but with careful use of `reserve`, even that cost is often paid once up front rather than on every insertion.

## How it works

**Construction and the list-constructor family**

You can build a vector in several ways: default-constructed (empty), sized with an optional fill value, or initialised from a brace list. Lessons 16.1 and 16.2 established that the list-constructor wins over the size-constructor when both could match — `std::vector<int> v{3}` creates a one-element vector `{3}`, while `std::vector<int> v(3)` creates three zero-initialised elements.

**The signed/unsigned length problem and its solutions**

`size()` returns `std::size_t`, an unsigned type. Mixing it with `int` loop variables produces signed/unsigned comparison warnings and, worse, silent wrap-around bugs when a subtraction underflows (lesson 16.3). The chapter offered three idiomatic solutions: cast `size()` to `int` in the loop header, use a signed index throughout with an explicit cast of the bound, or use range-based for to sidestep indexing entirely.

**Passing and returning vectors**

Passing by `const std::vector<T>&` avoids copying the entire array — you read without owning (lesson 16.4). Returning by value is safe and efficient because the compiler applies move semantics (lesson 16.5): the return does not copy every element; it transfers ownership of the internal buffer to the caller in O(1).

**Loops over vectors**

The index loop (lesson 16.6) with a signed `int` counter and a `<` comparison against `(int)v.size()` is the baseline idiom for any loop that needs the index value. Range-based for (lesson 16.8) is the cleaner choice when you only need element values and no position — `for (int x : v)` or `for (const auto& x : v)`. Lesson 16.7 catalogued the sign-challenge solutions in detail so you always have a reference for the tricky mixing cases.

**Enum-indexed vectors**

An unscoped enum with a sentinel enumerator (`count` or `numFoo`) at the end is the standard idiom for giving symbolic names to fixed-set array positions (lesson 16.9). The sentinel doubles as both the correct initial size and the correct loop bound. Scoped enums (`enum class`) require an explicit `static_cast` before use as a subscript.

**Size, capacity, and resize/reserve**

`size` is how many elements you have inserted. `capacity` is how many the allocated block can hold before reallocation. `push_back` is amortised O(1) because vectors typically double capacity on each reallocation (lesson 16.10). Call `reserve(n)` before a known batch of insertions to eliminate intermediate reallocations. `resize(n)` changes the size: growing value-initialises new slots; shrinking destroys extra elements but does not release memory.

**Stack behaviour**

`push_back` / `back` / `pop_back` implement a LIFO stack on top of a vector (lesson 16.11). Always check `!v.empty()` before calling `back` or `pop_back` — calling either on an empty vector is undefined behaviour. `pop_back` returns `void`; to consume the top value you need `back()` first, then `pop_back()`.

**std::vector<bool>**

The standard permits `std::vector<bool>` to bit-pack elements for space savings (lesson 16.12). The consequence is that subscripting returns a proxy object instead of a `bool&`. This makes `bool& b = v[i]` a compile error and `for (bool& b : v)` a compile error. Use `auto b` or `bool b` (by value) when iterating; use `std::vector<char>` when you genuinely need `bool&` semantics.

## Common mistakes

**Forgetting that list-init beats size-init**

```cpp
std::vector<int> v{5};   // one element: {5}
std::vector<int> w(5);   // five elements: {0,0,0,0,0}
```

When the argument matches both constructors, braces select the initialiser-list constructor. Use parentheses when you mean "size."

**Invalidating iterators and pointers after push_back**

```cpp
std::vector<int> v = {1, 2, 3};
int* p = &v[0];
v.push_back(4);    // may reallocate — p is now dangling
std::cout << *p;   // undefined behaviour
```

Any `push_back` that triggers reallocation invalidates every pointer, reference, and iterator into the vector. Re-acquire them after structural modifications.

**Calling back() or pop_back() on an empty vector**

```cpp
std::vector<int> v;
v.pop_back();   // undefined behaviour
```

There is no exception or diagnostic; the behaviour is simply undefined. Always guard with `!v.empty()`.

## When to use this

`std::vector` is the default container for any sequence of same-type values whose count is not known at compile time. It replaces raw arrays in almost every case: safer lifetime management, automatic resizing, and no manual memory management.

Reach for `std::array` (chapter 17) when the size is a compile-time constant and you want to avoid heap allocation. Reach for `std::vector<char>` instead of `std::vector<bool>` when you need real references to boolean elements. For stacks that must enforce the LIFO contract in an API boundary, `std::stack` wraps a vector (or deque) and removes the random-access interface. Everything else — iteration, sorting, searching — works on `std::vector` directly with the loop patterns and algorithms covered in later chapters.
