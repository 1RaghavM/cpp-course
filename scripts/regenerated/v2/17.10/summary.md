## The idea

Before `std::string` existed, text in C and early C++ was represented as an array of characters with a special terminator: the null character `'\0'` (ASCII value 0) placed immediately after the last meaningful character. This is a C-style string. The rule is simple: start reading characters from the beginning of the array and stop when you hit a `'\0'`. Everything that processes C-style strings—from `std::cout` to standard library functions—follows this convention.

Think of it as a length signal embedded in the data itself: instead of remembering "this array has 5 meaningful characters", you let a sentinel character do that job. The array must be long enough to hold all the characters plus the terminator.

Understanding C-style strings matters because string literals in C++ are C-style strings, most C APIs pass text this way, and many lower-level functions in `<cstring>` operate on them. `std::string` (introduced in chapter 5) is built on top of this representation and hides the complexity, but the underlying mechanism appears the moment you work with raw character arrays.

## How it works

**Example 1 — string literals are C-style strings**

```cpp
#include <iostream>

int main() {
    const char greeting[]{ "Hello" };
    // Stored as: { 'H', 'e', 'l', 'l', 'o', '\0' } — 6 chars total
    std::cout << greeting << '\n';
    std::cout << sizeof(greeting) << '\n'; // 6 (5 letters + null terminator)
}
```

When you initialize a `char` array from a string literal, the compiler appends the null terminator automatically and sizes the array to include it. `sizeof(greeting)` is 6, not 5—the `'\0'` occupies a slot. Passing `greeting` to `std::cout` works because the stream reads characters until it sees `'\0'`.

**Example 2 — reading and printing a word**

```cpp
#include <iostream>

int main() {
    char word[20]{};     // zero-initialized: all '\0' to start
    std::cin >> word;    // reads until whitespace, appends '\0' automatically
    std::cout << word << '\n';
}
```

`std::cin >> word` stops at the first whitespace and writes a `'\0'` after the last character it copied, so `word` is a valid C-style string afterwards. The array must be large enough for the input plus the terminator; if not, `std::cin` writes past the end (buffer overflow). Always size the buffer with a generous margin.

**Example 3 — walking a C-style string with a pointer**

```cpp
#include <iostream>

int main() {
    const char text[]{ "cppr" };
    int count = 0;
    for (const char* p = text; *p != '\0'; ++p) {
        ++count;
    }
    std::cout << "Length: " << count << '\n'; // 4
}
```

Iterating until `*p != '\0'` is the canonical way to process a C-style string without knowing its length in advance. Adding `'\0'` to the loop condition is equivalent to `*p` because `'\0'` is the only character with value 0, which is falsy—so `while (*p)` and `while (*p != '\0')` are identical.

## Common mistakes

**Mistake 1 — forgetting space for the null terminator**

```cpp
// ---- wrong ----
char name[5]{ "Hello" }; // "Hello" needs 6 bytes; compile error or truncation
```

"Hello" is five letters plus a `'\0'`, requiring 6 `char` slots. Declaring `char name[5]` is either a compile error or (in some edge cases) silently truncates the string, producing a non-terminated buffer. Always allocate at least `length + 1`.

**Mistake 2 — comparing C-style strings with ==**

```cpp
char a[]{ "cat" };
char b[]{ "cat" };

// ---- wrong ----
if (a == b) {  // comparing pointers, not characters — always false
    std::cout << "same\n";
}
```

`a` and `b` decay to pointers to different memory locations. `a == b` compares addresses, not content. To compare the text, use `std::strcmp` from `<cstring>` which returns 0 when the strings are identical, or convert to `std::string` and use `==` on those.

**Mistake 3 — printing an uninitialized or non-terminated char array**

```cpp
char buf[10];
buf[0] = 'H'; buf[1] = 'i';
// ---- wrong: missing null terminator ----
std::cout << buf; // reads past 'i' until it finds a '\0' somewhere in memory
```

Without writing `buf[2] = '\0'`, `std::cout` keeps reading past the end of the initialized region, printing whatever garbage bytes follow until it stumbles on a zero byte. Always explicitly set or zero-initialize the terminator.

## When to use this

C-style strings appear in three main contexts: string literals (which are always `const char*`), parameters of C standard-library functions (`std::strlen`, `std::strcmp`, `std::strcpy` from `<cstring>`), and interfaces with external C APIs. For any text you control in new C++ code, use `std::string`—it manages the buffer, the terminator, and the length automatically. Reach for C-style string techniques when the API forces a `char*` or `const char*`, when working with string literals directly, or when walking a string character-by-character using the pointer techniques covered in the previous lesson.
