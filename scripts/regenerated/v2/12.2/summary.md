## The idea

Every expression in C++ produces a result. But before the compiler can decide what to do with that result — store it, copy it, pass it to a function, bind a reference to it — it needs to classify what *kind* of result was produced. Is the result something that has a persistent home in memory, like a named variable? Or is it a fleeting temporary value that exists only long enough to be used?

This classification is called the *value category* of an expression. The two value categories you need to understand right now are **lvalue** and **rvalue**.

The names come from older C, where the rough rule was: an lvalue could appear on the *left* side of an assignment, and an rvalue could only appear on the *right* side. That rule of thumb is still useful, but the full picture is richer. A better mental model: an lvalue is an expression that *refers to a persistent object* — something with an address you can take. An rvalue is an expression that produces a *temporary value* — something that lives only for the duration of the expression that created it.

Value categories are foundational because references (the topic of the lessons immediately ahead) have different rules depending on the category of what they bind to. Getting this wrong leads to compiler errors that look mysterious without the vocabulary to decode them.

## How it works

**Lvalues** are expressions that identify an object with a stable memory location. Named variables are the clearest example:

```cpp
int x { 5 };
x = 10;      // OK: x is an lvalue — it has a location
```

After `int x { 5 };`, `x` is an lvalue. The expression `x` refers to the object stored at a specific address. You can write to it (it can appear on the left of `=`), you can read it, and you can take its address with `&`. Function calls that return a reference are also lvalues (covered in a later lesson).

**Rvalues** are expressions that do not refer to a persistent object. They produce a temporary result that is discarded once it is used:

```cpp
int x { 5 };
int y { x + 3 };   // x+3 is an rvalue — a temporary int with value 8
```

The expression `x + 3` computes 8 and hands it to `y`'s initializer. That 8 has no named home in memory; it cannot appear on the left of an assignment; you cannot take its address. Integer literals (`5`, `42`, `0`) are also rvalues for the same reason — they produce values but do not refer to any persistent storage.

Here is a direct comparison that makes the distinction tangible:

```cpp
#include <iostream>

int main()
{
    int a { 7 };          // 'a' is a named variable — lvalue
    int b { a + 2 };      // 'a+2' is a temporary int — rvalue

    a = 100;              // OK: writing to an lvalue
    // (a + 2) = 100;     // ERROR: cannot assign to an rvalue

    std::cout << a << '\n';   // 100
    std::cout << b << '\n';   // 9 (captured when b was initialized)
    return 0;
}
```

The commented-out line `(a + 2) = 100` would be a compile error: "expression is not assignable." That is exactly the error the compiler produces when you try to use an rvalue as an assignment target.

**How the compiler uses value categories.**

The compiler uses lvalue vs. rvalue information in two major ways relevant to this chapter:

1. **Reference binding.** An ordinary (`non-const`) lvalue reference can only bind to an lvalue. A `const` lvalue reference can bind to either. You will see this in lesson 12.3 and 12.4.

2. **Operator legality.** Certain operators require lvalues. The address-of operator `&` only works on lvalues — you cannot take the address of a temporary. The increment/decrement operators (`++`, `--`) also require lvalues.

```cpp
int n { 5 };
int* p = &n;     // OK: n is an lvalue, &n is its address
// int* q = &42; // ERROR: 42 is an rvalue — no stable address
```

**A practical test.** When you are unsure whether an expression is an lvalue or an rvalue, ask: "Can I put this expression on the left side of an assignment and does it refer to a named, addressable object?" Named variables pass both tests. Arithmetic results, literals, and most function-call results (unless they return by reference) fail.

## Common mistakes

**Mistake 1: Confusing "lvalue" with "left side of assignment."**

The historical mnemonic is useful but incomplete. `const int x { 5 }` is an lvalue — it has a persistent address — but you cannot assign to it because it is `const`. The *location* is what makes something an lvalue; *modifiability* is a separate question governed by `const`.

```cpp
const int c { 10 };
// c = 20;  // ERROR: c is const (not modifiable), but c is still an lvalue
int* p = &c;  // Also ERROR: can't take non-const pointer to const int
              // but the point is: c HAS an address — it is an lvalue
```

**Mistake 2: Assuming all function return values are rvalues.**

Most functions return by value, producing an rvalue. But a function that returns a reference returns an lvalue. You will encounter this in lesson 12.12. For now, just remember the category depends on how the return is declared, not on the fact that it came from a function.

**Mistake 3: Thinking rvalues are always small or cheap.**

Rvalues are temporaries, but a temporary can be a large string or a whole data structure. The distinction is about *lifetime and addressability*, not size. This matters when C++ must decide whether to copy or move an object — but move semantics are a later topic. For now, remember that rvalue means "has no persistent home," not "is small."

## When to use this

Value categories are vocabulary, not a tool you consciously apply. You will not write code that says "I need an lvalue here." Instead, value categories explain *why* the compiler accepts or rejects code:

- The compiler error "cannot bind non-const lvalue reference to an rvalue" becomes understandable once you know what an lvalue reference expects.
- The compiler error "expression is not assignable" becomes clear once you recognize the target was an rvalue.

The upcoming lessons on references (12.3 and 12.4) rely directly on this vocabulary. Every time a lesson says "lvalue references only bind to lvalues" or "a const reference can extend the lifetime of a temporary," that statement presupposes you understand value categories. Invest a few minutes now to make those later lessons click without friction.
