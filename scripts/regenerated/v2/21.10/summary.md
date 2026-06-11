## The idea

The parenthesis operator `()` is the most flexible operator you can overload. Unlike `operator[]`, which takes exactly one index, `operator()` can take any number of arguments — zero, one, two, or more. A class that overloads `operator()` is called a **functor** (short for "function object"). When you write `obj(arg1, arg2)`, the compiler translates it to `obj.operator()(arg1, arg2)`, which calls whatever member function you defined.

Functors look and behave like functions at the call site, but they are objects: they can carry state between calls (something a plain function cannot do), and you can have many independent instances each with their own private data. The classic uses are parameterized transformations, accumulators, and anything that needs to behave differently based on configuration set up once at construction.

## How it works

**A stateless functor — a simple adder**

The simplest functor just performs a computation:

```cpp
#include <iostream>

class Adder {
    int m_step{};
public:
    Adder(int step) : m_step{ step } {}

    int operator()(int x) const {
        return x + m_step;
    }
};

int main() {
    Adder addFive{ 5 };
    std::cout << addFive(3)  << '\n'; // 8
    std::cout << addFive(10) << '\n'; // 15
}
```

`addFive` looks like a function call at the use site. The `const` qualifier is correct here — calling the functor does not change the stored step value.

**Accumulating state across calls**

Because the functor is an object, `operator()` can modify member variables on each call:

```cpp
#include <iostream>

class RunningSum {
    int m_total{ 0 };
public:
    void operator()(int n) {
        m_total += n;
    }

    int total() const { return m_total; }
};

int main() {
    RunningSum rs;
    rs(10);
    rs(25);
    rs(5);
    std::cout << rs.total() << '\n'; // 40
}
```

`m_total` persists across calls. This is the fundamental advantage over a plain function.

**Two-dimensional access via operator()**

`operator()` with two parameters is the idiomatic way to index a 2D structure. `operator[]` cannot take two arguments (before C++23), but `operator()` can:

```cpp
class Matrix2x2 {
    int m_data[2][2]{};
public:
    int& operator()(int row, int col) {
        return m_data[row][col];
    }

    const int& operator()(int row, int col) const {
        return m_data[row][col];
    }
};
```

Callers write `m(0, 1) = 7` and `int v = m(1, 0)`, which is cleaner than any workaround using `operator[]`.

## Common mistakes

**Forgetting `const` when the functor does not modify state**

```cpp
int operator()(int x) {  // missing const
    return x + m_step;
}
```

Without `const`, calling the functor on a `const`-qualified object fails to compile. Mark `operator()` as `const` whenever the call does not modify any member.

**Confusing a zero-argument call with default construction**

```cpp
Adder a{ 5 };
// a();          // calls operator()(void) — only works if you define it
Adder b();       // declares a function, NOT a variable! classic most-vexing-parse
```

`Adder b()` is a function declaration, not an object. To construct a default-initialized object, write `Adder b{}` or `Adder b`. The parenthesis operator and the constructor are entirely different; only `b(args)` on an already-constructed object calls `operator()`.

**Using `operator()` when `operator[]` is more natural for 1D access**

If you only need one index, prefer `operator[]`. Reserve `operator()` for multiple arguments or when your type genuinely models a function-like callable. Overusing `operator()` for simple single-index access is harder to read than `operator[]`.

**Defining `operator()` on a non-`const` functor and passing it as `const&`**

```cpp
class Filter {
    int m_threshold{};
public:
    Filter(int t) : m_threshold{ t } {}
    bool operator()(int x) { return x > m_threshold; } // non-const
};

void test(const Filter& f, int v) {
    if (f(v)) { /* ... */ }  // compile error: f is const, operator() is not
}
```

Any code that receives your functor as a `const` reference — a common pattern when passing to functions — will fail to compile if `operator()` is not `const`. When the functor does not need to change its state, always mark `operator()` `const`.

## When to use this

Use `operator()` when your class needs to behave as a callable: a transform applied inside a loop, a filter checked against each element, or an accumulator that maintains running state. The key advantage over free functions is that the functor carries private configuration (step size, threshold, accumulated result) without needing global variables or extra parameters.

Functors are most powerful when you need multiple independent instances with different configurations at the same time — something a free function cannot provide. You might construct `Filter belowZero{0}` and `Filter aboveHundred{100}` and apply each independently. This connects directly to "Overloading the comparison operators": it is common to write a comparison functor whose `operator()(a, b)` defines a custom ordering, then pass instances of that functor wherever a comparison is needed.

For 2D or multi-dimensional data, `operator()` with two parameters is cleaner than chaining `operator[]` and is the idiomatic approach shown in the `Matrix2x2` example above.
