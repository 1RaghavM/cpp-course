## The idea

You've defined overloads, and the compiler needs to decide which one to call. That decision process is called **overload resolution**. Most of the time it works invisibly: pass an `int`, get the `int` overload; pass a `double`, get the `double` overload. But when the argument type doesn't exactly match any overload, the compiler has to consider implicit conversions — and that's where surprising or ambiguous situations arise.

Understanding overload resolution means understanding the hierarchy the compiler uses to rank candidate functions, and knowing when the compiler will simply refuse because no single best candidate exists.

## How it works

When you write a function call, the compiler works through these steps:

**Step 1 — Find candidates.** All overloads in scope with the right name are candidates.

**Step 2 — Find viable candidates.** From the candidates, keep only those where the argument count matches and every argument can be implicitly converted to the corresponding parameter type.

**Step 3 — Find the best viable candidate.** Among viable candidates, the compiler ranks the match quality for each argument using a priority order:

1. **Exact match** — argument type equals parameter type exactly (after trivial adjustments like stripping `const` from the argument).
2. **Trivial conversions** — array-to-pointer, function-to-pointer, lvalue-to-rvalue.
3. **Numeric promotions** — `char` → `int`, `float` → `double` (small types widened losslessly).
4. **Standard conversions** — `int` → `double`, `double` → `int`, `bool` → `int`, etc.
5. **User-defined conversions** (covered in a later chapter).
6. **Variadic match** — `...` (ellipsis) catch-all, lowest priority.

A candidate wins if it's better than every other candidate in every argument. "Better" means at least one argument matches with a higher-priority conversion and no argument matches with a lower-priority conversion than the runner-up.

```cpp
#include <iostream>

void pick(int x)    { std::cout << "int\n"; }
void pick(double x) { std::cout << "double\n"; }

int main() {
    pick(5);    // exact match → int
    pick(5.0);  // exact match → double
    pick('A');  // char promotes to int → int
    return 0;
}
```

**Ambiguous matches**

An ambiguous match occurs when two or more overloads are tied: each is better in some argument but worse in another, or both require the same-priority conversion.

```cpp
void ambig(int x, double y) {}
void ambig(double x, int y) {}

ambig(1, 1);    // error: ambiguous
                // arg1: int→int (exact) vs int→double (conv), arg1 prefers first
                // arg2: int→double (conv) vs int→int (exact), arg2 prefers second
                // neither overload wins both arguments
```

The compiler issues an error: *"call to 'ambig' is ambiguous"*. You must resolve it by casting one argument:

```cpp
ambig(1, 1.0);      // first arg int exact, second double exact → first overload
ambig(1.0, 1);      // first double exact, second int exact → second overload
ambig(static_cast<double>(1), 1);  // explicit cast, same effect
```

**No viable candidate**

If no overload can accept the argument (even with conversions), the compiler errors with "no matching function":

```cpp
void only(std::string s) {}
only(42);   // error: no known conversion from int to std::string
```

## Common mistakes

**Mistake 1: Assuming an `int` literal always calls the `int` overload when a `long` overload also exists**

```cpp
#include <iostream>

void check(long x)   { std::cout << "long\n"; }
void check(double x) { std::cout << "double\n"; }

int main() {
    check(5);   // error: ambiguous!
    return 0;
}
```

`5` is an `int`. Neither `long` nor `double` is an exact match. Converting `int` to `long` is a standard conversion, and so is converting `int` to `double`. Both are the same priority — standard conversion. Neither overload wins, so the compiler calls it ambiguous. The fix is to add a `check(int)` overload or cast: `check(5L)` (long literal).

**Mistake 2: Thinking explicit casts are just stylistic — they actually change which overload fires**

```cpp
#include <iostream>

void run(int x)    { std::cout << "int\n"; }
void run(double x) { std::cout << "double\n"; }

int main() {
    run(static_cast<double>(3));  // prints "double", not "int"
    return 0;
}
```

`static_cast<double>(3)` is a `double` value, so it matches `run(double)` exactly. This pattern is the standard way to control which overload is called when both could accept the argument via conversion.

**Mistake 3: Misreading an ambiguous-match error as "no matching function"**

Both "no matching function" and "call is ambiguous" are overload-resolution errors, but they mean different things:
- "No matching function" — zero viable candidates.
- "Call is ambiguous" — two or more viable candidates with equal ranking.

The fix for the first is to add or broaden an overload. The fix for the second is to add a better-match overload or cast the argument at the call site.

## When to use this

Overload resolution matters most when you're designing a set of overloads that accept related types. Keep overloads clearly distinct — prefer exact-match coverage over relying on promotions or standard conversions. When a caller hits an ambiguity error, the fastest fix is usually to cast the argument explicitly, or to add a specific overload for the argument type that's causing the tie.

Knowing the promotion hierarchy also helps when reading other people's code: a `char` passed to an `int/double` overload set will always prefer `int` (via promotion, higher rank than standard conversion to `double`), which can surprise you if you expected `double`.
