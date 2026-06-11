## The idea

A `char` stores a single character: a letter, a digit, a punctuation mark, or any other symbol that can be represented in text. Underneath, `char` is just a small integer — it stores the numeric *code* of the character, not the character itself. On virtually every system you will use, those codes follow the ASCII standard: the letter `'A'` is 65, `'a'` is 97, `'0'` is 48, a space is 32, and so on.

Think of `char` as a postbox number that also has a name tag. The box holds a number (say, 65), but C++ knows to display it as the character `'A'` when you print it. The number and the name tag are both real; you just choose which face to show.

Why have a dedicated type instead of just using `int`? Because `char` makes your intent clear: "this variable represents a single printable symbol, not a measurement or a count." It also takes only 1 byte of storage, which matters when you work with large bodies of text.

## How it works

**Declaring and printing a char**

```cpp
#include <iostream>

int main()
{
    char grade { 'B' };     // single quotes for char literals
    char newline { '\n' };  // escape sequence — also a char

    std::cout << grade << '\n';   // prints B
    std::cout << "Code: " << static_cast<int>(grade) << '\n';  // prints Code: 66
    return 0;
}
```

Always use single quotes for `char` literals. Double quotes create a string literal, which has a different type. `'B'` is a `char`; `"B"` is a C-string (array of chars ending in `\0`).

**Escape sequences**

Some characters cannot be typed literally because they have special meaning or are invisible. C++ uses a backslash prefix to represent them:

- `'\n'` — newline
- `'\t'` — horizontal tab
- `'\''` — single quote (would otherwise close the literal)
- `'\\'` — backslash itself
- `'\0'` — the null character (value 0, used as a string terminator)

**Char arithmetic — using the underlying integer**

Because `char` is an integer type, you can do arithmetic on it. Adding or subtracting integers shifts the character up or down the ASCII table:

```cpp
#include <iostream>

int main()
{
    char letter { 'a' };
    char upper  { static_cast<char>(letter - 32) };  // 'a' - 32 = 'A'

    std::cout << letter << " -> " << upper << '\n';   // a -> A
    std::cout << static_cast<int>('z') << '\n';       // 122
    return 0;
}
```

`static_cast<char>(...)` is used here to explicitly convert the integer result back to `char`. Relying on implicit narrowing from `int` to `char` in an assignment is legal but generates warnings with `-Wnarrowing`. Always be explicit when char arithmetic might overflow the 0–127 ASCII range.

**Reading a char from input**

`std::cin >> ch` reads one non-whitespace character and stores it in `ch`. Whitespace (spaces, tabs, newlines) is skipped automatically. If you need to read whitespace characters too, use `std::cin.get(ch)` — but that is an advanced topic. For now, assume all input characters are non-whitespace.

```cpp
#include <iostream>

int main()
{
    char ch {};
    std::cin >> ch;
    std::cout << "You entered: " << ch << '\n';
    std::cout << "ASCII value: " << static_cast<int>(ch) << '\n';
    return 0;
}
```

**Comparing chars**

Since `char` is an integer, comparisons work exactly as you'd expect from integer arithmetic. `'a' < 'z'` is true (97 < 122). `'A' < 'a'` is also true (65 < 97). This makes range checks straightforward:

```cpp
char c { 'g' };
bool isLower { c >= 'a' && c <= 'z' };  // true
bool isDigit { c >= '0' && c <= '9' };  // false
```

## Common mistakes

**Mistake 1: Using double quotes instead of single quotes**

```cpp
char grade { "B" };   // ERROR: "B" is a string literal (char array), not a char
char grade { 'B' };   // correct
```

The compiler will reject the first line with something like "cannot convert 'const char*' to 'char'". Always use single quotes for individual characters.

**Mistake 2: Forgetting that std::cin >> skips whitespace**

```cpp
char ch {};
std::cin >> ch;  // if stdin is "  X", ch will be 'X', not ' '
```

`operator>>` with `char` skips leading whitespace. If your test case sends a space character, it will be ignored and the next non-whitespace character is read instead. This bites people writing programs that need to detect spaces. Use `std::cin.get(ch)` for that (not taught yet — just know the limitation).

**Mistake 3: Printing a char cast to int without static_cast**

```cpp
char c { 'A' };
std::cout << (int)c;    // works but uses C-style cast — not preferred
std::cout << static_cast<int>(c);  // preferred C++ style
```

Without a cast, `std::cout << c` always prints the character symbol. With `static_cast<int>(c)`, it prints the ASCII number. Forgetting the cast when you want the number is a common oversight.

## When to use this

Use `char` when your program deals with individual characters: reading a single-letter command from the user, encoding a grade (A/B/C/D/F), checking whether input is a digit or a letter, or doing simple cipher shifts. For sequences of characters (words, sentences), C++ uses C-style strings or `std::string` — you will meet those shortly.

`char` connects naturally to the integer types you already know, via `static_cast`. The conversion from `char` to `int` and back is the foundation for many string-processing algorithms, which is one reason understanding the ASCII relationship matters even before you work with full strings.
