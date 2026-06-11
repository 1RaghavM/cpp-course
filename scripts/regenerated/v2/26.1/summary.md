## The idea

A template class is a blueprint for a family of classes. Instead of writing a separate `Stack<int>`, `Stack<double>`, and `Stack<std::string>` by hand, you write one template and let the compiler manufacture each concrete version on demand. The key insight is that the type is a parameter — just like a function parameter, except the compiler resolves it at compile time rather than at runtime.

Think of it like a cookie cutter. The cutter defines the shape; the dough (the type you pass) determines what you actually bake. Every cookie shares the shape, but you can make chocolate, vanilla, or shortbread without rewriting the cutter.

You have already seen function templates, which do the same thing for functions. A class template applies the same idea to an entire class — its data members, its member functions, and its constructors all become parameterized over one or more types.

## How it works

**Declaring a template class**

Place `template <typename T>` immediately before the class definition. Inside the class, use `T` wherever the type should vary.

```cpp
#include <iostream>

template <typename T>
class Box {
public:
    T value;
    explicit Box(T v) : value{v} {}
    void print() const { std::cout << value << "\n"; }
};
```

Instantiate it by supplying a type argument:

```cpp
Box<int>    ibox{42};
Box<double> dbox{3.14};
ibox.print();   // prints 42
dbox.print();   // prints 3.14
```

The compiler generates two completely separate classes from that one template. `Box<int>` and `Box<double>` are distinct types with no relationship to each other.

**Defining member functions outside the class body**

When you define a member function outside the class, you must repeat the template header on every definition:

```cpp
template <typename T>
class Pair {
public:
    T first, second;
    Pair(T a, T b);
    T larger() const;
};

template <typename T>
Pair<T>::Pair(T a, T b) : first{a}, second{b} {}

template <typename T>
T Pair<T>::larger() const {
    return (first > second) ? first : second;
}
```

Notice `Pair<T>::` — the class name in the qualifier must carry the template argument `<T>` so the compiler knows which template's scope you are entering.

**Using a template class with a container**

Here is a minimal fixed-size stack that shows a more realistic use:

```cpp
#include <cassert>
template <typename T>
class SimpleStack {
    T data[64]{};
    int top_{0};
public:
    void push(const T& v) { assert(top_ < 64); data[top_++] = v; }
    T   pop()             { assert(top_ > 0);  return data[--top_]; }
    bool empty() const    { return top_ == 0; }
};
```

`SimpleStack<int>` and `SimpleStack<std::string>` both exist from this one definition.

## Common mistakes

**Mistake 1 — Splitting the template between a header and a .cpp file**

A common impulse is to put the class declaration in `Pair.h` and the member function definitions in `Pair.cpp`, just like you would for a regular class. The template definitions must be visible to the compiler at the point of instantiation, which means they must be in the header (or in a file `#include`d by the header). If you place them in a separate `.cpp`, you will get a linker error saying the symbol is undefined:

```
undefined reference to `Pair<int>::larger() const'
```

The fix: keep all template definitions in the header file, either inside the class body or below it.

**Mistake 2 — Forgetting `<T>` when qualifying a member function outside the class**

```cpp
// WRONG — compiler doesn't know which template's Pair this is
template <typename T>
T Pair::larger() const { ... }   // error: 'Pair' is not a complete type

// RIGHT
template <typename T>
T Pair<T>::larger() const { ... }
```

The scope qualifier must be `ClassName<T>::`, not just `ClassName::`.

**Mistake 3 — Treating template instantiations as related types**

`Box<int>` and `Box<double>` are entirely separate types. You cannot pass a `Box<int>` where a `Box<double>` is expected, and there is no implicit conversion between them. Newcomers sometimes expect inheritance-like behaviour here.

```cpp
void printBox(Box<double> b) { b.print(); }

Box<int> ib{5};
printBox(ib);   // compile error: cannot convert Box<int> to Box<double>
```

## When to use this

Reach for a template class any time you need the same data structure or algorithm to work with multiple types: containers (`Stack`, `Pair`, `Queue`), wrappers (`Optional`, `Result`), mathematical objects (`Vector2D<float>` vs `Vector2D<double>`). The alternative — duplicating the class for every type, or using `void*` — either bloats the code or loses type safety.

Template classes pair naturally with the function templates you learned in chapter 11. When a container needs member functions that are themselves generic, you combine both tools. If you need only a single type and know it at design time, a plain class is simpler and should be preferred.
