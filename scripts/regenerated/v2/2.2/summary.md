## The idea

So far, functions have been actions — they do something and then stop. But many of the most useful functions in a program are not just actions; they are answers. You ask a question ("what is 3 plus 5?"), the function figures it out and hands the answer back to you. A value-returning function is one that computes a result and sends it back to the caller. The caller can then store it, print it, use it in another calculation, or pass it to yet another function.

The mental model: a function call with a return value works like a substitution. Wherever you write the call, the compiler eventually replaces it with the value the function computed. If `add(3, 5)` returns `8`, then `std::cout << add(3, 5)` behaves exactly like `std::cout << 8`.

## How it works

To make a function return a value, change `void` to the type of value you want to send back, and add a `return` statement inside the body.

```cpp
#include <iostream>

int double_it(int x)
{
    return x * 2;
}

int main()
{
    int result = double_it(4);
    std::cout << result << "\n";   // prints 8
    return 0;
}
```

The `return` keyword does two things at once: it specifies the value to hand back, and it ends the function immediately. No statement after `return` in the same execution path will run.

The return type in the function signature (`int`) and the type of the expression in the `return` statement must match (or the compiler will convert them, but matching is cleaner). If the return type is `int`, return an `int`.

You can also use the return value directly without storing it:

```cpp
#include <iostream>

int square(int n)
{
    return n * n;
}

int main()
{
    std::cout << square(3) << "\n";   // prints 9
    std::cout << square(5) << "\n";   // prints 25
    return 0;
}
```

Notice that `square` is called twice with different inputs. Each call is independent — the function runs from top to bottom each time, computes a fresh result, and returns it to the caller.

`main` itself returns `int`. The value returned from `main` is sent to the operating system as an exit code. By convention, `return 0` means success. You are required to have a `return` statement in any function with a non-`void` return type; omitting it causes undefined behaviour.

```cpp
int add(int a, int b)
{
    return a + b;
}

int main()
{
    int sum = add(10, 20);
    std::cout << sum << "\n";  // 30
    return 0;
}
```

Here `add` takes two `int` parameters (covered more deeply in lesson 2.4, but already used here in the simplest form). The return value is assigned to `sum` and then printed.

## Common mistakes

**Forgetting the `return` statement.**

```cpp
int triple(int x)
{
    x * 3;   // expression is evaluated but the result is thrown away
}            // no return — undefined behaviour
```

The compiler may warn about "no return statement in function returning non-void." If you ignore the warning and call `triple`, the returned value is garbage. Always end a value-returning function with a `return` that actually sends something back.

**Returning the wrong type without noticing.**

```cpp
#include <iostream>

int half(int x)
{
    return x / 2;
}

int main()
{
    std::cout << half(5) << "\n";   // prints 2, not 2.5
    return 0;
}
```

`5 / 2` in C++ integer division gives `2`, not `2.5`. The `.5` is silently discarded. If you expect a fractional result you need a floating-point type — but those haven't been covered yet, so for now keep this limitation in mind when dividing integers.

**Using the return value as if the function is `void`.**

```cpp
#include <iostream>

int getNumber()
{
    return 42;
}

int main()
{
    getNumber();   // return value is silently discarded
    std::cout << "nothing printed\n";
    return 0;
}
```

Calling `getNumber()` without capturing the result is legal, but if the point of calling the function was to get the value, you've thrown it away. Store the result in a variable or use it directly in an expression.

## When to use this

Use a value-returning function whenever a piece of computation produces a single answer that other parts of the program need. Calculations, conversions, and anything that "looks something up" are natural fits. When there is no meaningful value to send back — for example, a function that only prints a message — keep the return type `void`, as covered in the next lesson.

Return values compose naturally: `add(square(3), square(4))` chains two calls, using each returned value as input to the next. This makes programs easy to read as expressions rather than sequences of side effects.
