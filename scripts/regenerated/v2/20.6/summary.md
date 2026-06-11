## The idea

A lambda is an anonymous function defined right where you need it, instead of separately with a name. The word "anonymous" is the key: you do not have to think of a name, declare the function somewhere else in the file, or scroll away from your algorithm to understand the logic. The function body lives inline at the point of use.

You have already seen function pointers, which let you pass behavior as an argument. Lambdas do the same thing but with less ceremony. Instead of writing a named function at the top of the file and passing its name, you write the function body directly inside the call. In modern C++ code, lambdas appear anywhere a callable is expected: sorting, filtering, mapping, callbacks, and any place you used to pass a function pointer.

## How it works

**The lambda syntax**

A lambda has three required parts and one optional:

```
[captures] (parameters) -> return_type { body }
```

The return type is optional when the compiler can deduce it. The most minimal lambda looks like: `[]() { /* body */ }`. The `[]` is the capture list (covered in the next lesson); for now leave it empty.

```cpp
#include <iostream>

int main() {
    auto greet = []() { std::cout << "Hello!\n"; };
    greet();   // prints: Hello!
    greet();   // prints: Hello!
}
```

`auto greet = ...` stores the lambda in a local variable. The type of a lambda is a unique, unnamed type — `auto` is the only way to name it without `std::function`.

**Lambdas with parameters and return values**

Parameters work just like regular function parameters. The return type is deduced from the return statement:

```cpp
#include <iostream>

int main() {
    auto add = [](int a, int b) { return a + b; };
    std::cout << add(3, 4) << "\n";   // 7
    std::cout << add(10, 5) << "\n";  // 15
}
```

If the deduced return type is ambiguous (multiple return statements of different types), specify it explicitly: `[](int x) -> double { return x / 2.0; }`.

**Passing a lambda to a function that takes a function pointer**

A lambda with no captures is implicitly convertible to a function pointer with the matching signature. This means you can pass a lambda wherever a function pointer is expected:

```cpp
#include <iostream>

int apply(int x, int y, int (*op)(int, int)) {
    return op(x, y);
}

int main() {
    // Pass a lambda directly to a function-pointer parameter
    std::cout << apply(8, 3, [](int a, int b) { return a - b; }) << "\n"; // 5
    std::cout << apply(4, 5, [](int a, int b) { return a * b; }) << "\n"; // 20
}
```

The lambdas have no captures and match the signature `int(int, int)`, so they convert to `int(*)(int, int)` automatically.

**Storing lambdas with `auto` and calling them later**

You can store a lambda in a variable and call it multiple times, just like a regular function:

```cpp
#include <iostream>

int main() {
    auto isEven = [](int n) { return n % 2 == 0; };
    int numbers[] = {1, 2, 3, 4, 5, 6};
    int count = 0;
    for (int x : numbers)
        if (isEven(x)) ++count;
    std::cout << "Even count: " << count << "\n";  // Even count: 3
}
```

## Common mistakes

**Mistake 1 — forgetting the `()` to call the lambda**

Storing a lambda in a variable and forgetting to add `()` when calling it is a common beginner mistake. Without `()`, you reference the lambda object itself, not its return value:

```cpp
auto fn = [](int x) { return x * 2; };
int y = fn;   // compile error: cannot assign lambda object to int
int z = fn(5); // correct: calls the lambda, assigns 10
```

Lambdas are callable objects — they need `()` with appropriate arguments just like any function.

**Mistake 2 — mismatching parameter types**

Lambdas are strictly typed. Passing an argument of the wrong type causes a compile error (unlike ellipsis functions):

```cpp
auto addInts = [](int a, int b) { return a + b; };
addInts(1.5, 2.5);  // compile error: double to int conversion
```

This is a feature, not a bug — type safety catches mismatches at compile time.

**Mistake 3 — capturing by value when you expect to observe later changes (preview)**

The empty `[]` means the lambda captures nothing from the surrounding scope. If you need to access a local variable from inside the lambda, you must capture it — but that is covered in the next lesson. Trying to use a local variable from the outer scope without capturing it is a compile error:

```cpp
int main() {
    int factor = 3;
    auto triple = []() { return factor * 3; }; // compile error: 'factor' not captured
}
```

## When to use this

Lambdas are the modern replacement for named functions used only as callbacks or short predicates. Anytime you write a tiny named function at the top of a file just to pass it to an algorithm or a sort call, a lambda is cleaner. The rule of thumb: if a function body is under 10 lines and only needed in one place, prefer a lambda.

Use a named function when the logic is complex enough to deserve a name, reused in multiple places, or needs to be tested independently. Lambdas without captures are strictly equivalent to function pointers for their use cases, with cleaner syntax.
