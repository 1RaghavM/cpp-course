## The idea

Every object you create from a class gets its own copy of the class's data members. A `Counter` object has its own `count`, a `Player` object has its own `health` — that is the whole point of objects. But sometimes you want a single piece of data that belongs to the *class itself* rather than to any individual object: a value that is shared across every instance and that persists even when no objects exist.

Think of a car factory. Each car has its own serial number, but the factory has one master counter that tracks how many cars have been built total. Every time a car is manufactured, that factory-level counter goes up. You would not store that counter inside any individual car — it belongs to the factory. In C++, static member variables play exactly this role: they are factory-level data attached to the class, not to instances.

## How it works

A static member variable is declared inside the class with the `static` keyword, then defined outside the class (in most cases) to allocate storage. It is accessed via `ClassName::variable` and is shared by all instances.

```cpp
#include <iostream>

class Counter {
public:
    static int s_count;   // declaration — no storage yet
    Counter() { ++s_count; }
};

int Counter::s_count{ 0 };  // definition — storage allocated here

int main() {
    Counter a;
    Counter b;
    Counter c;
    std::cout << Counter::s_count << "\n";  // 3
}
```

Notice three things. First, `s_count` is declared inside the class but *defined* outside with `int Counter::s_count{ 0 };`. The outside definition is where the actual memory lives. Second, you access it with `Counter::s_count` — the class name, not an object name. Third, after three constructors run, `s_count` is 3 regardless of which object you ask.

You can also access a static member through an object, but that is just syntax sugar — there is still only one variable:

```cpp
Counter a;
Counter b;
a.s_count = 99;           // same as Counter::s_count = 99
std::cout << b.s_count;   // 99 — same variable
```

**Inline static members (C++17 and later)** allow you to define and initialize a static member right inside the class body using the `inline` keyword or `constexpr`:

```cpp
class Config {
public:
    static inline int s_maxRetries{ 3 };   // definition lives here
    static constexpr double PI{ 3.14159 }; // constexpr is implicitly inline
};
```

With `inline`, no separate out-of-class definition is needed. `constexpr` static members are always inline and must be initialized in the class body. Both are available in C++20, which is what this course uses. The older non-inline pattern (declaration inside, definition outside) still compiles and you will see it in real codebases, so you should recognize both forms.

**Private static members** are common when the data is an implementation detail:

```cpp
class IdGenerator {
    static inline int s_nextId{ 1 };   // private, so callers cannot tamper
public:
    static int generate() { return s_nextId++; }
};
```

Callers call `IdGenerator::generate()`, never touching `s_nextId` directly. This is good encapsulation.

## Common mistakes

**Forgetting the out-of-class definition for non-inline statics.** If you declare `static int s_count;` inside the class but never write `int Counter::s_count{ 0 };` outside, the linker will complain about an undefined symbol. The declaration inside the class reserves the name; the definition outside allocates storage. With `inline` or `constexpr` you skip the external definition, but for a plain `static int` the external definition is still required unless you add `inline`.

```cpp
// Wrong — missing external definition
class Broken {
public:
    static int s_val;  // declared, never defined
};
// Linker error: undefined reference to `Broken::s_val`
```

**Treating a static member like a per-object field.** Because you can write `obj.s_count`, beginners sometimes think each object has its own copy of the static member. There is only one copy. If object `a` changes it, object `b` sees the change immediately.

```cpp
Counter x;
Counter y;
x.s_count = 5;             // modifies THE shared variable
std::cout << y.s_count;    // prints 5, not the original value — surprise!
```

**Using the wrong access syntax and assuming it creates a new variable.** Writing `int local = obj.s_staticMember;` reads the shared value into a *local copy* — modifying `local` later does not change the static member. The name `s_staticMember` still refers to one shared variable; you only copied its current value.

## When to use this

Static member variables fit naturally when you need counters (how many instances exist), caches (a resource shared by all instances), or configuration constants (a `static constexpr` value that every object should read). They are also the right choice for singleton-like state that logically belongs to the class rather than to any individual object.

Avoid them when the data really does differ per object — that is what regular members are for. Overusing static members produces code that is hard to test (global mutable state disguised as a member) and easy to misuse (one object silently changing data that affects all others). Use the `const` or `constexpr` qualifier when the static value should never change after initialization, which covers most legitimate use cases such as class-wide constants.
