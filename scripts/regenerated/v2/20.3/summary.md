## The idea

Recursion is the technique of writing a function that calls itself. At first glance this sounds circular and impossible — how can a function that calls itself ever terminate? The answer is the base case: a condition under which the function returns directly without calling itself again. Every recursive call makes progress toward the base case, so the chain of calls eventually unwinds.

The classic mental model is Russian nesting dolls. To find out how many dolls there are, you open the outermost one, discover another doll inside, and apply the same "open and count" rule to it — until you find a doll that is solid (the base case). The total count unwinds as you close each doll.

Recursion is not magic. Every recursive call is just a regular function call: a new stack frame is pushed, the function runs, and when it returns the frame is popped. Recursion trades explicit loops and state variables for the call stack itself as the bookkeeping mechanism.

## How it works

**The two required pieces: base case and recursive case**

Every correctly written recursive function has both:

```cpp
#include <iostream>

int factorial(int n) {
    if (n <= 1) return 1;          // base case: stop here
    return n * factorial(n - 1);  // recursive case: reduce toward base
}

int main() {
    std::cout << factorial(5) << "\n";  // 120
    std::cout << factorial(1) << "\n";  // 1
}
```

`factorial(5)` calls `factorial(4)`, which calls `factorial(3)`, and so on until `factorial(1)` returns 1. The return values multiply back up the chain: 1 → 1*2=2 → 2*3=6 → 6*4=24 → 24*5=120.

**Recursion on sequences: summing array elements**

Recursion works naturally on data that has a recursive structure. An array of N elements equals its first element plus the array of the remaining N-1 elements:

```cpp
#include <iostream>

int sumArray(const int* arr, int n) {
    if (n == 0) return 0;                          // base case: empty slice
    return arr[0] + sumArray(arr + 1, n - 1);     // recursive case
}

int main() {
    int data[] = {3, 1, 4, 1, 5};
    std::cout << sumArray(data, 5) << "\n";  // 14
}
```

`arr + 1` moves the pointer one element forward, and `n - 1` shrinks the count. Each call works on a strictly smaller slice, so the base case `n == 0` is always reached.

**Fibonacci: multiple recursive calls**

Some problems require two recursive calls per step, which dramatically increases the number of calls:

```cpp
#include <iostream>

int fibonacci(int n) {
    if (n <= 1) return n;    // base cases: fib(0)=0, fib(1)=1
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    for (int i = 0; i <= 7; ++i)
        std::cout << fibonacci(i) << " ";
    std::cout << "\n";  // 0 1 1 2 3 5 8 13
}
```

This is correct but inefficient for large `n` because it recomputes the same values many times. For production use, iterative or memoized solutions are preferred — but the recursive version is excellent for understanding the problem structure.

## Common mistakes

**Mistake 1 — missing or unreachable base case (infinite recursion)**

If the base case is missing or the recursive call does not progress toward it, the function calls itself forever until the stack overflows:

```cpp
int bad(int n) {
    return n * bad(n - 1);   // no base case — crashes with stack overflow
}
```

Always confirm: (1) the base case exists, (2) every recursive call moves closer to it, and (3) the function actually reaches the base case for your inputs.

**Mistake 2 — off-by-one in the base case**

A common error is a base case that is slightly wrong, producing a result that is off by one step. For factorial, using `n == 0` is correct; using `n == 1` also works because `0! = 1! = 1`. But accidentally using `n == 2` as the base and returning 2 would make `factorial(2)` skip the multiplication:

```cpp
int factorial(int n) {
    if (n <= 2) return 2;     // wrong: factorial(2) should be 2, but factorial(1) should be 1
    return n * factorial(n - 1);
}
// factorial(1) → returns 2 (wrong — should be 1)
```

Test your base case values manually before trusting the recursion.

**Mistake 3 — stack overflow from too-deep recursion**

Each recursive call pushes a stack frame. If the recursion depth is proportional to a large input (like factorial(100000)), the stack overflows before reaching the base case. C++ has a limited stack (typically a few megabytes). For large inputs, convert the recursion to iteration or ensure the depth stays small (O(log N) for divide-and-conquer algorithms is fine; O(N) for large N is risky).

```cpp
int main() {
    std::cout << factorial(100000) << "\n";  // likely stack overflow
}
```

## When to use this

Recursion is most natural when the problem itself has a recursive structure: tree traversal (a tree is a node plus subtrees), divide-and-conquer algorithms (sort one half, sort the other), or problems defined recursively in mathematics (factorial, Fibonacci, GCD). When the recursion depth is bounded and small — like O(log N) for binary search or balanced trees — recursion is clean and safe.

For simple sequential processing like summing an array, an iterative loop is clearer and avoids stack overhead. If you find yourself writing a recursive function over a plain array with O(N) depth, convert it to a loop.
