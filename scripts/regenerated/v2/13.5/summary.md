## The idea

Imagine you have a custom type — say, a color represented as an enum — and you want to print it like any other value: just drop it into a `std::cout` chain. By default, C++ doesn't know how to do that for your enum. It can print numbers, strings, and a handful of built-in types, but your `Color::Red` gets printed as `2` (its underlying integer), not the word "Red".

Operator overloading lets you teach the standard I/O machinery how to handle your type. You write a function that runs whenever `<<` or `>>` is used with your type, and from then on it works exactly like printing a number or a string. The goal of this lesson is to overload `operator<<` (for output) and `operator>>` (for input) for unscoped enumerations.

## How it works

The `<<` operator for `std::cout` is already a function — it just uses special syntax. The call `std::cout << 42` is really `operator<<(std::cout, 42)`. To handle your own type, you write a new overload with your type as the second parameter.

The return type must be `std::ostream&` so that chaining works (`std::cout << a << b` requires each `<<` to return the stream):

```cpp
#include <iostream>

enum Color { red, green, blue };

std::ostream& operator<<(std::ostream& out, Color c)
{
    switch (c)
    {
        case red:   out << "red";   break;
        case green: out << "green"; break;
        case blue:  out << "blue";  break;
    }
    return out;  // always return out
}

int main()
{
    Color sky{ blue };
    std::cout << "The sky is " << sky << '\n';  // prints: The sky is blue
    return 0;
}
```

Notice that `out` is passed by (non-const) reference because writing to a stream modifies it. Also notice that we return `out` at the end — this is what allows `<<` to chain.

For input, the pattern is the same shape but uses `std::istream&` as the first parameter and second parameter by non-const reference (so you can modify the variable being read into):

```cpp
#include <iostream>
#include <string>

enum Direction { north, south, east, west };

std::istream& operator>>(std::istream& in, Direction& d)
{
    std::string token;
    in >> token;
    if (token == "north") d = north;
    else if (token == "south") d = south;
    else if (token == "east")  d = east;
    else                       d = west;
    return in;
}
```

The second parameter is `Direction&` (not `const Direction&`) because the whole point is to store a value into it. Returning `in` lets you chain input operations the same way output chains.

Here is a more complete example tying both together:

```cpp
#include <iostream>
#include <string>

enum Suit { clubs, diamonds, hearts, spades };

std::ostream& operator<<(std::ostream& out, Suit s)
{
    switch (s)
    {
        case clubs:    out << "clubs";    break;
        case diamonds: out << "diamonds"; break;
        case hearts:   out << "hearts";   break;
        case spades:   out << "spades";   break;
    }
    return out;
}

int main()
{
    Suit card{ hearts };
    std::cout << card << '\n';  // prints: hearts
    return 0;
}
```

## Common mistakes

**Forgetting to return `out`.**

```cpp
std::ostream& operator<<(std::ostream& out, Color c)
{
    switch (c)
    {
        case red: out << "red"; break;
    }
    // BUG: forgot return out;
}
```

The function is declared to return `std::ostream&` but falls off the end without returning anything. Some compilers warn, some produce undefined behavior at runtime. The fix is always `return out;` as the last statement.

**Forgetting the `&` on the enum parameter in `operator>>`.**

```cpp
std::istream& operator>>(std::istream& in, Direction d)  // BUG: d is a copy
{
    std::string token;
    in >> token;
    if (token == "north") d = north;
    return in;
}
```

Here `d` is a copy of whatever was passed in, so the assignment `d = north` modifies the copy and the caller's variable is left unchanged. The parameter must be `Direction& d` so the function can write back to the original.

**Casting the enum to int for comparison instead of using it directly.**

Some beginners write `if (static_cast<int>(c) == 0) out << "red";` — this works but is brittle. If you reorder enum values the numbers change and the comparisons break. Using `case red:` directly names what you mean and is resilient to reordering.

## When to use this

Overload `operator<<` any time you have a type (like an unscoped enum from lesson 13.2 or 13.3) that you need to display in human-readable form. It cleans up `main` significantly compared to writing a standalone `printColor(c)` function, because it composes naturally with everything that accepts `std::ostream&` — including `std::cerr` and file streams. Overload `operator>>` when you need to read the type back from text input, often paired with the corresponding `<<` overload so the round-trip is consistent.
