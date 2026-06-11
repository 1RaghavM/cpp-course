## The idea

Up to this point everything you have written about C++ has come from a tutorial — a path chosen for you, ordered so each new concept lands gently. Tutorials are perfect for beginners. They are also limited: they cover what an author thought was useful, in the order an author thought was right, and they stop covering when the lesson ends.

A language reference is the opposite of a tutorial. It is exhaustive and unordered, written for someone who already knows where they want to go. Instead of teaching, it documents. For C++, the community-maintained reference at cppreference.com lists every keyword, every standard-library function, every overload, every requirement. It is the place professional C++ programmers go when they need a fact, not a story.

The skill this lesson teaches is small but high-leverage: how to read a reference page well enough to answer your own questions. Once you can do that, you stop being limited to what any single tutorial covers. You can pick up a feature, look it up, and use it correctly the same day. Every later chapter of this course assumes you can do this — and so does every C++ codebase you will ever read.

## How it works

A typical cppreference page has the same shape. It starts with the function or type's name, then a list of overloads or member functions, then a description, then parameters, return value, examples, and a short list of related items. The most important habit is to read top to bottom rather than skipping to the example.

Consider a tiny snippet that mimics the way overloads are presented:

```cpp
// from https://en.cppreference.com/w/cpp/algorithm/min
// (1) constexpr const T& min( const T& a, const T& b );
// (2) constexpr T  min( std::initializer_list<T> ilist );
```

Each numbered line is a different overload. The numbers exist so the description below can say things like "overload (1) returns the smaller of the two arguments". The `const T&` and `T` are the parameter types written in template form — `T` is whatever type you call it with. Reading the signature first tells you exactly what shape the call must have before you even read the prose.

Next, look for "Return value" and "Parameters". These two sections answer the two questions you almost always have: what does the function give back, and what do I have to feed it? If the page says the return is "the smaller of `a` and `b`", you know without running anything what to expect.

The third habit is to scan the "Possible implementation" block when it exists. The standard library does not require any particular implementation, but cppreference often shows one for clarity:

```cpp
// possible implementation of std::min (overload 1)
template <typename T>
const T& min(const T& a, const T& b) { return (a < b) ? a : b; }
```

Seeing the implementation removes mystery. If you can read the implementation, you understand the function — there is no further secret. For the standard library you will rarely write this code yourself, but the reading skill matters: every codebase contains functions whose only documentation is the source.

Finally, watch the "Since C++NN" markers at the top of each entry. A page may show four overloads, three of which appeared in C++17 and one in C++23. If your compiler targets C++20, the C++23 overload is invisible to you no matter how perfectly you spell it.

## Common mistakes

The first mistake is skipping straight to the example. The example shows you one valid use, often a contrived one. It does not tell you what the function actually accepts, what it returns, or when it fails. Reading the signature first, then the description, costs five extra seconds and answers questions the example silently hid.

The second mistake is mistaking one overload for the function. A page like `std::min` has several signatures. Code that compiles when you intend one overload but actually selects another is a real bug — `std::min({1,2,3})` calls the initializer-list overload, not the two-argument one, and forgetting that distinction has tripped up enough people that cppreference makes the numbering obvious.

The third mistake is reading a cppreference page for C++ and assuming the description applies unchanged to C. The two languages share a heritage but have separate references — `printf` on cppreference's C section describes a different surface than `std::printf` on the C++ section. Match the reference to the language you are writing.

## When to use this

Reach for the reference any time you are not sure whether a function does exactly what you think — even if you have used it before. Reach for it when you need a function and do not yet know the name; cppreference's algorithm and string pages are short enough to skim. Reach for it when a compiler error mentions a name you do not recognize. Save the reference for that role; it is a bad substitute for a tutorial when you are first learning a feature, because it is written for people who already know the feature exists. The next chapter (14) opens classes, which have a much larger surface than structs — the reference becomes part of your daily workflow from here on.
