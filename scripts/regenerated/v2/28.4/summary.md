## The idea

Sometimes you want all the power of stream I/O — formatted extraction, `getline`, manipulators — but you are not reading from the keyboard or a file. You are working with a string. That is what *string streams* are for: they wrap a `std::string` in a stream interface so you can use `>>` to parse a string into typed values, or build a string up piece by piece with `<<`.

The practical payoff is enormous. Parsing a line of text that contains mixed types (a word and two numbers, say) becomes as easy as reading from `std::cin`. Converting a number to a string with a specific format becomes as easy as printing to `std::cout`. No manual `sscanf`, no fragile string-index arithmetic.

## How it works

**`std::ostringstream` — building a string**

Include `<sstream>`. `std::ostringstream` behaves exactly like `std::cout`, but its output accumulates in an internal string. Call `.str()` to retrieve that string.

```cpp
#include <iostream>
#include <sstream>
#include <iomanip>

int main() {
    std::ostringstream oss;
    oss << "Score: " << std::setw(5) << 42;
    std::string result = oss.str();
    std::cout << result << "\n";   // Score:    42
}
```

Every `<iomanip>` manipulator works on `std::ostringstream` because it is also an `std::ostream`.

**`std::istringstream` — parsing a string**

`std::istringstream` wraps an existing string and lets you extract values with `>>` or `std::getline`.

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line = "Alice 30 98.5";
    std::istringstream iss(line);
    std::string name;
    int age;
    double score;
    iss >> name >> age >> score;
    std::cout << name << " aged " << age << " scored " << score << "\n";
    // Alice aged 30 scored 98.5
}
```

**`std::stringstream` — read and write**

`std::stringstream` inherits from both `std::istream` and `std::ostream`. You can write to it and then read back what you wrote. Call `.str("")` and `.clear()` to reset it for reuse.

```cpp
#include <iostream>
#include <sstream>

int main() {
    std::stringstream ss;
    ss << 255;               // write an int
    int n;
    ss >> n;                 // read it back
    std::cout << n << "\n";  // 255
}
```

**Common pattern: convert number to formatted string**

```cpp
#include <sstream>
#include <iomanip>
#include <string>

std::string fmtDouble(double v, int places) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(places) << v;
    return oss.str();
}
```

## Common mistakes

**Mistake 1 — Forgetting to include `<sstream>`**

`std::ostringstream`, `std::istringstream`, and `std::stringstream` live in `<sstream>`, not in `<iostream>`. Including only `<iostream>` causes a compile error.

**Mistake 2 — Calling `.str()` before the writes are done**

```cpp
std::ostringstream oss;
std::string s = oss.str();  // empty — nothing written yet
oss << "hello";
// s is still "" — it was captured before the write
```

Always call `.str()` *after* all writes are complete.

**Mistake 3 — Not resetting a reused `std::stringstream`**

```cpp
std::stringstream ss;
ss << 10;
int a; ss >> a;   // ok, a == 10
ss << 20;         // stream is at EOF; this may silently fail
int b; ss >> b;   // b is not updated
```

After reading to EOF, the stream's `eofbit` is set and further reads fail. To reuse it: call `ss.str("")` to clear the content and `ss.clear()` to clear the error flags. Do both, in that order.

## When to use this

Reach for `std::ostringstream` whenever you need to assemble a formatted string (messages, log lines, display strings for a UI). Reach for `std::istringstream` to parse a line of structured text you already have in a string — for example, splitting `std::getline` output that contains space-separated fields. `std::stringstream` is useful in tests that want to feed fake input to a function that takes an `std::istream&`.
