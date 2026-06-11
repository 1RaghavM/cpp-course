## The idea

Every name in a C++ program lives in a scope. Scopes can nest: a block inside a function, a function inside a namespace, a namespace inside the global scope. When the same name is declared in an outer scope and again in a nested inner scope, the inner declaration *shadows* (or hides) the outer one. Inside the inner scope, that name refers only to the inner variable — the outer one is effectively invisible, even though it still exists and holds its value.

Think of it like standing in a room inside a building. If both the room and the building have a sign labeled "main exit," the sign on the room wall is the one you see first. The building's sign is still there — you just cannot see it from where you are standing without stepping outside the room first.

Variable shadowing is not a compiler error in most situations; the code compiles and runs. The danger is that it silently changes which variable a piece of code reads or writes. Shadowing is almost always a maintenance trap rather than an intentional design choice.

## How it works

The most common form of shadowing happens when a local variable in a nested block shares its name with a variable in an enclosing block.

```cpp
#include <iostream>

int main()
{
    int value { 10 };

    {
        int value { 20 };         // shadows outer value
        std::cout << value << '\n'; // prints 20
    }

    std::cout << value << '\n';   // prints 10 — outer value unchanged
    return 0;
}
```

Inside the inner block, `value` refers to the newly declared `int value { 20 }`. When the inner block ends and that variable goes out of scope, `value` in the outer block becomes visible again. The outer `value` was never modified; it just could not be named inside the inner block.

A function parameter can shadow a global variable of the same name:

```cpp
#include <iostream>

int counter { 0 };     // global

void report(int counter)   // parameter shadows the global
{
    std::cout << counter << '\n';  // prints parameter, not global
}

int main()
{
    counter = 5;       // modifies the global
    report(99);        // prints 99, not 5
    std::cout << counter << '\n';  // prints 5 — global unchanged
    return 0;
}
```

The parameter `counter` inside `report` completely hides the global `counter` for the duration of the function call.

The scope resolution operator `::` gives you a way to reach past the shadow and name the global explicitly:

```cpp
#include <iostream>

int x { 100 };

int main()
{
    int x { 5 };                    // shadows global x
    std::cout << x << '\n';         // 5 — local
    std::cout << ::x << '\n';       // 100 — global, accessed via ::
    return 0;
}
```

The unqualified `::x` (nothing before the `::`) refers to the global namespace, bypassing any local shadowing. This technique works but is a code smell — it signals that the variable naming has already gone wrong.

## Common mistakes

**Mistake 1 — Accidentally modifying the wrong variable.** A developer intends to update the outer value but declares a same-named variable in the inner block, so the inner assignment never touches the outer one:

```cpp
#include <iostream>

int main()
{
    int total { 0 };

    {
        int total { 50 };   // meant to update outer; actually a separate variable
        total = 50;         // modifies inner total only
    }

    std::cout << total << '\n';  // prints 0, not 50
    return 0;
}
```

The outer `total` remains `0`. The programmer believes they set it to `50`, but the inner declaration created a separate variable that immediately went out of scope.

**Mistake 2 — Shadowing a loop variable (or parameter) with a block variable.** This arises when a nested block introduces a variable that clashes with a variable in the enclosing function. The symptom is that logic inside the block silently operates on a different value from the one the outer function prepared.

**Mistake 3 — Relying on `::` as a fix rather than renaming.** Using `::x` to access a global that is shadowed locally technically works but indicates a design problem: two things in the same logical area have the same name. The compiler warning `-Wshadow` (enabled by `-Wall` on most systems) will flag shadowing, which is a good reason to rename rather than work around.

## When to use this

Shadowing should almost never be intentional. The lesson is really about recognizing the *danger zone*: whenever you declare a variable inside a nested block or function that shares a name with something in an enclosing scope, the outer name becomes inaccessible inside that scope. The right response is to give variables names that reflect their distinct roles — `localTotal` versus `globalTotal`, or `paramValue` versus the outer `value`. Keep `-Wshadow` warnings enabled and treat them as errors in new code. The scope resolution operator `::` to access a shadowed global is useful primarily as a diagnostic tool or in narrow namespace-disambiguation scenarios; do not use it as a substitute for renaming.
