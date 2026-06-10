## The idea

Every unscoped enumeration is backed by an integer type underneath. When you write `enum Color { red, green, blue };`, the compiler picks an integer type (often `int`) to store the value, and assigns `red = 0`, `green = 1`, `blue = 2`. The names you see in source code are sugar over those integers.

Because the relationship is so direct, C++ lets you cross the boundary between an enumerator and its integer value — but only in certain directions, and only with certain syntax. Going from an enumerator to an integer is so common that the language does it automatically when needed. Going from an integer back to an enumerator is more dangerous (any `int` could be passed, including values that match no enumerator), so the language makes you ask for it explicitly with `static_cast`.

Think of it as the rule at a border crossing. Leaving the enum side for the int side is waved through without a stamp. Coming back the other way requires a passport — and you, the programmer, are taking responsibility for the value being a valid one.

## How it works

An enumerator used in an expression where an integer is expected is converted implicitly. The most common place this matters is `std::cout`, which has overloads for the integer types but not for your custom enum:

```cpp
#include <iostream>

enum Color
{
    red,
    green,
    blue,
};

int main()
{
    Color c { green };
    int n { c };           // implicit: Color -> int (value 1)
    std::cout << c << '\n';
    std::cout << n << '\n';
    return 0;
}
```

Both lines print `1`. The first relies on the implicit conversion to feed `<<` an integer; the second stores the integer in `n` first. Either form is legal for unscoped enums.

Going the other way requires `static_cast`. The compiler will not let you assign a plain integer to an enum variable, even if the integer happens to match an enumerator's value:

```cpp
#include <iostream>

enum Color
{
    red,
    green,
    blue,
};

int main()
{
    int n { 2 };
    Color c { static_cast<Color>(n) };   // explicit conversion
    std::cout << c << '\n';              // prints 2 (== blue)
    return 0;
}
```

`static_cast<Color>(n)` says: "I know `n` is an int; treat it as a `Color`." The compiler does no runtime check that `n` is one of `red`, `green`, or `blue`. If you pass 99, you get a `Color` with an underlying value of 99 — perfectly valid as far as the language is concerned, even though no enumerator has that value. The responsibility is yours.

This pattern shows up most often when reading user input. `std::cin >> someEnum;` does not compile, so the usual workflow is to read an integer and convert:

```cpp
#include <iostream>

enum Difficulty
{
    easy,
    medium,
    hard,
};

int main()
{
    int choice {};
    std::cin >> choice;
    Difficulty d { static_cast<Difficulty>(choice) };
    std::cout << d << '\n';
    return 0;
}
```

If the user types `1`, `d` becomes `medium` and the program prints `1`. If they type `7`, `d` becomes a `Difficulty` with the underlying value 7 — outside the named range. Sanity-checking the integer before the cast (`if (choice >= easy && choice <= hard)`) is a good habit.

## Common mistakes

**Forgetting that the int-to-enum direction needs `static_cast`.** A line like `Color c { 1 };` looks innocent but fails to compile because brace initialization rejects narrowing and unrelated conversions. The fix is to either initialize with an enumerator (`Color c { green };`) or to cast explicitly (`Color c { static_cast<Color>(1) };`).

**Casting blindly without validating the integer.** Because `static_cast<Color>(99)` succeeds, programs that read user input and cast directly can end up with enum variables holding values no one ever named. A later switch over that variable will fall through every case and hit the `default`. The bug is silent: no error, just wrong behavior.

```cpp
int code {};
std::cin >> code;
Color c { static_cast<Color>(code) };  // code might be 9999
switch (c)
{
    case red:   /* ... */ break;
    case green: /* ... */ break;
    case blue:  /* ... */ break;
}
// nothing happens if code is out of range
```

The fix is to check `code` against the known enumerator range before the cast, or to add a `default` branch that handles the surprise explicitly.

**Mixing arithmetic on an enum without thinking about the type.** `red + 1` is legal — `red` converts to `int`, the arithmetic happens as integers, and the result is `int`, not `Color`. Storing that back into a `Color` variable requires another `static_cast`. Beginners often write `Color next { c + 1 };` and are surprised by the compile error; the working form is `Color next { static_cast<Color>(c + 1) };`.

## When to use this

Use the int-to-enum conversion at exactly one place per program: where untrusted data enters the enum world, usually right after `std::cin` or after parsing a string or file. Validate the integer first, then cast. Once the value is inside a properly typed enum variable, keep it there; let the implicit enum-to-int conversion do its work when you actually need an integer (printing, indexing a lookup table, comparing). If you find yourself casting back and forth repeatedly, your code probably wants the value as an `int` to begin with, and the enum is fighting you rather than helping.
