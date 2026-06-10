## The idea

An **unscoped enumeration** is the simplest kind of program-defined type. It lets you give names to a small, fixed set of related values. Instead of writing `int state { 2 };` and leaving the reader to wonder what `2` means, you write `TrafficLight light { yellow };` and the meaning is right there in the name.

Picture a row of light switches with labels above them: "off", "on", "auto". The labels are the enumerators. The switch itself — the thing that can be in exactly one of those positions — is a variable of the enumeration type. Internally the compiler still uses integers (positions 0, 1, 2 in this case) to represent the choice, but in your source code you write the labels, and the compiler does the bookkeeping.

The previous lesson introduced the general idea of a program-defined type. An unscoped enumeration is your first concrete example of one. The word "unscoped" means the labels live in the same scope as the type's name — close enough to use them directly without qualification.

## How it works

An enumeration is defined with the keyword `enum`, a name for the type, and a brace-enclosed comma-separated list of enumerators. Each enumerator is just a name; the values are assigned automatically starting at 0.

```cpp
#include <iostream>

enum TrafficLight
{
    red,
    yellow,
    green,
};

int main()
{
    TrafficLight light { yellow };
    std::cout << light << '\n';
    return 0;
}
```

`TrafficLight` is the new type. `red`, `yellow`, and `green` are its enumerators. The variable `light` holds one of those three values. When printed, the underlying integer (1 for `yellow`) appears, because the language does not yet know that `yellow` should print as the text `"yellow"`. Translating between an enumerator and a string is its own task that later lessons cover.

You do not have to accept the default 0, 1, 2 pattern. You can pick the value of any enumerator explicitly, and the following enumerators continue from there:

```cpp
#include <iostream>

enum HttpStatus
{
    ok        = 200,
    notFound  = 404,
    teapot    = 418,
};

int main()
{
    HttpStatus code { notFound };
    std::cout << code << '\n';
    return 0;
}
```

This prints `404`. The explicit values do not have to be in order, do not have to be unique (though it is usually a bad idea to repeat them), and do not have to be positive. They do have to fit in the underlying integer type the compiler picks for the enumeration.

Enumerators can be used anywhere their type is expected — in initializers, assignments, `switch` cases, and as `if` comparisons:

```cpp
#include <iostream>

enum Mode
{
    off,
    on,
    autoMode,
};

int main()
{
    Mode m { on };
    if (m == on)
        std::cout << "running\n";
    else if (m == off)
        std::cout << "stopped\n";
    return 0;
}
```

Notice that `on` and `off` are written without a `Mode::` prefix. That is the "unscoped" property: the enumerator names spill out of the enumeration into the enclosing scope, so you reach them directly.

## Common mistakes

**Forgetting the semicolon after the closing brace.** This trap is the same one from the previous lesson, just applied to a concrete enum. `enum Mode { off, on, autoMode }` without a trailing `;` is not a complete statement, and the compiler complains about whatever comes next — usually `int main` — with a message that takes practice to read.

**Assigning a raw integer to an enum variable.** Beginners often try this and are surprised when it fails:

```cpp
enum TrafficLight { red, yellow, green, };
TrafficLight light { 1 };   // error: cannot initialize from int
```

Even though `yellow` happens to be 1 internally, the language does not let you cross the type boundary implicitly. The next lesson covers how to do the conversion deliberately. For now, write `TrafficLight light { yellow };`.

**Reusing an enumerator name in the same scope.** Because the names leak out, two unscoped enumerations in the same scope cannot share an enumerator name:

```cpp
enum Pet     { cat, dog };
enum Action  { cat, run };   // error: 'cat' redeclared
```

The fix in legacy code is usually to rename one of the enumerators, often by prefixing it (`pet_cat`, `action_cat`). This is a real motivator for `enum class`, which scopes its enumerators — covered later in the chapter.

## When to use this

Reach for an unscoped enumeration whenever a variable should hold one of a small, fixed set of named values: a card suit, a day of the week, a parser state, a return-code category. It documents intent and gives the compiler a chance to catch typos that a raw `int` would not. If the set of values is large, dynamic, or open-ended, an enum is the wrong tool — keep using `int` or `std::string` there. If you want stricter type safety and scoped names, prefer a scoped enumeration (covered in a later lesson), but unscoped enums remain common in older code and in places where the implicit conversion to `int` is convenient.
