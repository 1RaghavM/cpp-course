## The idea

The conditional operator (`?:`) is a compact way to express "choose one of two values based on a condition." Think of it as an expression-level if-else: where an if-else statement picks which code to run, the conditional operator picks which value to produce. This distinction matters because expressions can appear inside other expressions — inside a function-call argument, inside a variable initializer, or embedded in an output statement — while if-else statements cannot appear in those positions.

The mental model: `condition ? value_if_true : value_if_false`. The entire construct evaluates to exactly one of the two values depending on whether the condition is true or false. Only the chosen branch is evaluated; the other is skipped entirely.

The conditional operator is also called the ternary operator because it is the only standard operator that takes three operands: the condition, the true-branch expression, and the false-branch expression.

## How it works

**Basic form — choosing between two values**

```cpp
#include <iostream>

int main() {
    int score = 72;
    std::string grade = (score >= 60) ? "pass" : "fail";
    std::cout << grade << "\n";   // pass
    return 0;
}
```

The condition `score >= 60` is true, so the operator produces `"pass"`. The result is stored directly into `grade`. Notice the parentheses around the condition — they are not required by the language, but they make the precedence immediately visible and prevent subtle parse surprises when the `?:` appears inside a larger expression.

**Inside an output statement**

```cpp
#include <iostream>

int main() {
    int a = 5;
    int b = 3;
    std::cout << "max is " << (a > b ? a : b) << "\n";  // max is 5
    return 0;
}
```

Because `?:` is an expression, it can sit directly inside a `<<` chain. An if-else statement cannot fill this role — you would need a temporary variable. The parentheses around the entire `?:` are important here: `<<` has higher precedence than `?:`, so without them the expression would parse as `(std::cout << "max is " << a > b) ? a : (b << "\n")`, which is nonsense.

**Type compatibility of the two branches**

```cpp
#include <iostream>

int main() {
    int x = 7;
    double result = (x % 2 == 0) ? x : x / 2.0;
    std::cout << result << "\n";   // 3.5
    return 0;
}
```

The two branches produce an `int` and a `double`. The compiler converts `int` to `double` so both branches have the same type and the expression has a well-defined type. If the two branches have completely incompatible types the code will not compile. This rule also means you should check that both branches produce the type you intend — a subtle mismatch can silently widen an integer to a floating-point number.

## Common mistakes

**Forgetting that `?:` has very low precedence**

```cpp
int x = 5;
// Wrong: intended to print 1 if positive, else -1
std::cout << x > 0 ? 1 : -1 << "\n";
```

The `<<` operators bind tighter than `?:`, so this is parsed as `(std::cout << x) > 0 ? 1 : (-1 << "\n")`. The program either produces wrong output or fails to compile outright. The correct form uses parentheses around the entire conditional expression:

```cpp
std::cout << (x > 0 ? 1 : -1) << "\n";  // correct
```

When in doubt, parenthesize the whole `?:` expression whenever it appears inside a larger expression.

**Using `?:` to cause side effects instead of selecting a value**

```cpp
int x = 5;
// Compiles but hard to read — misuses the operator
x > 0 ? std::cout << "positive\n" : std::cout << "non-positive\n";
```

This compiles because both branches return a `std::ostream&`, but it reads poorly and misrepresents what `?:` is for. The operator is designed to select a value, not to choose which statement to execute. Use an if-else statement whenever the primary goal is running a block of code.

**Branching on types that cannot be reconciled**

```cpp
int flag = 1;
// compile error: const char* and int are not compatible
int result = flag ? "hello" : 42;
```

The compiler must determine a single type for the whole expression. `const char*` and `int` have no common conversion, so this is a hard error. Both branches must be of the same type, or one must be implicitly convertible to the other.

## When to use this

Reach for the conditional operator when you need to select a value based on a condition in a context that requires an expression: initializing a variable in a single declaration, passing an argument to a function call, or embedding a short choice inside a stream output. It shines when both branches are short — a name, a literal, or a brief arithmetic expression — and the condition is equally concise. The result is a compact, readable one-liner.

Avoid `?:` when either branch involves side effects, when the logic grows complex, or when a readable version would require more than one line. An if-else statement is always clearer in those cases. The operator also appears naturally alongside the relational operators from the next lesson — the condition operand is almost always some kind of comparison.
