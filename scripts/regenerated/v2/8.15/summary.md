## The idea

In the previous two lessons you learned that `std::mt19937` must be seeded once and then reused — creating a new engine on every call gives you the same sequence, or worse, the same single number repeated. But if you have multiple functions that each need random numbers, how do they all share the same engine?

One answer is to pass the engine as a parameter to every function that needs it. That works, but it is noisy: every function signature gains an extra parameter and every call site must remember to forward it.

A cleaner answer for introductory programs is to keep one global engine. The learncpp.com curriculum introduces a small single-header utility called `Random.h` that does exactly this: it creates and seeds one `std::mt19937` at program start and exposes a single function template, `Random::get(lo, hi)`, through which all code in the program draws numbers. This lesson covers how to use `Random.h` and, more importantly, why the *pattern* it represents is the right one for programs that don't want to thread an engine through every function call.

## How it works

**The Random.h pattern in outline.** `Random.h` defines a namespace `Random` containing a single static `std::mt19937` object that is seeded once (from `std::random_device` or a fallback) when the first `Random::get` call is made. You include the header, call `Random::get<int>(lo, hi)` whenever you need an integer, and the implementation handles everything else.

Because the lessons cannot paste external files, the examples below show the same logical pattern using a file-scope engine — a plain global variable in the same `.cpp` file:

```cpp
#include <random>
#include <iostream>

// One global engine, seeded once at startup
std::mt19937 globalRng{ std::random_device{}() };

int rollDie()
{
    std::uniform_int_distribution<int> d{ 1, 6 };
    return d(globalRng);
}

int main()
{
    std::cout << rollDie() << '\n';
    std::cout << rollDie() << '\n';
}
```

`rollDie()` does not take an engine parameter; it just uses the global one. The engine state advances with each call so consecutive calls return different values.

**Using a fixed seed for reproducibility.** When testing, replace the `std::random_device` seed with a fixed literal so the output is predictable:

```cpp
#include <random>
#include <iostream>

std::mt19937 globalRng{ 42u };  // fixed seed for tests

int pick(int lo, int hi)
{
    std::uniform_int_distribution<int> dist{ lo, hi };
    return dist(globalRng);
}

int main()
{
    for (int i = 0; i < 4; ++i)
        std::cout << pick(1, 10) << '\n';
}
```

With seed `42u` this always prints the same four numbers, making test cases easy to write and verify.

**Initializing a global engine at file scope.** A global variable is initialized before `main()` runs. For a `std::mt19937` seeded from `std::random_device`, this means the entropy is gathered at startup:

```cpp
// engine initialized once, before main()
std::mt19937 rng{ std::random_device{}() };
```

The expression `std::random_device{}()` constructs a temporary `std::random_device`, calls its `operator()` to get one entropy value, and immediately discards the device. The result seeds the Mersenne Twister with hardware randomness.

## Common mistakes

**Mistake 1: defining the global engine inside `main()`.** Moving the engine to `main()` makes it inaccessible to other functions unless you pass it as a parameter — defeating the whole point of the pattern.

```cpp
// BAD: engine defined inside main, invisible to other functions
int main()
{
    std::mt19937 rng{ 42u };
    // rollDie() cannot see rng without a parameter
}

// GOOD: engine at file scope
std::mt19937 rng{ 42u };
int main() { /* rollDie() can use rng directly */ }
```

**Mistake 2: re-creating the distribution on every call inside the function.** Creating a `std::uniform_int_distribution` is cheap, but re-creating it with different bounds when the bounds never change is wasteful. When the range is fixed, declare the distribution as a `static` local or a file-scope variable so it is constructed once:

```cpp
// SLIGHTLY WASTEFUL but correct:
int rollDie() {
    std::uniform_int_distribution<int> d{ 1, 6 };
    return d(globalRng);
}

// BETTER for a fixed range:
int rollDie() {
    static std::uniform_int_distribution<int> d{ 1, 6 };
    return d(globalRng);
}
```

**Mistake 3: seeding with `time(nullptr)` instead of `std::random_device`.** `time(nullptr)` returns seconds since the Unix epoch — it only changes once per second and produces the same seed for programs started in the same second, which is a real problem in automated tests or scripts that launch several instances quickly. `std::random_device` draws from OS entropy (keyboard timing, hardware noise) and is far harder to predict.

```cpp
// FRAGILE: same seed if two processes start in the same second
std::mt19937 rng{ static_cast<unsigned>(time(nullptr)) };

// BETTER: OS entropy
std::mt19937 rng{ std::random_device{}() };
```

## When to use this

The global-engine pattern (whether via `Random.h` or your own file-scope variable) is the right choice for single-file programs and early assignments where multiple functions need random numbers but you don't want to thread the engine through every call. As programs grow larger — multiple translation units, multi-threaded code — global state becomes harder to reason about and thread-unsafe; at that point you should pass the engine explicitly or use thread-local storage. For the programs in this course, the file-scope engine is the correct and idiomatic approach.
