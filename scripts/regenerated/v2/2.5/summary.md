## The idea

Every variable in C++ lives in a region of the program called its scope. Scope determines two things: where a variable can be seen by name, and when it is created and destroyed. In C++, each pair of curly braces `{` `}` creates its own scope. A variable declared inside those braces is local to that block — it exists from the point of declaration to the closing brace, and nowhere else.

The practical consequence: two functions can each have a variable named `x` without any conflict, because each `x` lives in a different scope. When the functions are not running, their local variables do not exist at all. This isolation is not a restriction — it is a feature. It means you can read and reason about one function without worrying about what any other function is doing to its own variables.

Think of scope like rooms in a building. A variable declared in the kitchen exists only in the kitchen. You cannot use it from the living room, and it doesn't interfere with a "coffee" variable someone declared in the living room. Each room is self-contained.

## How it works

A local variable is created when execution reaches its declaration and destroyed when execution reaches the closing brace of the block it was declared in.

```cpp
#include <iostream>

void countUp()
{
    int x = 1;
    std::cout << x << "\n";   // x is 1
    x = x + 1;
    std::cout << x << "\n";   // x is 2
}   // x is destroyed here

int main()
{
    countUp();
    countUp();   // a fresh x is created, starting at 1 again
    return 0;
}
```

Output:
```
1
2
1
2
```

Every call to `countUp` creates a fresh `x` with value `1`. When `countUp` returns, that `x` is gone. The next call starts over. There is no memory of previous calls.

Two functions can have variables with the same name — they are completely separate:

```cpp
#include <iostream>

void functionA()
{
    int value = 10;
    std::cout << value << "\n";
}

void functionB()
{
    int value = 99;   // different variable, same name — no conflict
    std::cout << value << "\n";
}

int main()
{
    functionA();   // 10
    functionB();   // 99
    return 0;
}
```

`value` in `functionA` and `value` in `functionB` are different variables that happen to share a name. They are born and die independently with each function call.

Variables declared in `main` are equally local to `main`:

```cpp
#include <iostream>

int double_it(int n)
{
    return n * 2;
}

int main()
{
    int result = double_it(7);   // result is local to main
    std::cout << result << "\n";
    return 0;                    // result is destroyed here
}
```

`result` exists only inside `main`. The function `double_it` has no knowledge of `result`, and `result` has no knowledge of the parameter `n` inside `double_it`.

## Common mistakes

**Trying to use a variable outside its scope.**

```cpp
#include <iostream>

void makeValue()
{
    int answer = 42;
}   // answer is destroyed here

int main()
{
    makeValue();
    std::cout << answer << "\n";   // ERROR: 'answer' was not declared in this scope
    return 0;
}
```

`answer` is local to `makeValue`. Once that function returns, `answer` does not exist. To get a value out of a function, use a return value, as covered in lesson 2.2.

**Assuming a variable keeps its value between function calls.**

```cpp
#include <iostream>

void count()
{
    int n = 0;   // n is re-initialised to 0 every single call
    n = n + 1;
    std::cout << n << "\n";
}

int main()
{
    count();   // prints 1
    count();   // prints 1 — NOT 2
    count();   // prints 1 — NOT 3
    return 0;
}
```

A common misconception is that `n` will accumulate across calls. It does not. Each call creates a new `n` starting at `0`, increments it to `1`, and then destroys it. C++ does have a way to persist state across calls (`static` local variables), but that is a later topic. For now, assume every local variable starts fresh each call.

**Name shadowing — reusing a name in a nested block.**

```cpp
#include <iostream>

int main()
{
    int x = 5;
    {
        int x = 10;              // a different x, in the inner block
        std::cout << x << "\n";  // prints 10
    }
    std::cout << x << "\n";      // prints 5 — the original x
    return 0;
}
```

The inner `x` shadows the outer `x` inside its block. After the inner block ends, the outer `x` reappears. This compiles but is confusing. Avoid reusing names in nested blocks — choose a different name for the inner variable.

## When to use this

Local scope is the default and the right choice for almost every variable you write. It keeps variables confined to the smallest region of code that needs them, which makes programs easier to understand and less likely to have accidental interactions between functions.

When you find yourself wanting a variable that persists between calls or is accessible from multiple functions, resist the temptation to use a global variable (declared outside all functions). Instead, pass the value as a parameter or return it from a function — both techniques you now know from the previous lessons in this chapter. Proper use of local scope, parameters, and return values covers the vast majority of real programs.
