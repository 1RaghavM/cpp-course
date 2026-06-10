## The idea

When you store a collection of values indexed by an enumeration, the mapping between name and position becomes part of the type system rather than a comment in your head. Picture a scoreboard for a card game: instead of remembering that index 0 is the dealer, index 1 is the left player, and index 2 is the right player, you declare an enum `Player` with those three names and let the array subscript use the enumerator directly. The code reads like English, and the compiler tells you immediately if you try to address a slot that doesn't exist.

This is the core idea behind pairing `std::array` with enumerations: use the enum as the array's natural index so that every access is self-documenting and the array length can be derived from a sentinel enumerator rather than a magic number.

## How it works

The technique depends on one key fact: scoped and unscoped enumerators have underlying integer values starting at 0 by default, which matches exactly how `std::array` is indexed.

**Example 1 — basic pairing**

```cpp
#include <array>
#include <iostream>

enum class Stat { Strength, Dexterity, Constitution, Count };

int main() {
    std::array<int, static_cast<std::size_t>(Stat::Count)> stats{ 10, 14, 12 };
    std::cout << "Dex: " << stats[static_cast<std::size_t>(Stat::Dexterity)] << '\n';
}
```

`Stat::Count` is a sentinel enumerator whose integer value equals the number of real enumerators before it (here, 3). The array is sized with `static_cast<std::size_t>(Stat::Count)` so changing the enum automatically resizes the array. Accessing a slot requires the same cast because scoped enumerators don't convert to integers implicitly.

**Example 2 — using an alias to reduce noise**

Typing `static_cast<std::size_t>` repeatedly is noisy. A helper alias or a small free function cleans it up:

```cpp
#include <array>
#include <iostream>

enum class Direction { North, East, South, West, Count };

constexpr std::size_t idx(Direction d) {
    return static_cast<std::size_t>(d);
}

int main() {
    std::array<const char*, idx(Direction::Count)> labels{
        "North", "East", "South", "West"
    };

    for (std::size_t i = 0; i < idx(Direction::Count); ++i) {
        std::cout << labels[i] << '\n';
    }
}
```

The `idx` helper is a `constexpr` function so it can be used as a template argument. Now every subscript reads as `labels[idx(Direction::North)]`, which is far easier to follow than `labels[0]`.

**Example 3 — unscoped enumerations skip the cast**

If you use a plain (unscoped) enum, the implicit conversion to `int` means you can subscript directly—but you also lose the scoping protection:

```cpp
#include <array>
#include <iostream>

enum Color { Red, Green, Blue, NumColors };

int main() {
    std::array<const char*, NumColors> names{ "Red", "Green", "Blue" };
    Color picked = Green;
    std::cout << names[picked] << '\n';  // implicit conversion, no cast needed
}
```

This is shorter, but `picked` can be implicitly converted to an `int` and used in arithmetic, which is often a trap with unscoped enums (covered in the introduction to enumerations lesson). Scoped enums are safer at the cost of requiring the cast.

## Common mistakes

**Mistake 1 — forgetting the sentinel enumerator**

A common pattern is to size the array with a literal instead of a sentinel:

```cpp
enum class Season { Spring, Summer, Autumn, Winter };

// ---- wrong ----
std::array<int, 4> temps;  // magic number 4; breaks silently when enum grows
```

If you later add `Monsoon` to `Season`, you must also remember to change the array size. With a sentinel `Season::Count` as the last enumerator the array template argument updates automatically when you add enumerators before it.

**Mistake 2 — subscribing with the wrong type without casting**

With scoped enums, using the enumerator directly as a subscript is a compile error:

```cpp
enum class Slot { A, B, C, Count };
std::array<int, static_cast<std::size_t>(Slot::Count)> data{};

// ---- wrong ----
data[Slot::B] = 7;  // error: no implicit conversion from Slot to std::size_t
```

You must write `data[static_cast<std::size_t>(Slot::B)]` or use the `idx()` helper pattern. Forgetting this is the single most common compile error when first using this idiom.

**Mistake 3 — placing the sentinel in the middle**

The sentinel must be the last enumerator, with no explicit value assignments that would break the consecutive-integer guarantee:

```cpp
// ---- wrong ----
enum class Tier { Bronze = 1, Silver = 3, Gold = 5, Count };
// Count is 6, not 3; array has 6 slots but only 3 are meaningful
```

Only use the default sequential values (or assign them starting from 0 consecutively) when relying on the sentinel pattern. If you need non-sequential values, the sentinel trick does not apply.

## When to use this

Use this pattern whenever you have a fixed, named set of categories that map onto an array. Typical examples include per-player stats in a game, per-day totals in a weekly report, per-direction neighbor checks in a grid, and per-channel values in a color type. It pairs particularly well with the `std::array` of class types technique from the previous lesson: you can store an array of structs indexed by an enum, combining named structure with named indexing.

Avoid the pattern when the enumeration values are not meant to be contiguous and zero-based (for example, HTTP status codes or bitmask flags), or when the set grows at runtime—for those cases, look to `std::vector` (covered in chapter 16) keyed by a runtime integer instead.
