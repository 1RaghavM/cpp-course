## The idea

Chapter 10 has built one interconnected skill: controlling how values move between types. The chapter started with the observation that the compiler often converts values from one type to another without you asking — that is implicit conversion. It then named the specific safe promotions (integral and floating-point) that preserve all information, and the unsafe numeric conversions that can silently truncate or change a value. From there it introduced the tools you reach for when implicit conversion is not what you want: `static_cast` for explicit, documented conversions, type aliases and `typedef` for renaming types so they communicate intent, and `auto` for letting the compiler write the type for you when it is already obvious from the context.

The unifying theme is that C++ has a spectrum of type-conversion power, from fully automatic and safe at one end to fully manual and potentially lossy at the other. Knowing where each tool sits on that spectrum — and when to use which one — is the chapter's core skill.

## How it works

**Implicit conversion, promotions, and narrowing (10.1 – 10.4)**

When you use a value of one type where another type is expected, the compiler attempts an implicit conversion. Safe promotions move a smaller type into a larger one that can represent all its values: `char` → `int`, `int` → `long`, `float` → `double`. These are always safe. Numeric conversions, by contrast, can lose information: converting a `double` to an `int` truncates the fractional part, and converting a large `int` to a `short` may wrap or overflow silently.

Narrowing conversions — those that can lose value — are forbidden inside brace-initialization `{}`. This makes brace-initialization a simple safety net: if the conversion is safe, it compiles; if it could lose data, you get a compile error.

```cpp
int a { 3.7 };     // compile error: narrowing double -> int
int b = 3.7;       // compiles but truncates to 3 — silent data loss
```

**Arithmetic conversions (10.5)**

When two operands of different types meet in an arithmetic expression, the compiler applies the usual arithmetic conversions: both are promoted to a common type before the operation runs. `int + double` becomes `double + double`. `int + unsigned int` follows rules that can produce surprising results when negative values are involved.

```cpp
int x { 5 };
double y { 2.0 };
auto result { x + y };  // result is double (5.0 + 2.0 = 7.0)
```

**static_cast (10.6)**

`static_cast<TargetType>(expression)` is the standard way to request a conversion explicitly. It documents intent, survives code search, and is checked at compile time. Use it any time you want a conversion that would otherwise be implicit narrowing — particularly integer division when you need floating-point division.

```cpp
int total { 7 };
int count { 2 };
double avg { static_cast<double>(total) / count };  // 3.5, not 3
```

**Type aliases (10.7)**

`using Score = int;` creates an alternative name for a type. It does not create a new type — `Score` and `int` are interchangeable. `typedef int Score;` does the same thing but with older syntax. Aliases communicate purpose: `using Milliseconds = long long;` makes code self-documenting in a way that bare `long long` does not.

```cpp
using Percent = double;
Percent tax_rate { 0.07 };
```

**auto for variables and functions (10.8 and 10.9)**

`auto` for a variable tells the compiler to deduce the type from the initializer. `auto x { 3.14 };` makes `x` a `double`. `auto` for a function return type tells the compiler to deduce the type from the `return` expression. All `return` statements in a deduced-return-type function must return the same type.

```cpp
auto add(int a, int b)
{
    return a + b;  // deduced: int
}

auto ratio(int a, int b)
{
    return static_cast<double>(a) / b;  // deduced: double
}
```

The function definition must be visible before the call when using deduced return types — you cannot rely on a forward declaration that has no body.

## Common mistakes

**Mistake 1 — relying on implicit conversion for integer division**

```cpp
int a { 7 }, b { 2 };
double result { a / b };   // result is 3.0, not 3.5
```

`a / b` is evaluated as `int / int` before the result is stored in `double`. The conversion happens after the truncation. The fix is `static_cast<double>(a) / b`.

**Mistake 2 — mixing signed and unsigned in arithmetic**

```cpp
int negative { -1 };
unsigned int large { 0u };
if (negative < large)   // false! -1 converts to a huge unsigned value
    std::cout << "negative is less\n";
```

When `int` and `unsigned int` meet in a comparison, the `int` is converted to `unsigned int`. A value of `-1` wraps to the maximum `unsigned int` value, making it larger than `0`, not smaller. Prefer keeping both operands the same signedness.

**Mistake 3 — forgetting that `auto` drops `const` and references**

`auto` deduces a plain non-const value type. If the initializer is `const int`, `auto` gives you `int`. This is rarely a problem for beginners at this level but can surprise you if you expected the alias to carry qualifiers.

## When to use this

Use brace-initialization `{}` by default to get free narrowing-conversion checks on every initialization. Use `static_cast` any time you deliberately want a numeric conversion that would be implicit and lossy otherwise — it makes reviewers and future you understand you made a conscious choice. Use type aliases when a plain primitive type like `int` or `double` represents a domain concept (price, distance, score) — the alias carries meaning that the underlying type does not. Use `auto` for local variables whose type is spelled out in the initializer (`auto it = map.begin();`) and for short helper functions where the return type is obvious from the one-line body. Prefer explicit return types for functions in header files or functions with multiple return paths where the type is not immediately obvious.
