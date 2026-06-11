## The idea

Up to now, every value you have stored has been a number — an `int`, a `double`, a `char`. Text is different. A word like `"hello"` is not a single value; it is a sequence of characters that can grow or shrink, be joined with other text, or have parts of it examined. The C++ standard library provides `std::string` to represent this kind of data: a dynamic, mutable sequence of characters that handles its own memory.

The mental model is a resizable container of characters. You do not need to decide in advance how long the text will be. You do not worry about running out of space. You just declare a `std::string`, assign text to it, and the library handles the rest. When you want two strings joined together, you use `+`. When you want the length, you call `.length()` or `.size()`. Reading from a user follows the same `std::cin >>` pattern you already know, with one important addition: `std::getline` for reading a whole line including spaces.

This lesson covers the basics: creating strings, reading them, measuring them, and concatenating them. These four operations appear in virtually every real C++ program that works with text.

## How it works

**Example 1 — creating and printing a string**

```cpp
#include <iostream>
#include <string>

int main() {
    std::string greeting = "Hello";
    std::string name = "World";
    std::cout << greeting << ", " << name << "!\n";
    return 0;
}
```

You need `#include <string>` to use `std::string`. A string variable is declared and initialized with a string literal in double quotes. You can print it with `std::cout` exactly like a number. This prints `Hello, World!`.

**Example 2 — reading a string and measuring its length**

```cpp
#include <iostream>
#include <string>

int main() {
    std::string word;
    std::cin >> word;
    std::cout << "Length: " << word.length() << "\n";
    return 0;
}
```

`std::cin >> word` reads one word (stops at whitespace). `.length()` returns the number of characters as an unsigned integer. If the user types `"hello"`, the program prints `Length: 5`. Note: `.size()` and `.length()` are identical for `std::string`; both are common.

**Example 3 — concatenation with `+` and reading a full line**

```cpp
#include <iostream>
#include <string>

int main() {
    std::string first;
    std::string last;
    std::cout << "First name: ";
    std::cin >> first;
    std::cout << "Last name: ";
    std::cin >> last;
    std::string full = first + " " + last;
    std::cout << "Full name: " << full << "\n";
    std::cout << "Characters: " << full.length() << "\n";
    return 0;
}
```

The `+` operator joins strings together. `first + " " + last` creates a new string that is the two words with a space between them. Each `+` creates a temporary combined string; the final result is stored in `full`.

**Reading an entire line (including spaces)**

When user input contains spaces, `std::cin >>` stops at the first space. Use `std::getline` to read a whole line:

```cpp
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::cout << "You typed: " << line << "\n";
    return 0;
}
```

`std::getline(std::cin, line)` reads everything up to (but not including) the newline character. If the user types `hello world`, `line` becomes `"hello world"` — the space is preserved.

## Common mistakes

**Mistake 1 — forgetting `#include <string>`**

```cpp
#include <iostream>

int main() {
    std::string name = "Alice";  // compile error: 'string' is not a member of 'std'
    std::cout << name << "\n";
    return 0;
}
```

`std::string` lives in the `<string>` header. Including only `<iostream>` is not enough. The fix is to add `#include <string>` at the top of the file. Some compilers include it transitively through `<iostream>`, but you cannot rely on this — always include it explicitly.

**Mistake 2 — using `std::cin >>` to read text with spaces**

```cpp
#include <iostream>
#include <string>

int main() {
    std::string full_name;
    std::cin >> full_name;   // reads only up to the first space
    std::cout << full_name << "\n";
    return 0;
}
```

If the user types `John Smith`, `full_name` will contain only `"John"`. The word `"Smith"` remains in the input buffer. When the input needs to include spaces, use `std::getline(std::cin, full_name)` instead.

**Mistake 3 — comparing `.length()` with a negative `int`**

`.length()` returns a value of type `size_t`, which is an unsigned integer. Comparing it with a negative `int` can cause surprising results because the negative `int` gets silently converted to a very large unsigned number:

```cpp
#include <iostream>
#include <string>

int main() {
    std::string s = "hi";
    int threshold = -1;
    if (s.length() > threshold) {  // threshold becomes a huge positive number!
        std::cout << "longer\n";
    }
    return 0;
}
```

The condition may be false even though every string's length is greater than -1. The safe approach is to cast `.length()` to `int` when comparing with signed integers: `static_cast<int>(s.length()) > threshold`. You already know `static_cast` from the "Introduction to type conversion" lesson.

## When to use this

Use `std::string` whenever you need to store or manipulate text of variable length: names, messages, words read from input, or any sequence of characters. For fixed, unchanging text that you just need to refer to (like a constant label in your program), the next lesson on `std::string_view` offers a lighter alternative. For a single character, `char` (covered in the chapter on fundamental data types) is sufficient.

The `+` concatenation, `.length()`/`.size()`, `std::cin >>`, and `std::getline` operations covered here handle the vast majority of basic string tasks in introductory programs.
