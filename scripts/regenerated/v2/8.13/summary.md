## The idea

Randomness is everywhere in software — games that need unpredictable dice rolls, simulations that model real-world noise, tests that need varied input. Computers, however, are deterministic machines. Every calculation follows fixed rules, producing the same output for the same input every time. So how do you get "random" numbers out of a machine that cannot surprise itself?

The answer is a **pseudo-random number generator** (PRNG). A PRNG is an algorithm that starts with a number called the **seed** and applies a mathematical formula repeatedly, producing a long sequence of numbers that *look* random — spread evenly, without obvious patterns — even though the sequence is completely determined by the seed. Change the seed, get a different sequence. Use the same seed, get the exact same sequence. This property (reproducibility from a seed) is what makes PRNGs both useful and testable.

C++ provides PRNG machinery in the `<random>` header, introduced in C++11. The header contains both PRNG engines (which generate the raw numbers) and distribution adaptors (which map those raw numbers into useful ranges or shapes).

## How it works

**Step 1: include the header and pick an engine.** The standard library ships several engines. The most commonly used is `std::mt19937`, which implements the Mersenne Twister algorithm — a high-quality 32-bit PRNG.

```cpp
#include <random>
#include <iostream>

int main()
{
    std::mt19937 rng{ 42u };  // seed = 42
    std::cout << rng() << '\n'; // prints a raw 32-bit number
    std::cout << rng() << '\n'; // prints the next one
}
```

`rng()` calls the engine's `operator()`, advancing its internal state and returning the next number in the sequence. The numbers are in the range `[0, 2^32 - 1]`.

**Step 2: use a distribution to get numbers in the range you actually want.** Raw engine output spans the whole 32-bit range, which is rarely what you need. Distribution objects adapt raw numbers into a chosen range or probability shape. For integers in a closed range `[low, high]`, use `std::uniform_int_distribution`:

```cpp
#include <random>
#include <iostream>

int main()
{
    std::mt19937 rng{ 42u };
    std::uniform_int_distribution<int> dist{ 1, 6 };  // simulates a die

    for (int i = 0; i < 5; ++i)
        std::cout << dist(rng) << ' ';  // pass engine into distribution
    std::cout << '\n';
}
```

Notice the pattern: the distribution object takes the engine as an argument each call. The distribution does not own the engine; it borrows it.

**Step 3: seed from the system clock for non-reproducible output.** When you want different results each run, seed with something that changes each time — the system clock is the classic choice:

```cpp
#include <random>
#include <chrono>
#include <iostream>

int main()
{
    unsigned seed = static_cast<unsigned>(
        std::chrono::steady_clock::now().time_since_epoch().count()
    );
    std::mt19937 rng{ seed };
    std::uniform_int_distribution<int> dist{ 1, 100 };
    std::cout << dist(rng) << '\n';
}
```

`std::chrono::steady_clock::now().time_since_epoch().count()` returns a large integer representing elapsed time, which is almost always unique across runs.

## Common mistakes

**Mistake 1: reseeding on every call.** A very common beginner error is to create a new PRNG engine inside a loop or helper function, re-seeding it each time. If all calls happen within the same clock tick, every engine gets the same seed and produces the same number — which is the opposite of random.

```cpp
// BAD: re-creates the engine each time
for (int i = 0; i < 5; ++i) {
    std::mt19937 rng{ static_cast<unsigned>(
        std::chrono::steady_clock::now().time_since_epoch().count()) };
    std::uniform_int_distribution<int> d{ 1, 6 };
    std::cout << d(rng) << ' '; // all 5 numbers are likely identical
}
```

Fix: create the engine **once**, outside any loop, and reuse it.

**Mistake 2: using `%` to clamp the raw output.** Before `<random>` existed, code like `rng() % 6 + 1` was common. This is *modulo bias*: because `2^32` is not evenly divisible by 6, some numbers come up slightly more often than others. `std::uniform_int_distribution` eliminates this bias using rejection sampling internally.

```cpp
// BAD: biased
std::cout << (rng() % 6 + 1) << '\n';

// GOOD: unbiased
std::uniform_int_distribution<int> d{ 1, 6 };
std::cout << d(rng) << '\n';
```

**Mistake 3: forgetting that the same seed always gives the same sequence.** This trips people up when debugging. If you use a fixed seed for testing (which is the right thing to do), remember to switch to a time-based or `std::random_device` seed for the actual program — or vice versa.

## When to use this

Reach for `<random>` whenever you need numbers that must not be predictable or must cover a range without bias: game mechanics (dice, card shuffles, enemy spawns), random test-input generators, simulations, or any feature described as "random." The PRNG + distribution pattern from this lesson covers the vast majority of these cases. For cryptographic randomness (password generation, tokens, nonces) you need `std::random_device` used alone or as a seed source — that is beyond this chapter. For simple reproducible sequences in tests or deterministic simulations, a fixed seed is the right choice.
