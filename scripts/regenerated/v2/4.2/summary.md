## The idea

Not every function produces a value. A function that prints a message, moves a robot, or plays a sound does its work entirely through side effects — changing things in the world — rather than by handing a result back to the caller. The `void` type is how C++ expresses that idea: it is the type of "nothing". A function declared with `void` as its return type promises to never hand a value back to the caller.

Think of it like a fire alarm: you pull it and something happens, but there is no reply. A `void` function is the same — you call it, work gets done, and control returns to you with nothing in hand.

`void` also appears in one other important place: as a placeholder to mean "no type at all". In that sense it is less a real type and more a syntactic signal.

## How it works

**Returning nothing** is as simple as writing `void` where the return type goes. The function body can use `return;` (with no value) to exit early, or it can simply run to the closing brace.

```cpp
#include <iostream>

void printGreeting() {
    std::cout << "Hello, world!\n";
    // no return needed; control falls off the end
}

int main() {
    printGreeting();
    printGreeting();
    return 0;
}
```

Output:
```
Hello, world!
Hello, world!
```

The function does something (printing) but returns nothing. The call site does not assign the result to a variable — there is nothing to assign.

**Using parameters with void functions** works normally. The function still receives values; it just does not send one back.

```cpp
#include <iostream>

void printDouble(int value) {
    std::cout << value * 2 << "\n";
}

int main() {
    printDouble(5);
    printDouble(21);
    return 0;
}
```

Output:
```
10
42
```

`printDouble` reads its parameter, does arithmetic, prints the result, and returns nothing. The caller has no return value to deal with.

**Early return from a void function** lets you bail out before reaching the end of the body:

```cpp
#include <iostream>

void printPositive(int value) {
    if (value <= 0) {
        return;   // exit early — print nothing
    }
    std::cout << value << " is positive\n";
}

int main() {
    printPositive(7);
    printPositive(-3);
    printPositive(0);
    return 0;
}
```

Output:
```
7 is positive
```

When `value` is -3 or 0, the early `return;` fires and nothing is printed. When `value` is 7, the print statement runs.

Note: this example uses `if`, which is introduced in lesson 4.10. If you are reading this lesson before reaching 4.10, focus on the structure of the function and the `return;` syntax rather than the branching logic.

## Common mistakes

**Mistake 1: Trying to return a value from a void function**

```cpp
void add(int a, int b) {
    return a + b;   // ERROR: cannot return a value from void function
}
```

The compiler rejects this with an error like "return-statement with a value, in function returning 'void'". If you want to return a result, change the return type from `void` to the appropriate type such as `int`.

**Mistake 2: Trying to use the "result" of a void function**

```cpp
#include <iostream>

void sayHi() {
    std::cout << "Hi\n";
}

int main() {
    int x = sayHi();   // ERROR: void value not ignored as it ought to be
    return 0;
}
```

`sayHi()` returns nothing, so there is nothing to store in `x`. The compiler will error. Calling a `void` function is a statement on its own — you cannot put it on the right-hand side of an assignment.

**Mistake 3: Confusing "returns nothing" with "does nothing"**

Beginners sometimes think a `void` function is useless. In practice, `void` functions are everywhere: they print output, write to files, update variables through reference parameters (covered later), or perform setup work. The absence of a return value says nothing about whether the function is doing important work.

## When to use this

Use `void` as the return type whenever the function's entire purpose is a side effect: printing output, modifying a global variable, writing to a file, or calling another function for its effect. If the function needs to hand information back to the caller, choose a non-`void` return type (`int`, `double`, etc.) instead.

In real programs, `void` functions are used for things like printing menus, logging messages, or performing setup steps. They pair naturally with functions that return values: one function computes a result, another prints it. Splitting computation from output this way makes each function simpler and easier to test.
