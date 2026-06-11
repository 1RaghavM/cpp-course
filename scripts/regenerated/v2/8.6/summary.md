## The idea

Every `switch` statement has two behaviors that beginners often stumble over: fallthrough and variable scoping. Fallthrough means that when execution reaches the end of a case body without hitting a `break`, it continues straight into the next case body — the matching label is just an entry point, not a container. Scoping means that the entire body of a `switch` — from the opening `{` to the closing `}` — forms a single scope, which creates a surprising trap when you declare variables inside individual cases.

Think of fallthrough like a waterfall: once the water drops off case 2, it keeps flowing through cases 3, 4, and so on until something stops it (a `break`, a `return`, or the closing brace). Most of the time this is a bug you want to prevent. But occasionally, fallthrough is exactly what you want, and C++17 gave you a way to say so explicitly.

## How it works

**Intentional fallthrough with `[[fallthrough]]`**

When you deliberately want execution to fall through from one case to the next, annotate the case body with the `[[fallthrough]]` attribute. This silences compiler warnings and, more importantly, communicates intent to the reader.

```cpp
#include <iostream>

int main() {
    int level = 2;
    switch (level) {
        case 3:
            std::cout << "Gold badge\n";
            [[fallthrough]];
        case 2:
            std::cout << "Silver badge\n";
            [[fallthrough]];
        case 1:
            std::cout << "Bronze badge\n";
            break;
        default:
            std::cout << "No badge\n";
            break;
    }
    return 0;
}
```

Output:
```
Silver badge
Bronze badge
```

Level 2 enters at `case 2:`, prints `Silver badge`, then `[[fallthrough]]` makes it drop into `case 1:`, printing `Bronze badge`. The `break` in case 1 stops further fallthrough. `[[fallthrough]]` must appear as the last statement in a case body that intentionally falls through.

**Variable declarations inside a switch**

The entire `switch` block is one scope. If you declare a variable in one case label, that declaration is technically visible in all subsequent case labels — even though the initialization code might be skipped if a different case is matched. The compiler usually rejects this to prevent use-before-initialization bugs:

```cpp
int x = 2;
switch (x) {
    case 1:
        int y = 10;  // ERROR: jump to case 2 bypasses initialization of y
        std::cout << y << "\n";
        break;
    case 2:
        std::cout << "case 2\n";  // y is in scope here, but never initialized
        break;
}
```

The fix is to introduce a nested block (`{}`) inside each case that needs its own variables. A block creates its own scope, so variables declared inside it are not visible outside:

```cpp
int x = 2;
switch (x) {
    case 1: {
        int y = 10;          // y lives only inside this block
        std::cout << y << "\n";
        break;
    }
    case 2: {
        std::cout << "case 2\n";
        break;
    }
}
```

Now `y` is scoped to the `case 1:` block and the compiler is happy. This pattern — wrapping each non-trivial case body in `{}` — is considered good practice whenever a case declares local variables.

**Omitting the last `break`**

The very last case (including `default`) does not need a `break` because there is nothing to fall through to. That said, many style guides require a `break` on the last case anyway, because if someone adds a new case after `default` later, the missing `break` will become a bug. The choice is a matter of team convention.

## Common mistakes

**Accidental fallthrough from a forgotten `break`.** This is the most common switch bug. When you add a new case later and forget `break`, you get silent wrong behavior. The compiler does not warn unless you use `-Wimplicit-fallthrough`:

```cpp
int code = 1;
switch (code) {
    case 1:
        std::cout << "one\n";
        // BUG: forgot break — falls through to case 2
    case 2:
        std::cout << "two\n";
        break;
}
// Prints: one\ntwo — not just "one"
```

The idiom `[[fallthrough]];` makes intentional fallthrough explicit, which means any unlabeled fallthrough is unintentional and should be fixed.

**Declaring variables between case labels without a block, then being surprised by the compile error.** Beginners sometimes think each `case` is a separate scope like an `if` body. It is not:

```cpp
switch (n) {
    case 1:
        int result = n * 2;  // compile error: jumps cross initialization
        break;
    case 2:
        std::cout << result; // result is in scope here too!
        break;
}
```

Wrapping each case body in `{ }` is the fix, not a workaround. It aligns with how the compiler thinks about scope.

**Placing `[[fallthrough]]` before the last statement instead of after the last statement.** The attribute must appear as the last statement executed before the next case label, not as a comment-like prefix. If you write code after `[[fallthrough]]`, that code is unreachable.

## When to use this

Intentional fallthrough — with `[[fallthrough]]` — is valuable when a higher tier of something includes all the properties of lower tiers (badge levels, log severity levels, permission tiers). It removes duplication without a helper function. However, use it sparingly; a block of four or more falling-through cases is a sign that a loop or a helper function would be clearer.

Always wrap case bodies in `{}` when they declare local variables. For simple cases (a single `cout` + `break`), braces are optional but not harmful. If your team's linter enforces braces on all cases, follow that convention.
