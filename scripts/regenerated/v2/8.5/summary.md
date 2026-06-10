## The idea

When you have a single variable that can take on several distinct integer values and you want to run different code for each value, you could write a long chain of `if`/`else if`/`else` blocks. That works, but it gets repetitive: you keep writing the same variable name over and over, and the structure of the comparison is buried in the noise. A `switch` statement is the cleaner alternative. Think of it as a dispatch table: you hand it one integer expression and it jumps directly to the matching case label, skipping the rest. The mental model is a train yard — a single train (your value) enters, and the switches in the track route it to exactly the right platform.

`switch` also signals intent to the reader. When someone sees `switch (command)`, they immediately know the code handles multiple distinct values of `command`. A chain of `if`/`else if` could be testing arbitrary conditions; a `switch` is always about one expression and discrete values.

## How it works

The basic structure has three parts: the switch expression (must evaluate to an integral type — `int`, `char`, or a scoped/unscoped enum), a series of `case` labels, and a `default` label that acts as the catch-all.

```cpp
#include <iostream>

int main() {
    int day = 3;
    switch (day) {
        case 1: std::cout << "Monday\n";    break;
        case 2: std::cout << "Tuesday\n";   break;
        case 3: std::cout << "Wednesday\n"; break;
        case 4: std::cout << "Thursday\n";  break;
        case 5: std::cout << "Friday\n";    break;
        default: std::cout << "Weekend\n";  break;
    }
    return 0;
}
```

Output: `Wednesday`. When `day` is `3`, execution jumps to `case 3:` and runs the code there. The `break` statement then jumps past the closing brace of the entire `switch` block. Without `break`, execution would fall through into `case 4:`, which is usually a bug (more on that in the next lesson).

The `default` label fires when no `case` matches. It is optional — if you omit it and no case matches, the switch body is skipped entirely. In practice, including `default` is a good habit because it makes the unmatched situation explicit.

```cpp
#include <iostream>

int main() {
    char grade = 'B';
    switch (grade) {
        case 'A':
            std::cout << "Excellent\n";
            break;
        case 'B':
            std::cout << "Good\n";
            break;
        case 'C':
            std::cout << "Average\n";
            break;
        default:
            std::cout << "Unknown grade\n";
            break;
    }
    return 0;
}
```

Output: `Good`. `char` is an integral type, so it is valid as the switch expression. The character literal `'B'` is compared to each case label in turn.

You can also stack multiple case labels to run the same code for several values:

```cpp
#include <iostream>

int main() {
    int month = 4;
    switch (month) {
        case 1: case 3: case 5:
        case 7: case 8: case 10: case 12:
            std::cout << "31 days\n";
            break;
        case 4: case 6: case 9: case 11:
            std::cout << "30 days\n";
            break;
        case 2:
            std::cout << "28 or 29 days\n";
            break;
        default:
            std::cout << "Invalid month\n";
            break;
    }
    return 0;
}
```

Output: `30 days`. Cases 4, 6, 9, and 11 all share the same block. Stacked labels like this are intentional and perfectly idiomatic — they are not the unintentional fallthrough bug.

Two rules about case labels: every value must be a compile-time constant (you cannot write `case x:` where `x` is a variable), and no two case labels in the same switch can have the same value.

## Common mistakes

**Forgetting `break` and getting unintended fallthrough.** This is by far the most common switch mistake:

```cpp
int x = 2;
switch (x) {
    case 1: std::cout << "one\n";
    case 2: std::cout << "two\n";
    case 3: std::cout << "three\n";
}
```

A developer expecting only `two` gets:
```
two
three
```

Without `break`, execution continues into the next case body. The fix is simple: add `break` after every case that should not fall through. (Intentional fallthrough is a separate technique covered in the next lesson.)

**Using a floating-point or non-integral type as the switch expression.** The switch condition must be an integral type. `double`, `float`, and `std::string` are not allowed:

```cpp
double temperature = 98.6;
switch (temperature) {  // ERROR: switch condition has non-integer type 'double'
    case 98: std::cout << "normal\n"; break;
}
```

The compiler rejects this outright. The fix is to use an `int`, `char`, or enum.

**Placing the `default` label first and expecting it to act as an initializer.** Some beginners put `default:` at the top thinking it will run if nothing else matches:

```cpp
int n = 5;
switch (n) {
    default: std::cout << "other\n"; break;
    case 5:  std::cout << "five\n";  break;
}
```

This compiles and runs correctly — `default` can appear anywhere and still only matches when no `case` does — but placing it first is confusing to readers. Convention is to put `default` last.

## When to use this

Reach for `switch` whenever you are branching on a single integer expression against a known set of constant values: command dispatch (a menu where 1 = quit, 2 = save, …), mapping a numeric code to a string description, or handling the result of a function that returns one of a fixed set of values. It is cleaner and often slightly faster than an equivalent `if`/`else if` chain, because the compiler can generate a jump table.

Use `if`/`else if` instead when your conditions are ranges (`x > 10 && x < 20`), involve floating-point comparison, or test multiple different expressions. `switch` cannot express ranges — every case must be a single constant. Also prefer `if`/`else if` when you have only two conditions; a two-case switch adds ceremony without clarity.
