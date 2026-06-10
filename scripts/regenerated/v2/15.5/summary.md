## The idea

You have already seen function templates — a way to write one function definition that works with multiple types. A class template extends the same idea to entire classes: you write the class definition once, parameterized by a type, and the compiler generates a concrete version for every type you actually use.

Think of a class template as a blueprint for a blueprint. A regular class is a blueprint for objects. A class template is a blueprint for classes — you supply a type argument and the compiler produces a fully formed class from it. `Pair<int>` is a different class from `Pair<double>`, but both come from the same template definition. You write the logic once, and it works for any appropriate type.

This is most useful whenever you want a container or utility that behaves identically for ints, doubles, or any other type, without duplicating the class body for each case. The compiler does the repetition on your behalf.

## How it works

The syntax puts `template <typename T>` immediately before the class definition. Inside the class, `T` stands for whatever concrete type the user provides when they create an object of that class.

```cpp
template <typename T>
class Pair {
    T m_first;
    T m_second;
public:
    Pair(T first, T second) : m_first{ first }, m_second{ second } {}
    T first()  const { return m_first; }
    T second() const { return m_second; }
};
```

To use this class, supply the type in angle brackets at the point of object creation:

```cpp
Pair<int>    pi{ 3, 7 };
Pair<double> pd{ 1.5, 2.5 };

std::cout << pi.first()  << "\n";  // 3
std::cout << pd.second() << "\n";  // 2.5
```

Each instantiation (`Pair<int>`, `Pair<double>`) is a separate class. The compiler generates code only for instantiations you actually use. If you never write `Pair<char>`, no `Pair<char>` code is compiled.

When a member function is defined *outside* the class body — as you would do when putting declarations in a header and definitions beneath them — it needs its own `template <typename T>` prefix, and the class name must carry `<T>`:

```cpp
template <typename T>
class Box {
    T m_val;
public:
    Box(T val);
    T get() const;
    void set(T val);
};

template <typename T>
Box<T>::Box(T val) : m_val{ val } {}

template <typename T>
T Box<T>::get() const { return m_val; }

template <typename T>
void Box<T>::set(T val) { m_val = val; }
```

All of these definitions must be visible to any translation unit that instantiates the template. In practice that means putting both the class definition and all member function definitions in the same header file. You cannot hide the definitions in a separate `.cpp` file the way you can with regular classes.

The keywords `typename` and `class` are interchangeable in the template parameter list — `template <typename T>` and `template <class T>` mean exactly the same thing. `typename` is more common because it reads naturally: "T is some type".

## Common mistakes

**Mistake 1: Defining template member functions in a separate `.cpp` file.**

```cpp
// box.h
template <typename T>
class Box {
    T m_val;
public:
    Box(T val);
    T get() const;
};

// box.cpp — WRONG
#include "box.h"
template <typename T>
Box<T>::Box(T val) : m_val{ val } {}
```

The linker reports undefined symbols for `Box<int>::Box` or `Box<double>::get`. The other translation units that include `box.h` never see the definitions, so no code is generated for them. The fix is to put all template definitions in the header.

**Mistake 2: Forgetting `<T>` when defining a member function outside the class.**

```cpp
template <typename T>
Box::Box(T val) : m_val{ val } {}   // error: Box is not a complete type name here
```

The class name in an out-of-class definition must be `Box<T>`, not `Box`. The `<T>` is what connects this definition to the right template instantiation.

**Mistake 3: Expecting the compiler to deduce the type when no constructor argument guides it.**

```cpp
Box b;        // error: cannot deduce T with no argument
Box<int> b;   // correct
```

Class Template Argument Deduction (CTAD) works only when the constructor arguments provide sufficient information. When in doubt, supply the type explicitly in angle brackets.

## When to use this

Reach for a class template whenever you are writing a utility whose behavior does not depend on any particular element type — a pair, a wrapper, a fixed-size buffer, a simple stack. The template lets you reuse the same logic for `int`, `double`, `std::string`, or any user-defined type without repeating the class body.

If the class logic genuinely differs for certain types (a fast integer path, for instance), that calls for template specialization — a more advanced feature. For the common pattern of "this class holds or transforms values of some type", a plain `template <typename T>` class is the right tool. The key discipline here is keeping the full definition in the header so every translation unit that uses the template can instantiate it.
