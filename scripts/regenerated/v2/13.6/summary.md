## The idea

Unscoped enumerations are convenient but have a flaw: their enumerators live in the same namespace as the enum itself. That means two enums that both have a value named `red` will collide, and you cannot define both in the same scope. On top of that, unscoped enums quietly convert to integers without you asking, which can lead to accidental comparisons between unrelated enum types or unintended function overload resolution.

A scoped enumeration — written `enum class` — fixes both problems at once. Every enumerator is hidden inside the enum's own name, and no automatic conversion to integers happens unless you ask for it with `static_cast`. Think of it like a locked box: you can still get at the values, but you have to say which box you are opening and you have to be explicit when you want the raw number inside.

Scoped enums were introduced in C++11 and are now the recommended default for all new enumerations. The unscoped form still exists for backward compatibility, but `enum class` is what you should reach for first.

## How it works

The syntax is nearly the same as an unscoped enum, with `class` added after `enum`:

```cpp
#include <iostream>

enum class Color { red, green, blue };

int main()
{
    Color c{ Color::green };            // must prefix with Color::
    // std::cout << c;                  // compile error: no implicit conversion
    std::cout << static_cast<int>(c) << '\n';   // prints: 1
    return 0;
}
```

Two scoped enums can share enumerator names without any conflict, because each name is fully qualified by its enclosing enum:

```cpp
#include <iostream>

enum class TrafficLight { red, yellow, green };
enum class AppleVariety { red, golden, granny };

int main()
{
    TrafficLight light{ TrafficLight::red };
    AppleVariety apple{ AppleVariety::red };
    // No collision — red belongs to each enum separately.
    // light == apple won't compile either — different types entirely.
    return 0;
}
```

To print the name of a scoped enum, you overload `operator<<` exactly as in lesson 13.5, but the case labels use the fully qualified `EnumName::value` form:

```cpp
#include <iostream>

enum class Direction { north, south, east, west };

std::ostream& operator<<(std::ostream& out, Direction d)
{
    switch (d)
    {
        case Direction::north: out << "north"; break;
        case Direction::south: out << "south"; break;
        case Direction::east:  out << "east";  break;
        case Direction::west:  out << "west";  break;
    }
    return out;
}

int main()
{
    Direction d{ Direction::east };
    std::cout << d << '\n';   // prints: east
    return 0;
}
```

Because there is no implicit conversion to integer, you must use `static_cast<int>` when you genuinely need the numeric value. Conversely, you can assign a specific underlying value to an enumerator the same way as with unscoped enums:

```cpp
enum class HttpStatus { ok = 200, notFound = 404, serverError = 500 };

HttpStatus s{ HttpStatus::notFound };
int code{ static_cast<int>(s) };   // code == 404
```

This makes `enum class` useful for wrapping protocol constants, error codes, or anything else where the integer value is meaningful but you still want type-safe comparisons.

## Common mistakes

**Using an unscoped-style name without the prefix.**

```cpp
enum class Suit { clubs, diamonds, hearts, spades };

int main()
{
    Suit s{ clubs };   // BUG: 'clubs' is not in scope
    return 0;
}
```

The error says something like `'clubs' was not declared in this scope`. Fix: `Suit s{ Suit::clubs };`. With unscoped enums the prefix is optional; with `enum class` it is mandatory.

**Comparing a scoped enum to an integer literal directly.**

```cpp
enum class Level { beginner, intermediate, advanced };

int main()
{
    Level lv{ Level::intermediate };
    if (lv == 1)   // BUG: no implicit conversion; won't compile
        return 0;
    return 0;
}
```

The compiler refuses the comparison because `lv` is a `Level` and `1` is an `int` — they are different types and the compiler will not silently convert between them. If you genuinely need to compare against an integer, write `static_cast<int>(lv) == 1`. More often the right fix is to compare against `Level::intermediate` directly, which is both safer and self-documenting.

**Forgetting the `class` keyword and losing all the benefits.**

It is easy to write `enum Color { ... }` by habit when you meant `enum class Color { ... }`. The code will compile, but you lose name scoping and the protection against implicit conversions. If you notice that two enums share an enumerator name and the compiler isn't complaining, check whether you accidentally wrote a plain `enum`.

## When to use this

Prefer `enum class` over plain `enum` for any new enumeration you write. The stricter rules catch real bugs — particularly accidental integer comparisons and name collisions when two enums share popular names like `none`, `error`, or `default`. If you need a human-readable string representation, combine `enum class` with an `operator<<` overload exactly as shown in lesson 13.5: the overload looks identical, you just qualify the case labels. For the rare cases where implicit integer conversion is necessary (such as array indexing or protocol code comparisons), use `static_cast<int>` explicitly so the intent is always visible in the code.
