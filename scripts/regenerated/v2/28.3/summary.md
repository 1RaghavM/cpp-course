## The idea

When you write `std::cout << 3.14159`, the runtime decides how many decimal places to show, whether to use scientific notation, and how wide the field should be. None of that is accidental — `std::ostream` carries a *format state*: a collection of flags, a field width, a fill character, and a precision value. Manipulators and member-function calls change that state, so every subsequent output obeys the new rules until you change them again (or the program ends).

Think of the format state as a settings panel attached to the stream. When you call `std::setprecision(4)`, you are turning a dial. Every floating-point value printed after that uses four significant digits. This is different from a one-time instruction — the dial stays at 4 until you move it again.

## How it works

**Precision and floating-point formats**

`std::setprecision(n)` sets how many digits appear. Its effect depends on whether a floating-point format flag is active:

- Default (no flag): `n` significant digits total.
- `std::fixed`: `n` digits after the decimal point.
- `std::scientific`: `n` digits after the decimal point, exponent notation.

```cpp
#include <iostream>
#include <iomanip>

int main() {
    double pi = 3.14159265;
    std::cout << pi << "\n";                              // 3.14159 (default, 6 sig digits)
    std::cout << std::fixed << std::setprecision(2) << pi << "\n";     // 3.14
    std::cout << std::scientific << std::setprecision(3) << pi << "\n"; // 3.142e+00
}
```

Always include `<iomanip>` when using `std::setprecision`, `std::setw`, or `std::setfill`.

**Field width with `std::setw`**

`std::setw(n)` sets the minimum width for the *next* output operation only. If the value is narrower than `n`, the stream pads with the fill character (default space) on the left. Unlike precision, `setw` resets to 0 after each use.

```cpp
#include <iostream>
#include <iomanip>

int main() {
    for (int i : {1, 10, 100}) {
        std::cout << std::setw(6) << i << "\n";
    }
}
```

Output (each number right-aligned in a 6-wide field):
```
     1
    10
   100
```

**Fill character and alignment**

`std::setfill('0')` changes the padding character. `std::left` / `std::right` / `std::internal` control alignment and persist until changed.

```cpp
#include <iostream>
#include <iomanip>

int main() {
    std::cout << std::setfill('0') << std::setw(5) << 42 << "\n"; // 00042
    std::cout << std::left << std::setfill(' ') << std::setw(8) << "hi" << "|\n"; // "hi      |"
}
```

**Integer bases**

`std::hex`, `std::oct`, and `std::dec` change the base for integer output and are *sticky* (persist). `std::showbase` adds `0x`/`0` prefixes.

```cpp
#include <iostream>

int main() {
    int n = 255;
    std::cout << std::hex << n << "\n";           // ff
    std::cout << std::showbase << std::hex << n << "\n"; // 0xff
    std::cout << std::oct << n << "\n";           // 0377
    std::cout << std::dec << n << "\n";           // 255  (restore)
}
```

## Common mistakes

**Mistake 1 — Forgetting that `setw` is not sticky**

```cpp
std::cout << std::setw(6) << 1 << 2 << "\n";  // output: "     12"
```

Only `1` gets the width of 6. `2` is printed without padding because `setw` resets after each item. You must call `std::setw` before every value that needs padding.

**Mistake 2 — Not restoring the base after `std::hex`**

```cpp
std::cout << std::hex << 255 << "\n";  // ff
std::cout << 255 << "\n";              // ff again — hex is still active!
```

`std::hex` is sticky. If you print decimal numbers later, write `std::dec` first to restore the base.

**Mistake 3 — Missing `<iomanip>`**

```cpp
std::cout << std::setprecision(2) << 3.14;  // compile error: 'setprecision' not declared
```

`std::setw`, `std::setprecision`, `std::setfill`, and `std::fixed` all require `#include <iomanip>`. The bare `std::hex`, `std::left`, `std::right`, and `std::endl` are defined in `<iostream>` itself, but anything with `set` in the name lives in `<iomanip>`.

## When to use this

Use `std::fixed` with `std::setprecision` whenever you print currency, measurements, or any value that should show a consistent number of decimal places. Use `std::setw` to build tables with aligned columns — it is far simpler than computing padding manually. Use `std::hex` when printing addresses, bitmasks, or colour values. For more complex formatting (e.g. mixing types in a format string), `std::format` from `<format>` (C++20) is often cleaner, but the `<iomanip>` tools are available everywhere and are still the right choice when you need persistent format state across many output operations.
