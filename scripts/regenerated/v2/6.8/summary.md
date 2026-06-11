## The idea

Logical operators combine `bool` values to form more complex conditions. There are three: `&&` (logical AND), `||` (logical OR), and `!` (logical NOT).

Logical AND (`&&`) produces `true` only when both operands are true — like a gate that opens only when two switches are both on. Logical OR (`||`) produces `true` when at least one operand is true — a gate that opens when either switch is on. Logical NOT (`!`) flips a `bool` value: `!true` is `false` and `!false` is `true`.

These operators are how you express compound conditions: "the user is logged in AND has admin rights", "the input is less than zero OR greater than 100", "the file was NOT found". They are the glue between the individual comparisons you learned in the previous lesson.

## How it works

**AND and OR on boolean expressions**

```cpp
#include <iostream>

int main() {
    int age = 25;
    bool hasLicense = true;

    bool canDrive = (age >= 16) && hasLicense;
    std::cout << canDrive << "\n";  // 1 (true)

    bool outOfRange = (age < 0) || (age > 120);
    std::cout << outOfRange << "\n"; // 0 (false)
    return 0;
}
```

`canDrive` is true because both conditions hold. `outOfRange` is false because neither is true. The parentheses around each comparison are optional here (relational operators have higher precedence than `&&` and `||`), but they make the grouping obvious.

**Logical NOT**

```cpp
#include <iostream>

int main() {
    bool done = false;
    std::cout << !done << "\n";    // 1 (true)
    std::cout << !!done << "\n";   // 0 (false) — double negation restores the value
    return 0;
}
```

`!` has higher precedence than `&&` and `||`, so `!done && flag` means `(!done) && flag`, not `!(done && flag)`. Double negation (`!!`) is sometimes used to normalize a value to `0` or `1`, but it is rarely needed in practice.

**Short-circuit evaluation**

```cpp
#include <iostream>

int divisor = 0;
bool safe = (divisor != 0) && (10 / divisor > 2);
std::cout << safe << "\n";  // 0 (false) — no division by zero
```

When the left operand of `&&` is `false`, C++ does NOT evaluate the right operand — the result is already determined to be `false`. Similarly, when the left operand of `||` is `true`, the right operand is skipped. This is called short-circuit evaluation. It is not just an optimization; programs rely on it for safety: if `divisor != 0` is false, the division `10 / divisor` is never attempted, preventing undefined behavior. The order of operands in a logical expression can therefore matter: put the cheap or safety-checking condition first.

## Common mistakes

**Using `&` or `|` instead of `&&` or `||`**

```cpp
int x = 5;
// Wrong: bitwise AND, not logical AND
if (x > 0 & x < 10) {
    std::cout << "in range\n";
}
```

`&` and `|` are bitwise operators — they operate on individual bits of integers and do NOT short-circuit. For logical conditions on `bool` values, always use `&&` and `||`. The bitwise forms can produce surprising results and miss the short-circuit safety guarantee.

**Misapplying De Morgan's laws when negating a compound condition**

```cpp
bool a = true;
bool b = false;

// Intended: "NOT (a AND b)"
bool wrong = !a && !b;    // actually "NOT a AND NOT b" — different!
bool correct = !(a && b); // true: NOT (true AND false) = NOT false = true
std::cout << wrong << "\n";   // 0 (false)
std::cout << correct << "\n"; // 1 (true)
```

`!(a && b)` is equivalent to `!a || !b` (De Morgan's law), NOT to `!a && !b`. When you negate a conjunction, AND becomes OR, and vice versa. This mistake is extremely common and produces logic bugs that are hard to spot.

**Expecting short-circuit to prevent all side effects**

```cpp
int counter = 0;
bool result = (counter > 0) && (++counter > 0);
std::cout << counter << "\n";  // 0 — increment never ran
```

Because the left side of `&&` is false, the right side (including `++counter`) is never evaluated. This is usually what you want, but it can be surprising if you expected the side effect to happen. Avoid expressions with side effects inside the operands of `&&` and `||`.

## When to use this

Logical operators are the standard way to build compound conditions from simpler comparisons. Use `&&` when all sub-conditions must hold simultaneously, `||` when any one suffices, and `!` to invert a condition. Always use the double-character forms (`&&`, `||`) for logical operations on `bool` values — reserve single-character `&` and `|` for bitwise arithmetic on integers. Take advantage of short-circuit evaluation to guard against unsafe operations (divide by zero, null pointer dereference in later chapters) by placing the safety check on the left side. When negating a complex condition, apply De Morgan's laws carefully: `!(a && b)` is `!a || !b`, and `!(a || b)` is `!a && !b`.
