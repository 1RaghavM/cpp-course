## The idea

Every expression in C++ produces a value that lives somewhere. The question of *where* it lives determines whether you can take its address, assign to it, or steal its resources.

Think of it this way: a **lvalue** is a named object sitting in a labeled box — you can pick up the box, look at it again later, or put something else in it. An **rvalue** is a temporary object that exists only for the duration of the current expression — it is a box that will be thrown away the moment you are done. The number `42` in `int x = 42` is an rvalue: it has no name, no address you can take, and disappears after the assignment.

An **rvalue reference** is a reference that binds exclusively to rvalues. It is spelled `T&&`. Its purpose is to let you write code that says: "I am receiving something temporary that is about to be destroyed. I am allowed to steal its guts." This is the foundation of move semantics. Without rvalue references, the language had no way to distinguish "I'm passing you my named variable (leave it alone)" from "I'm passing you a temporary (feel free to cannibalize it)."

Rvalue references let the compiler — and you — choose different code paths for lvalues and rvalues, enabling zero-copy transfers that were impossible before C++11.

## How it works

**Example 1 — lvalue vs rvalue: binding rules**

```cpp
#include <iostream>

void process(int& x) {         // lvalue reference
    std::cout << "lvalue: " << x << "\n";
}
void process(int&& x) {        // rvalue reference
    std::cout << "rvalue: " << x << "\n";
}

int main() {
    int a = 5;
    process(a);       // a is a named variable: calls the lvalue overload
    process(10);      // 10 is a literal: calls the rvalue overload
    process(a + 1);   // a+1 is a temporary: calls the rvalue overload
    return 0;
}
```

Output:
```
lvalue: 5
rvalue: 10
rvalue: 6
```

The compiler picks the overload based on whether the argument is a named, addressable object (lvalue) or a temporary (rvalue). An lvalue reference `int&` cannot bind to `10`; an rvalue reference `int&&` cannot bind to `a`.

**Example 2 — an rvalue reference variable is itself an lvalue**

```cpp
#include <iostream>

void show(int& x)  { std::cout << "lvalue ref\n"; }
void show(int&& x) { std::cout << "rvalue ref\n"; }

int main() {
    int&& r = 42;    // r is an rvalue reference VARIABLE — it binds to the temporary 42
    show(r);         // but r itself is a named variable, so it's an lvalue!
    show(42);        // the literal 42 is an rvalue
    return 0;
}
```

Output:
```
lvalue ref
rvalue ref
```

This surprises most learners: once you give something a name — even if the type is `int&&` — it becomes an lvalue. The variable `r` has a name and an address; therefore `show(r)` calls the lvalue overload. To forward it as an rvalue you would use `std::move(r)`, covered in a later lesson.

**Example 3 — using rvalue references to detect temporaries in a class**

```cpp
#include <iostream>
#include <string>

struct Logger {
    void log(const std::string& msg) {
        std::cout << "copy: " << msg << "\n";
    }
    void log(std::string&& msg) {
        std::cout << "move: " << msg << "\n";
    }
};

int main() {
    Logger l;
    std::string s = "hello";
    l.log(s);                      // named variable → lvalue overload
    l.log(std::string("world"));   // temporary    → rvalue overload
    return 0;
}
```

Output:
```
copy: hello
move: world
```

The rvalue overload receives a temporary string. Because the string is about to be destroyed, the `log` function could steal the string's internal buffer rather than copying it — a substantial performance gain for large strings.

## Common mistakes

**Mistake 1 — trying to bind a non-const lvalue reference to an rvalue**

```cpp
int& r = 5;   // ERROR: cannot bind lvalue reference to rvalue 5
```

The compiler rejects this because `5` has no storage location to reference. A `const int&` would work (it extends the temporary's lifetime), but a plain `int&` cannot bind to an rvalue. The fix is to use `int&&` if you want to bind to a temporary, or store the value in a named variable first.

**Mistake 2 — forgetting that a named rvalue-reference variable is an lvalue**

```cpp
void take(int&& x) {}

void forward_wrong(int&& x) {
    take(x);   // ERROR: x is a named variable — it's an lvalue, not an rvalue
}
```

Inside `forward_wrong`, `x` has a name and can be addressed. The call `take(x)` fails because `take` requires an rvalue. You must write `take(std::move(x))` to cast it back to an rvalue reference. This is why `std::move` and `std::forward` exist.

**Mistake 3 — confusing rvalue reference type with move**

```cpp
int&& r = 42;
int&& s = r;   // ERROR: r is an lvalue (it has a name)
```

The type `int&&` does not mean "this is always an rvalue." Once `r` is declared, `r` is a named variable and therefore an lvalue. You cannot bind another rvalue reference directly to `r`. The compiler's error will mention something about binding a non-const lvalue reference to an rvalue, which confuses beginners until they internalize the rule: *named things are lvalues*.

## When to use this

Rvalue references appear in function signatures when you want to write overloads that behave differently for temporaries versus named objects — most commonly in move constructors, move assignment operators, and perfect-forwarding templates. You rarely write `T&&` in everyday application code; instead you rely on the standard library types (smart pointers, containers, strings) whose move constructors and move assignment operators use rvalue references internally. The key insight to carry forward: `T&&` in a function parameter is a promise from the caller that the argument is expendable, freeing you to steal its contents rather than copy them.
