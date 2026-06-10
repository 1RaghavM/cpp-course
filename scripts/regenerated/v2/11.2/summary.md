## The idea

In the previous lesson you saw that you can define multiple functions with the same name and the compiler picks the right one. But how exactly does the compiler tell two overloads apart? The answer is the **overload signature**: a combination of the function's name and its parameter list (number of parameters and their types). Two functions in the same scope with the same signature are always an error, no matter how the rest of the declaration differs.

Understanding which aspects of a declaration form the signature — and which don't — lets you predict exactly when two overloads coexist peacefully and when the compiler will complain.

## How it works

**What forms the signature**

The overload signature consists of:
- The function name
- The number of parameters
- The type of each parameter, in order

Changing any one of these produces a different signature and therefore a valid new overload.

```cpp
void process(int x) {}          // signature: process(int)
void process(double x) {}       // signature: process(double)     ← distinct
void process(int x, int y) {}   // signature: process(int, int)   ← distinct
```

All three can coexist in the same scope because all three signatures differ.

**What does NOT form the signature**

Several parts of a declaration are deliberately excluded from the signature:

- **Return type.** The compiler resolves which overload to call before examining what is done with the return value.
- **Parameter names.** Names are for readability; they carry no type information at the call site.
- **`const` / `volatile` on a value parameter.** A top-level qualifier on a pass-by-value parameter is invisible to callers, so it doesn't distinguish overloads.

```cpp
int  getValue(int x) { return x; }
void getValue(int x) {}         // error: same signature, different return type
```

```cpp
void log(int n) {}
void log(const int n) {}        // error: const on a value param is not a distinguisher
```

Both pairs above cause a redefinition error because the signatures are identical.

**Type aliases don't create new types**

A `typedef` or `using` alias is just another name for the same type. Two overloads whose parameter types resolve to the same underlying type are still the same signature:

```cpp
using Score = int;

void rank(int x) {}
void rank(Score x) {}   // error: Score IS int; signatures are identical
```

**Demonstrating valid differentiation by parameter count and type**

```cpp
#include <iostream>

void display(int x) {
    std::cout << "one int: " << x << "\n";
}

void display(int x, int y) {
    std::cout << "two ints: " << x << " " << y << "\n";
}

void display(double x) {
    std::cout << "one double: " << x << "\n";
}

int main() {
    display(1);         // one int: 1
    display(1, 2);      // two ints: 1 2
    display(3.14);      // one double: 3.14
    return 0;
}
```

Each call finds an unambiguous match because the three signatures are all different.

## Common mistakes

**Mistake 1: Thinking a type alias creates a distinct type**

```cpp
using Meters = double;
using Seconds = double;

double speed(Meters d, Seconds t) { return d / t; }
double speed(double d, double t) { return d / t; }  // error
```

`Meters` and `Seconds` are both just `double`. The compiler sees two identical signatures `speed(double, double)` and produces a redefinition error. Strong typing between units requires distinct types — a topic that comes later with structs.

**Mistake 2: Treating parameter names as part of the signature**

```cpp
void print(int value) {}
void print(int count) {}    // error — same as print(int)
```

`value` and `count` are just names. From the compiler's perspective, both declare `print(int)`, which is a conflict.

**Mistake 3: Expecting `const` on a value parameter to create a new overload**

```cpp
void update(int x) {}
void update(const int x) {}   // error — const on a value parameter is not part of the signature
```

At the call site there is no way to observe whether the callee modifies its local copy, so the qualifier is stripped when forming the signature. The fix is to change the actual type, not just add `const`.

## When to use this

Understanding what forms a signature helps any time you add a new overload to a family of functions: check that the new parameter list actually differs in type or count from every existing overload, not just in names or qualifiers. This avoids surprises at the definition site.

The same rules apply when you later encounter member functions, where `const` *on the object itself* (not the parameters) does become part of the signature — but that's a later topic. For now, the rules are: overloads differ by parameter types and counts; everything else (return type, names, value-parameter qualifiers, type aliases) is invisible to overload differentiation.
