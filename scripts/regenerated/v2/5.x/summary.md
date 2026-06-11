## The idea

Chapter 5 is about two overarching ideas: **write values that cannot change** and **name your text without copying it**. Before this chapter, every variable you wrote was mutable and every string came with an implicit heap allocation. Now you have tools to lock values at compile time and to read strings efficiently. Those tools sit at the heart of almost every real C++ program.

The unifying theme: when something does not need to change, say so explicitly. The compiler rewards you with better error detection, faster builds, and — for `constexpr` values — computation that is entirely free at runtime.

## How it works

**Constants — three kinds**

You learned three ways to make a value constant:

- `const` — the value is fixed after initialization; initializer can be a runtime expression.
- `constexpr` — the value must be computable at compile time; the compiler evaluates it during translation.
- Literal suffixes — `42u`, `3.14f`, `0b1010` — embedded constants with a precise type baked in.

```cpp
const int maxRetries{ 5 };          // runtime const: fixed, but could be read from config
constexpr double pi{ 3.14159265 };  // compile-time: evaluated before the program runs
int flags{ 0b1010 };                // binary literal: clearer than plain 10
```

`constexpr` is the stronger guarantee. Use it whenever the value is genuinely a mathematical fact or a design constant (buffer size, conversion factor, maximum count). Use `const` when the value is only known at runtime (e.g. read from user input) but must not change afterward.

**Numeral systems**

Binary (`0b`), octal (`0`), and hexadecimal (`0x`) literals give you the same integer in different bases:

```cpp
int a{ 255 };    // decimal
int b{ 0xFF };   // hex     — all three are the same value
int c{ 0377 };   // octal
```

Hex is widely used for bit masks and memory addresses. Binary is clearer for individual bit patterns. Digit separators (`'`) let you group digits without changing the value: `0b1111'0000` is identical to `0b11110000`.

**Compile-time optimization and constant expressions**

The "as-if" rule gives the compiler latitude to rewrite your program as long as observable output is unchanged. A constant expression goes further: its value is locked at compile time. Functions declared `constexpr` can be evaluated during compilation when called with compile-time arguments.

**std::string — owned text**

`std::string` stores its characters on the heap and manages that memory for you. It supports concatenation (`+`), comparison (`==`, `<`), length queries (`.length()`), and safe modification. The cost is a heap allocation on construction.

```cpp
std::string greeting{ "Hello" };
greeting += ", world";
std::cout << greeting.length() << '\n';  // 12
```

Prefer `std::string` when you need to own, build, or modify text — filenames constructed from parts, user names read from input, messages assembled at runtime.

**std::string_view — borrowed text**

`std::string_view` holds a pointer and a length. It never allocates. You use it to read a string you do not own.

```cpp
void printUpper(std::string_view sv) {
    std::cout << sv.length() << ": " << sv << '\n';
}
printUpper("literal");          // no allocation
std::string s{ "owned" };
printUpper(s);                  // no copy
```

`remove_prefix` / `remove_suffix` let you narrow the view. `starts_with` / `ends_with` let you classify it cheaply.

## Common mistakes

**1. Forgetting that `const` and `constexpr` are different guarantees**

```cpp
int n{};
std::cin >> n;
const int x{ n };       // fine — runtime const; known only after cin
constexpr int y{ n };   // ERROR: n is not a constant expression
```

`constexpr` requires a value the compiler can fully evaluate during translation. A variable read from `cin` is only known at runtime, so it cannot be `constexpr`. The compiler will reject the second line with a clear error.

**2. Keeping a string_view alive after its source is modified or destroyed**

```cpp
std::string s{ "hello" };
std::string_view sv{ s };
s += " world";   // may reallocate s — sv now dangles
std::cout << sv; // undefined behavior
```

The golden rule: if you create a `string_view` from a `std::string`, do not mutate that string afterward (and make sure it outlives the view). For long-lived read-only views of literals, this is never a problem — string literals live for the entire program.

**3. Integer overflow from unsuffixed decimal literals**

```cpp
long long big{ 4000000000 };   // WARNING or error: 4000000000 exceeds int range
long long fine{ 4000000000LL }; // correct: suffix tells the compiler it is long long
```

Without the `LL` suffix, the literal is parsed as `int`, overflows, and the resulting value is undefined. Always add the correct suffix for large or typed literals.

## When to use this

Reach for `const` any time a variable should not change after it is set — loop bounds, calibration parameters, results from a one-time computation. Escalate to `constexpr` when the value is a compile-time fact. Use literal suffixes to communicate the intended type of embedded numbers clearly.

Use `std::string` for text you own or need to build. Use `std::string_view` for every function parameter that only reads a string — it handles literals, `std::string`, and substrings with a single overload and zero allocation. When in doubt: if the function modifies the string, take `std::string`; if it only reads, take `std::string_view`.
