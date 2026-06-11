## The idea

Chapter 13 was about giving your program a vocabulary of its own. The fundamental types — `int`, `double`, `bool`, `char` — are universal but generic. They let you store values, but they cannot express what those values *mean*. A traffic light is not just an `int`. A 3D point is not just three loose `double`s. A pair of strings is not just two `std::string`s sitting next to each other in source code.

The chapter introduced two ways to build types of your own. Enumerations name a fixed set of states, replacing magic numbers with words the compiler understands. Structs bundle related values into a single object that can be passed, returned, and copied as one unit. Together, enums and structs are the foundation on which every higher-level abstraction in C++ rests, all the way up to the standard library's containers and your own application classes.

The chapter closed with a small generic-programming toolkit — class templates, CTAD, and alias templates — that lets one struct definition serve many concrete types. The thread running through every section is the same: shift work from the programmer's head into the type system so the compiler can catch mistakes that comments cannot.

## How it works

The enum side of the chapter built up in layers. Unscoped enums name a list of related values:

```cpp
enum Color { red, green, blue };
Color c{ red };
```

Scoped enums (also called `enum class`) restrict the names to the enum's own scope and refuse to convert silently to integers:

```cpp
enum class Status { ok, warn, error };
Status s{ Status::ok };
```

You can convert back and forth with `static_cast`, and you can overload `operator<<` so a scoped enum prints a meaningful word instead of a number.

The struct side covered aggregate initialization in two flavours. Positional braces fill members in declaration order; designated initializers name each member explicitly:

```cpp
struct Point { int x; int y; };
Point a{ 3, 4 };
Point b{ .x = 3, .y = 4 };
```

Default member initializers let you mark sensible starting values, and any member you skip in the brace list takes its default. Passing a struct by const reference avoids the copy:

```cpp
void print(const Point& p) { std::cout << p.x << ',' << p.y; }
```

And you can return whole structs, which is the cleanest way for a function to deliver more than one result.

Templates were the final layer. A class template captures a struct shape and lets the type vary:

```cpp
template <typename T> struct Pair { T first; T second; };
Pair<int> p{ 1, 2 };
```

CTAD lets the compiler deduce the type from the initializer (`Pair p{ 1, 2 };` is the same as `Pair<int> p{ 1, 2 };`), and an alias template gives a long instantiation a shorter name:

```cpp
template <typename T> using SamePair = Pair<T>;
```

These three pieces — class template, CTAD, alias template — are how the standard library presents types like `std::pair` and how you will define your own reusable shapes.

## Common mistakes

The chapter introduced four traps that keep coming back. The first is forgetting the semicolon after a type definition. `struct Point { int x; int y; }` without the closing `;` makes the compiler complain about whatever line comes next, never about the line that is actually wrong.

The second is silently copying a struct when you meant to refer to it. A function parameter declared `Point p` makes a fresh copy each call; for a small two-int struct that is cheap, but the pattern scales badly. Use `const Point&` whenever you do not need to modify the caller's object — the chapter built that habit deliberately.

The third is letting unscoped enum names leak. Two unscoped enums with overlapping member names cannot coexist in the same scope:

```cpp
enum Fruit { apple, orange };
enum Company { apple, microsoft };
```

The `apple` from the second collides with the first. Scoped enums (`enum class Fruit { apple, orange };`) keep their members inside the enum's name and avoid the problem entirely.

The fourth is narrowing inside brace initialization. `int x{ 3.14 };` fails to compile because braces refuse the lossy conversion; the same protection covers struct members initialized with braces. This is one of the small rewards of preferring `{}` over `=` for initialization.

## When to use this

Reach for an enum when you have a small, fixed set of named states — a status, a phase, a mode. Prefer `enum class` unless you specifically want implicit conversion to `int`. Reach for a struct when you have two or more related fields that travel together. Use designated initializers when the meaning of each field is not obvious from order. Reach for a class template when the same struct shape would otherwise be written three or four times with the type varied; otherwise the plain struct is simpler. Reach for an alias template when a particular instantiation has a clear domain meaning worth naming — `Coordinate<T>` over `Pair<T, T>` — and skip it when the underlying spelling is already short. Chapter 14 picks up the same thread with classes, where structs gain private data and member functions.
