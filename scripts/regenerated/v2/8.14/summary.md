## The idea

The previous lesson introduced the concept of pseudo-random number generators: algorithms that, given a seed, produce a long deterministic sequence of numbers that looks random. This lesson zooms in on the specific algorithm that the C++ standard library recommends for most work: the **Mersenne Twister**, named after the Mersenne prime 2^19937 − 1 that appears in its math.

The Mersenne Twister is not the simplest PRNG algorithm, but it has two properties that make it the right default. First, its period — the length of the sequence before it repeats — is astronomically large (2^19937 − 1 steps). You will never exhaust it in practice. Second, it passes a wide battery of statistical quality tests: the numbers it produces are distributed almost perfectly uniformly and exhibit no detectable correlation across nearby values.

The C++ standard library exposes the Mersenne Twister through two names: `std::mt19937` (32-bit output) and `std::mt19937_64` (64-bit output). For most programs, `std::mt19937` is the right choice.

## How it works

**Constructing and using the engine.** `std::mt19937` is a class. You construct it with a seed and then call `operator()` to draw successive values.

```cpp
#include <random>
#include <iostream>

int main()
{
    std::mt19937 rng{ 12345u };

    // draw three raw 32-bit values
    std::cout << rng() << '\n';  // first value
    std::cout << rng() << '\n';  // second value
    std::cout << rng() << '\n';  // third value
}
```

Each call to `rng()` advances the engine's internal state and returns the next number in the sequence. The range is `[0, 2^32 − 1]` (i.e., the full unsigned 32-bit range).

**Combining the engine with a distribution.** Raw engine output is rarely what you need. Pair it with a distribution object to get numbers in the right shape.

`std::uniform_int_distribution<int>` gives a uniformly distributed integer in a closed range `[a, b]`. `std::uniform_real_distribution<double>` gives a floating-point number in `[a, b)`. Both take the engine by reference each call.

```cpp
#include <random>
#include <iostream>

int main()
{
    std::mt19937 rng{ 42u };

    std::uniform_int_distribution<int>    iDist{  1, 10 };  // integers [1, 10]
    std::uniform_real_distribution<double> rDist{ 0.0, 1.0 }; // doubles [0, 1)

    for (int i = 0; i < 3; ++i)
        std::cout << iDist(rng) << "  " << rDist(rng) << '\n';
}
```

Notice that each call to `iDist(rng)` or `rDist(rng)` advances the same engine. The distributions share one engine and draw from the same sequence — they do not maintain separate state.

**Seeding strategies.** For reproducible output (testing, replays), use a fixed unsigned literal: `std::mt19937 rng{ 42u }`. For different output each run, seed with the system clock or `std::random_device`:

```cpp
#include <random>
#include <chrono>

int main()
{
    // time-based seed — different each run
    unsigned seed = static_cast<unsigned>(
        std::chrono::steady_clock::now().time_since_epoch().count());
    std::mt19937 rng{ seed };

    // std::random_device provides better entropy on most platforms
    std::random_device rd;
    std::mt19937 rng2{ rd() };
}
```

`std::random_device` is a non-deterministic source (it reads OS entropy when available). On platforms where it is supported, it produces better seeds than the clock.

## Common mistakes

**Mistake 1: using a signed literal as the seed.** `std::mt19937` is constructed from `std::uint_fast32_t`. If you pass a plain `int` literal, the compiler silently narrows it and may trigger a warning; passing `0` instead of `0u` is fine in practice but signals a misunderstanding of the type.

```cpp
// RISKY: signed int → implicit conversion, may trigger -Wnarrowing
std::mt19937 rng{ 42 };  // 42 is int

// CORRECT: explicitly unsigned
std::mt19937 rng{ 42u }; // no narrowing
```

**Mistake 2: calling `rng()` inside the distribution constructor.** The distribution constructor takes the range limits, not a call to the engine. A common typo is `std::uniform_int_distribution<int> d{ rng(), 6 }` — this draws one value from the engine just to build the distribution, consuming part of the sequence and producing a nonsensically large lower bound.

```cpp
// WRONG: consumes a value from the engine as a range bound
std::uniform_int_distribution<int> d{ rng(), 6 };

// CORRECT: bounds are literal values
std::uniform_int_distribution<int> d{ 1, 6 };
```

**Mistake 3: creating the distribution inside the loop.** Creating a `std::uniform_int_distribution` is cheap, but doing so inside a tight loop is wasteful and slightly misleading — it suggests the distribution changes each iteration when it does not.

```cpp
// WASTEFUL: rebuilds distribution on every iteration
for (int i = 0; i < 1000; ++i) {
    std::uniform_int_distribution<int> d{ 1, 6 };
    std::cout << d(rng) << '\n';
}

// BETTER: create once, reuse
std::uniform_int_distribution<int> d{ 1, 6 };
for (int i = 0; i < 1000; ++i)
    std::cout << d(rng) << '\n';
```

## When to use this

`std::mt19937` is the right choice whenever you need good statistical quality and a huge period — games, simulations, procedural content generation, fuzz testing. Use `std::mt19937_64` when you need 64-bit values or are generating very large quantities of numbers where the 32-bit version's slightly weaker uniformity would matter. Avoid `std::mt19937` for security-sensitive work (cryptographic tokens, passwords, nonces): use a cryptographic RNG such as those provided by the OS instead. For introductory programs that just need "some random numbers," `std::mt19937` with a fixed seed covers testing, and a `std::random_device` seed covers production.
