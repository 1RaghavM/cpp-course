## The idea

Imagine you are writing a program that prompts the user to pick a number between 1 and 10. You need to show the prompt at least once before you know whether the user's answer is valid. A regular `while` loop would force you to either duplicate the prompt outside the loop or initialize the variable to some sentinel value just to enter the loop. A do-while loop sidesteps both problems by guaranteeing the body runs once before the condition is ever tested.

The do-while loop is the "execute first, ask questions later" loop. Every other loop in C++ evaluates the condition before the first iteration. The do-while evaluates it after. This makes it the natural choice whenever the body must run at least one time by definition, not by coincidence.

Think of it like a retry dialog in software: you always show the dialog the first time, then check whether the user needs to be prompted again. You never skip showing it the first time.

## How it works

The syntax places the condition at the bottom of the loop body:

```cpp
#include <iostream>

int main() {
    int number{};
    do {
        std::cout << "Enter a number between 1 and 10: ";
        std::cin >> number;
    } while (number < 1 || number > 10);

    std::cout << "You entered: " << number << "\n";
    return 0;
}
```

The body runs unconditionally the first time. After the closing brace, the condition `(number < 1 || number > 10)` is checked. If it is true, the body repeats. If it is false, the loop exits and execution continues after the semicolon that terminates the `while` clause.

That trailing semicolon is required. The do-while is the only loop statement in C++ that ends with a semicolon. Forgetting it is a compile error.

Here is a second example that counts how many times a user keeps asking for "more":

```cpp
#include <iostream>

int main() {
    int count{0};
    char response{};
    do {
        ++count;
        std::cout << "Show item #" << count << ". More? (y/n): ";
        std::cin >> response;
    } while (response == 'y');

    std::cout << "Showed " << count << " item(s).\n";
    return 0;
}
```

The user sees at least the first item no matter what. If they type 'y', the loop runs again; any other character exits.

A third example demonstrates that the loop variable declared before the loop is accessible both inside the body and after the loop exits — a key scoping difference from declaring a variable inside the loop body:

```cpp
#include <iostream>

int main() {
    int attempts{0};
    int guess{};
    const int secret{42};

    do {
        ++attempts;
        std::cout << "Guess the number: ";
        std::cin >> guess;
    } while (guess != secret);

    std::cout << "Correct! Took " << attempts << " attempt(s).\n";
    return 0;
}
```

Because `guess` is declared before the loop, the while-condition can reference it. If `guess` were declared inside the body, it would go out of scope before the condition is evaluated — that is a compile error.

## Common mistakes

**Forgetting the semicolon after the while condition.** The do-while is unique in requiring a semicolon to close:

```cpp
// Wrong — missing semicolon
do {
    std::cout << "Enter a positive number: ";
    std::cin >> n;
} while (n < 0)   // compile error: expected ';'

// Correct
} while (n < 0);
```

The compiler will produce a confusing "expected ';'" error pointing somewhere near the end of the do-while. The fix is always to add the semicolon.

**Declaring the loop variable inside the body.** If you need to reference the variable in the condition, it must be declared before the `do` keyword:

```cpp
// Wrong — variable not in scope at the while condition
do {
    int x{};
    std::cin >> x;
} while (x > 0);  // compile error: 'x' was not declared in this scope

// Correct
int x{};
do {
    std::cin >> x;
} while (x > 0);
```

The condition is outside the block that forms the loop body, so any variable you need there must live in the enclosing scope.

**Assuming a do-while is always better for input validation.** A do-while is only better when the body always needs to run once. If you are re-prompting after an error and want to show different output on the first attempt versus subsequent ones, a regular `while` loop with an explicit first call may actually be clearer. Choose the loop whose structure matches the logic, not habit.

## When to use this

Reach for do-while whenever the loop body must execute at least once by the nature of the problem: interactive input validation, menu-driven programs that must display a menu before reading a choice, and any "retry" pattern where the first attempt is unconditional. 

When the number of iterations might genuinely be zero — iterating over a range, processing a collection, or looping a fixed number of times — a `while` loop (covered in "Introduction to loops and while statements") or a `for` loop is more appropriate. The do-while's value is precisely its guarantee of one unconditional execution; using it where zero iterations are valid produces confusing code.
