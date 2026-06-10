## The idea

Writing code that compiles is only the first step. Code can compile without errors and still do the wrong thing. A program might calculate the wrong answer, crash on certain inputs, or behave differently from what you intended. Testing is the practice of systematically running your code with known inputs to verify it produces the expected outputs.

Think of testing like proofreading a long document. You could assume you got everything right the first time, but deliberately re-reading it catches the mistakes your brain glossed over during writing. Similarly, running your code against carefully chosen inputs before calling it done catches the bugs your mind assumed weren't there.

There are two broad categories of errors in programming: compile errors (the compiler rejects your code) and semantic errors (the code compiles and runs, but it doesn't do what you meant). Testing is specifically aimed at catching semantic errors, because the compiler cannot detect them for you.

## How it works

The simplest form of testing is informal: you run your program, enter some inputs, look at the outputs, and decide whether they look right. This works for trivial programs but breaks down quickly because human memory is unreliable, and you might forget to check a particular case next time you change the code.

A more disciplined approach is to write test cases. A test case is a specific input paired with the output you expect from a correct program. You run the program with that input and compare the actual output against the expected output.

**Example 1 — a function you want to test:**

```cpp
#include <iostream>

// Returns the larger of two integers.
int max(int a, int b) {
    if (a > b)
        return a;
    return b;
}

int main() {
    std::cout << max(3, 5) << '\n';   // expect: 5
    std::cout << max(5, 3) << '\n';   // expect: 5
    std::cout << max(4, 4) << '\n';   // expect: 4
    return 0;
}
```

Each call to `max` is a separate test case. Running this and seeing `5`, `5`, `4` in the output gives you evidence the function works for those inputs. If you saw `3` for the first line, you would know the comparison is backward.

**Example 2 — testing boundary conditions:**

```cpp
#include <iostream>

// Returns true if n is even.
bool isEven(int n) {
    return n % 2 == 0;
}

int main() {
    // Typical cases
    std::cout << isEven(4) << '\n';    // expect: 1
    std::cout << isEven(7) << '\n';    // expect: 0
    // Boundary / edge cases
    std::cout << isEven(0) << '\n';    // expect: 1
    std::cout << isEven(-2) << '\n';   // expect: 1
    std::cout << isEven(-3) << '\n';   // expect: 0
    return 0;
}
```

Boundary values — zero, negative numbers, the minimum or maximum of a range — are the places where bugs most often hide. Testing only "normal" inputs gives false confidence.

**Example 3 — separating testable functions from I/O:**

```cpp
#include <iostream>

// Pure computation: easy to test without user interaction.
int add(int a, int b) {
    return a + b;
}

int main() {
    // Automated checks: print PASS or FAIL.
    std::cout << (add(2, 3) == 5   ? "PASS" : "FAIL") << '\n';
    std::cout << (add(-1, 1) == 0  ? "PASS" : "FAIL") << '\n';
    std::cout << (add(0, 0) == 0   ? "PASS" : "FAIL") << '\n';
    return 0;
}
```

Notice that the test logic lives in `main`, separate from the function under test. This makes the checks repeatable: every time you recompile and run, the same inputs are exercised automatically.

## Common mistakes

**Mistake 1 — only testing the "happy path":**
A common trap is to test only the inputs you expect the user to provide. Suppose `isEven` is only tested with positive, non-zero integers. Then someone passes `0` and the function returns the wrong answer because the implementation used `n % 2 == 1` instead of `n % 2 == 0` — which gives `-1` for negative odd numbers, not `1`. Testing only typical inputs missed the edge case.

Wrong mental model: "If it works for 4 and 7, it works for everything."
Reality: Boundary values and special cases reveal bugs that typical inputs never trigger.

**Mistake 2 — eyeballing output instead of asserting:**

```cpp
int main() {
    std::cout << max(3, 5) << '\n';   // just looks at it and thinks "yep, 5"
}
```

When the program grows, you lose track of what "correct" looked like. Print `PASS`/`FAIL` or the expected value alongside the actual value:

```cpp
int result = max(3, 5);
std::cout << "max(3,5): expected 5, got " << result << '\n';
```

Now the check documents itself and future you can see the comparison at a glance.

**Mistake 3 — testing only after writing everything:**
Writing a hundred lines then running for the first time means a bug anywhere in those hundred lines becomes hard to locate. Testing small functions as you write them pins down exactly where a bug is.

## When to use this

Test every non-trivial function as soon as you write it, before connecting it to the rest of the program. If a function takes inputs and produces an output, you can test it in isolation by calling it with known values in `main` and comparing the result to your expected answer. Keep the test calls in `main` while you develop, and remove or comment them out once the function is working correctly. As programs grow larger, this informal-but-systematic approach scales better than relying on intuition alone.
