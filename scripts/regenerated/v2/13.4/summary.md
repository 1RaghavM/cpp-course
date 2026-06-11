## The idea

An unscoped enumeration stores its values as integers under the hood, which is great for the compiler and terrible for the user. When you print a `Color` variable straight to `std::cout`, you get `0`, `1`, or `2` — not `red`, `green`, or `blue`. The names you wrote so carefully in the source code do not survive to runtime; they are a programmer-only convenience.

To get a human-readable label, you have to translate. The standard library does not know what your enumerators are called, so the translation has to be code you write yourself: a small helper function that takes an enumeration value and returns a string. The reverse direction — turning a user-supplied string into an enumerator — is just as important when you read commands or configuration from input.

Both directions are bridges between the world of enumeration values and the world of text. Building those bridges by hand is a recurring task whenever an enum needs to talk to a human.

## How it works

The standard pattern for enum-to-string is a function that takes the enum by value and returns a `std::string_view`. Using `std::string_view` avoids making a new string each call — the function returns a view into a string literal, which lives in the program's read-only data forever.

```cpp
#include <iostream>
#include <string_view>

enum Color
{
    red,
    green,
    blue,
};

std::string_view colorName(Color c)
{
    switch (c)
    {
        case red:   return "red";
        case green: return "green";
        case blue:  return "blue";
    }
    return "unknown";
}

int main()
{
    Color c { green };
    std::cout << colorName(c) << '\n';
    return 0;
}
```

The `switch` handles every named enumerator with a `case`, and the line after the switch acts as a safety net for out-of-range values (the previous lesson showed that an enum can hold integers outside the named range via `static_cast`). With this in place, `std::cout << colorName(c)` prints `green`.

For the reverse direction — turning a string into an enumeration — the pattern is similar but the input is `std::string_view` and the output is the enum. You can return the enum directly or, more honestly, return a "did the lookup succeed" signal alongside it. A common compromise is to dedicate one enumerator (or a fallback) to mean "not recognized":

```cpp
#include <iostream>
#include <string>
#include <string_view>

enum Color
{
    red,
    green,
    blue,
    unknownColor,
};

Color colorFromName(std::string_view name)
{
    if (name == "red")   return red;
    if (name == "green") return green;
    if (name == "blue")  return blue;
    return unknownColor;
}

int main()
{
    std::string s {};
    std::cin >> s;
    Color c { colorFromName(s) };
    std::cout << c << '\n';
    return 0;
}
```

If the user types `green`, the function returns the enumerator `green` and the program prints `1`. If the user types `purple`, the program prints `3` (the underlying value of `unknownColor`). A real program would usually do something more useful with the unknown case — print a message, ask again, fall back to a default — but the function itself stays simple.

A third common form is to combine both helpers and use them in a small loop:

```cpp
#include <iostream>
#include <string>
#include <string_view>

enum Light
{
    off,
    on,
};

std::string_view lightName(Light l)
{
    switch (l)
    {
        case off: return "off";
        case on:  return "on";
    }
    return "unknown";
}

int main()
{
    Light state { on };
    std::cout << "Currently " << lightName(state) << '\n';
    return 0;
}
```

The pattern scales: every time you add an enumerator, you add one `case` to the function. The compiler does not enforce that you cover every enumerator (it should, but for unscoped enums it is just a warning at best), so a habit of returning a sentinel string from the fallthrough line catches your own omissions.

## Common mistakes

**Returning `std::string` when `std::string_view` would do.** Each call to a `std::string`-returning version allocates and copies. For literal lookup tables this is pure waste. Use `std::string_view` returning a string literal, and you get a zero-allocation, lifetime-safe view. The literal lives in the binary for the program's whole run, so the view never dangles.

**Forgetting a `case` and falling off the end of the function.** If your switch covers every enumerator but the compiler does not know it covers every possible value, it will warn that not every path returns a value — and at runtime, a missed `case` produces undefined behavior unless you add a fallback `return` after the switch. Always add that fallback return.

**Comparing a `std::string_view` against a C-style `char*` without including the right header or using the wrong operator.** With `#include <string_view>` and modern C++, `name == "red"` does the right thing: it compares the character contents. Beginners sometimes write `name == 'r'` (comparing to a single character) or try to use `strcmp`, both of which are wrong here. Stick with `==` and a string literal.

## When to use this

Reach for these helper functions whenever an enumeration value needs to leave the program in human-readable form (printing logs, generating output) or enter it from text (reading user input, parsing a config file). Both helpers are small enough to live next to the enum definition. If you find yourself writing similar lookup functions repeatedly for the same enum, that is a sign your program would benefit from gathering the enum, the to-string helper, and the from-string helper together in a single header — your future readers will thank you. Keep using `std::cout << myEnum` for quick debugging when the integer is good enough; switch to the named version when humans are the audience.
