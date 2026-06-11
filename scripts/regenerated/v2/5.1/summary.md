## The idea

A constant variable is a variable whose value cannot change after it is set. In real programs, most values that look like variables are actually constants: the number of centimeters in an inch, the maximum allowed retry count, the tax rate for a region. Without a way to express that a value should never change, you are forced to scatter the same magic number through your code, and every place becomes a potential source of inconsistency.

`const` is C++'s word for "this value is fixed once initialized." Think of it as a label on a storage box that says "sealed — do not open again." The compiler enforces this promise: any code that tries to modify a `const` variable fails at compile time, not silently at runtime.

## How it works

Declare a `const` variable by placing the `const` keyword before the type (or equivalently after, but before is the conventional style). A `const` variable must be initialized at the point of declaration — you cannot declare it first and assign it later, because there would be no value to seal.

```cpp
#include <iostream>

int main()
{
    const int days_per_week{ 7 };
    const double cm_per_inch{ 2.54 };

    std::cout << "Days: " << days_per_week << "\n";
    std::cout << "CM per inch: " << cm_per_inch << "\n";

    // days_per_week = 8;  // compile error: assignment to const variable
    return 0;
}
```

The most practical benefit is documentation through enforcement. When a reader sees `const int max_score{ 100 }`, they know immediately that `max_score` will never be 99 later in the function. Without `const`, they would have to scan all subsequent code to verify that.

Constants can be used in expressions exactly like any other variable of the same type. Their value participates in arithmetic, comparisons, and output just as a plain `int` or `double` would.

```cpp
#include <iostream>

int main()
{
    const double tax_rate{ 0.08 };
    double price{ 49.99 };
    double tax{ price * tax_rate };
    double total{ price + tax };
    std::cout << "Total: " << total << "\n";
    return 0;
}
```

Because `tax_rate` is `const`, anyone reading this function knows that the rate cannot be accidentally changed between computing `tax` and `total`. The compiler backs up that guarantee.

Notice that `price` and `tax` are not `const` in this example — they are computed values that depend on the non-`const` input `price`. That is fine. You do not have to make everything `const`, only the things that genuinely should not change. A useful habit: declare variables `const` by default and remove `const` only when you discover you need to modify them. This way, mutations in your code are visible rather than invisible.

Function parameters can also be `const`. Marking a parameter `const` tells both the compiler and the reader that the function will not modify that value.

```cpp
#include <iostream>

void print_doubled(const int value)
{
    // value = value * 2;  // compile error — cannot modify const parameter
    std::cout << value * 2 << "\n";
}

int main()
{
    const int score{ 42 };
    print_doubled(score);
    return 0;
}
```

## Common mistakes

**Forgetting to initialize.** A `const` variable that is not initialized is a compile error, not just a warning. `const int x;` will not compile because there is no value to seal.

```cpp
const int x;         // error: const variable must be initialized
const int y{ 10 };   // correct
```

**Trying to modify a `const` through assignment.** Newcomers sometimes expect that an expression like `total_const = total_const + 1` would just issue a warning they can ignore. It is a hard error. The only remedy is to remove `const` if the variable genuinely needs to change, or to introduce a new non-`const` variable for the modified value.

**Confusing `const` with immutable program state.** `const` makes a variable read-only within its scope. It does not mean the underlying memory cannot be accessed another way (through pointers, for example — covered in a later chapter). At this stage, treat `const` as a compile-time contract: the name cannot be used to change the value in the current scope.

## When to use this

Use `const` for any variable whose value should not change after initialization: mathematical constants, configuration parameters, values read from input that will only be read once, and intermediate computed values that serve as named documentation. The rule of thumb is: if you would feel uncomfortable seeing an assignment to that variable later in the code, mark it `const`.

Avoid `const` for loop counters, accumulators, or any variable that is updated on each step of a computation. In those cases, the mutable nature is the point.

As you continue through Chapter 5, you will encounter `constexpr`, which strengthens the promise further: not only is the value fixed, it is evaluated at compile time rather than at runtime. For now, `const` is the right tool for values that are fixed but computed from runtime input.
