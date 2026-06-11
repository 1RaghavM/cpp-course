## The idea

Reading data from `std::cin` seems straightforward — type something, press Enter, done. But `std::istream` (the class that `std::cin` is an instance of) has a rich set of member functions and manipulators that control *how* that data is extracted. Understanding them prevents two common frustrations: input that silently stalls the program, and leftover characters in the input buffer that corrupt subsequent reads.

The core mental model is that `std::cin` maintains a *buffer*. When you press Enter, all the characters you typed (including the newline `'\n'`) land in that buffer. Extraction operators and member functions then consume bytes from the front of that buffer one by one. Any bytes not consumed stay there and affect the next read.

## How it works

**Formatted extraction with `>>`**

The `>>` operator skips leading whitespace (spaces, tabs, newlines) and then reads characters that match the expected type. For `int`, it reads digits until it hits a non-digit. For `std::string`, it reads until the next whitespace character.

```cpp
#include <iostream>
#include <string>

int main() {
    int age;
    std::string name;
    std::cin >> name >> age;           // chain extraction
    std::cout << name << " is " << age << "\n";
}
```

Input `Alice 30` produces `Alice is 30`. The `>>` between `name` and `age` works because `>>` returns a reference to the stream, enabling chaining.

**Reading whole lines with `std::getline`**

`>>` stops at whitespace, which means it cannot read a phrase like `John Smith` into a single `std::string`. `std::getline(stream, str)` reads characters until (and discards) the next `'\n'`, putting everything before it into `str`.

```cpp
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::cout << "Got: " << line << "\n";
}
```

Input `John Smith` → output `Got: John Smith`.

**The getline-after->> trap**

If you mix `>>` and `std::getline`, the newline left in the buffer after `>>` causes `std::getline` to return an empty string immediately. The fix is to call `std::cin.ignore()` (or `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n')`) to discard the leftover newline before calling `getline`.

```cpp
#include <iostream>
#include <string>
#include <limits>

int main() {
    int n;
    std::cin >> n;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); // discard '\n'
    std::string rest;
    std::getline(std::cin, rest);
    std::cout << n << " | " << rest << "\n";
}
```

Input `5\nHello World` → output `5 | Hello World`.

**`get` and `peek`**

`std::cin.get()` reads exactly one character, including whitespace. `std::cin.peek()` returns the next character without removing it from the buffer, useful when you need to look ahead before deciding how to parse.

## Common mistakes

**Mistake 1 — Not discarding the newline between `>>` and `getline`**

```cpp
int n;
std::cin >> n;
std::string line;
std::getline(std::cin, line); // line is "" — the '\n' was consumed immediately
```

The `>>` leaves `'\n'` in the buffer. `std::getline` sees it, treats it as the end-of-line, and returns an empty string. Always call `std::cin.ignore()` after using `>>` when you intend to follow up with `std::getline`.

**Mistake 2 — Assuming `>>` reads an entire line into a string**

```cpp
std::string full_name;
std::cin >> full_name;  // reads only the first word
```

If the user types `Jane Doe`, `full_name` is `"Jane"` and `"Doe"` stays in the buffer. Use `std::getline` when the input can contain spaces.

**Mistake 3 — Ignoring stream failure**

If `>>` fails (e.g. the user types `abc` when an `int` is expected), the stream enters a *fail state*, subsequent reads silently do nothing, and the variable retains its prior value (which is garbage if uninitialized). Always check the stream state or clear and re-prompt after a failed extraction. Stream states are covered in detail in the "Stream states and input validation" lesson.

## When to use this

Use `>>` when your input is whitespace-delimited tokens (numbers, single words). Use `std::getline` when you need whole lines, including spaces. Mix them carefully and always `ignore()` the newline between a `>>` read and a `getline`. Use `std::cin.get()` when you need character-by-character control — for instance, parsing a CSV field that might contain spaces. The `std::istream` interface is the same whether the underlying source is `std::cin`, a file stream, or a string stream, so every technique you learn here transfers directly to those contexts.
