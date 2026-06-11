## The idea

Chapter 6 introduced the full set of C++ operators: the building blocks for expressing computations, comparisons, and decisions. The unifying theme is that operators are expressions — each one evaluates to a value, has a type, and fits into a larger expression. Understanding how they interact — through precedence, associativity, type promotion, and short-circuit evaluation — is what separates code that merely compiles from code that behaves correctly.

This summary revisits each operator group, highlights the key rules, and flags the recurring traps that trip up even experienced programmers.

## How it works

**Operator precedence and arithmetic**

Precedence determines which operators bind more tightly when expressions are mixed. Multiplication and division (`*`, `/`, `%`) bind before addition and subtraction. Unary minus binds before any binary operator. Associativity (left-to-right for most operators) resolves ties at the same precedence level.

```cpp
int a = 2 + 3 * 4;    // 14, not 20 — * binds first
int b = 10 - 4 - 2;   // 4, not 8  — left-to-right
int c = 7 / 2;         // 3, not 3.5 — integer division truncates toward zero
int d = -7 % 3;        // -1 in C++20 — result has the sign of the dividend
```

Integer division truncates rather than rounds. The modulo operator `%` preserves the sign of the left operand. To get a floating-point result from integer operands, cast at least one operand: `static_cast<double>(7) / 2` gives `3.5`.

**Increment, decrement, and the comma operator**

Prefix `++x` increments `x` and evaluates to the new value. Postfix `x++` increments `x` but evaluates to the old value. Mixing increment with other operators in the same expression risks undefined behavior:

```cpp
int x = 5;
int y = ++x + x;  // undefined behavior — don't do this
int z = ++x;      // fine: z = 6, x = 6
```

The comma operator `,` evaluates both operands but returns the value of the right one. It appears mainly in `for` loop headers and is otherwise rare.

**The conditional operator `?:`**

The ternary `?:` selects one of two values based on a condition. It is an expression, so it can appear anywhere a value is expected:

```cpp
int score = 85;
const char* label = (score >= 60) ? "pass" : "fail";
```

Precedence trap: `?:` has very low precedence — wrap the entire expression in parentheses when embedding it inside `<<` or other operators, or you will get surprising parse results.

**Relational operators and floating-point comparison**

The six relational operators (`<`, `>`, `<=`, `>=`, `==`, `!=`) compare two values and return `bool`. For integers and characters they work exactly as expected. For floating-point values, `==` and `!=` are unreliable after any arithmetic because binary approximations accumulate rounding errors:

```cpp
double a = 0.1 + 0.2;
// a == 0.3 is likely false — use epsilon comparison instead:
bool eq = std::abs(a - 0.3) < 1e-9;
```

Use `<` and `>` freely for ordering floating-point values; only equality needs the epsilon pattern.

**Logical operators: &&, ||, !**

`&&` is true only when both operands are true; `||` is true when at least one is. `!` inverts a `bool`. Both `&&` and `||` short-circuit: the right operand is skipped when the result is already determined. Put safety guards on the left:

```cpp
// safe: division is skipped when divisor == 0
bool ok = (divisor != 0) && (numerator / divisor > 2);
```

De Morgan's laws for negating compound conditions: `!(a && b)` equals `!a || !b`, and `!(a || b)` equals `!a && !b`. Getting this wrong is a very common logic bug.

## Common mistakes

**Precedence surprises with `?:` and `<<`**

```cpp
int x = 5;
std::cout << x > 0 ? "pos" : "neg";  // compile error or wrong parse
std::cout << (x > 0 ? "pos" : "neg");  // correct
```

The `<<` operator has higher precedence than `?:`, so always parenthesize the whole conditional expression when streaming it.

**Floating-point equality — the silent bug**

```cpp
double total = 0.1 + 0.2 + 0.3;
if (total == 0.6) { /* this likely never runs */ }
if (std::abs(total - 0.6) < 1e-9) { /* correct */ }
```

Any equality check on a `double` that was produced by arithmetic should use an epsilon comparison with `std::abs` from `<cmath>`.

**Wrong operand order kills short-circuit protection**

```cpp
int d = 0;
if ((10 / d > 0) && (d != 0)) { /* division by zero before the guard! */ }
if ((d != 0) && (10 / d > 0)) { /* safe: guard is on the left */ }
```

Short-circuit only protects the right operand. The guard must be the left operand.

## When to use this

Every program that computes or decides uses the operators from this chapter. The practical checklist:

- Use parentheses to make precedence explicit whenever mixing different operator groups.
- Cast to `double` before dividing when a fractional result is needed.
- Use `std::abs(a - b) < epsilon` instead of `a == b` for any `double` that went through arithmetic.
- Use `&&` and `||` (not `&` and `|`) for logical conditions.
- Put safety-check conditions on the left side of `&&` to exploit short-circuit evaluation.
- Apply De Morgan's laws carefully when negating compound conditions.
