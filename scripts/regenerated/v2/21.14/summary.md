## The idea

You have already seen how to overload operators for specific class types: you write an `operator+` for `Fraction`, an `operator<` for `Point`, and so on. Separately you have learned how function templates let you write one function definition that works for many types. These two features combine naturally: you can write a single template that works with any type that has the required operators defined. More importantly, you can also write *operator overloads that are themselves templates*, so a generic class like a `Pair<T, U>` can expose operators that adapt to whatever types `T` and `U` happen to be.

The key insight is that operators are just functions with special syntax. Anything that applies to regular functions — including templating — also applies to operators.

## How it works

**Using operators in a function template:**

The simplest case is a template function that uses built-in operators. The function compiles correctly for any type `T` that defines those operators:

```cpp
#include <iostream>

template <typename T>
T maxOf(T a, T b) {
    return (a > b) ? a : b;   // uses operator>
}

int main() {
    std::cout << maxOf(3, 7) << '\n';       // 7 — uses int's operator>
    std::cout << maxOf(1.5, 0.8) << '\n';   // 1.5 — uses double's operator>
}
```

If you call `maxOf` on a type that does not define `operator>`, the compiler produces an error at the point of instantiation — a useful, specific message like "no match for `operator>`".

**A template class with overloaded operators:**

Here `Pair<T>` is a generic holder for two values of the same type. The comparison operators are defined as member functions — they automatically become templates because they are inside a template class:

```cpp
#include <iostream>

template <typename T>
class Pair {
    T m_first;
    T m_second;
public:
    Pair(T a, T b) : m_first{a}, m_second{b} {}

    bool operator==(const Pair& rhs) const {
        return m_first == rhs.m_first && m_second == rhs.m_second;
    }

    bool operator!=(const Pair& rhs) const {
        return !(*this == rhs);
    }

    void print() const {
        std::cout << '(' << m_first << ", " << m_second << ")\n";
    }
};

int main() {
    Pair<int>    a{1, 2}, b{1, 2}, c{3, 4};
    Pair<double> x{1.5, 2.5};

    std::cout << (a == b) << '\n';  // 1 (true)
    std::cout << (a == c) << '\n';  // 0 (false)
    x.print();
}
```

The `operator==` inside `Pair<T>` is instantiated separately for each `T` the compiler sees. `Pair<int>::operator==` uses `int`'s `==`; `Pair<double>::operator==` uses `double`'s `==`.

**Friend function templates for non-member operators:**

When the operator is not a member (as is often the case for `operator<<`), you declare it as a friend template. The syntax requires a forward declaration and a template parameter on the friend:

```cpp
template <typename T>
class Pair {
    T m_first, m_second;
public:
    Pair(T a, T b) : m_first{a}, m_second{b} {}

    template <typename U>
    friend std::ostream& operator<<(std::ostream& out, const Pair<U>& p);
};

template <typename T>
std::ostream& operator<<(std::ostream& out, const Pair<T>& p) {
    out << '(' << p.m_first << ", " << p.m_second << ')';
    return out;
}
```

Now `std::cout << Pair<int>{1,2}` works, and so does `std::cout << Pair<double>{1.5, 2.5}`.

## Common mistakes

**Calling a template operator on a type that does not define it:**

```cpp
template <typename T>
bool lessThan(T a, T b) { return a < b; }

struct Blob { int data; };

int main() {
    Blob x{1}, y{2};
    bool r = lessThan(x, y);  // error: no operator< for Blob
}
```

The error only appears when the template is instantiated for `Blob`, not when the template is defined. The message typically says something like "no match for `operator<`". The fix is either to overload `operator<` for `Blob`, or to add a `static_assert` or concept requirement (if concepts are available) to give a cleaner error.

**Forgetting that template member functions of a template class are already templated:**

```cpp
template <typename T>
class Box {
public:
    template <typename T>   // ERROR: 'T' shadows the class template parameter
    bool operator==(const Box<T>& rhs) const { ... }
};
```

Inside a template class, a member function that refers to `T` does not need its own `template <typename T>` — it already has access to the class's `T`. Adding a second `template <typename T>` redeclares `T` and either shadows the outer parameter or causes a compile error. Simply write `bool operator==(const Box& rhs) const` to compare same-type boxes.

**Trying to define a non-member template operator outside the class without a forward declaration:**

When the operator template is a friend, the friend declaration inside the class and the out-of-class definition must both be template functions with matching signatures. Forgetting the forward declaration or mismatching the template parameters causes a linker error or an "undefined friend" compiler error.

## When to use this

Combine operator overloading with templates whenever you are writing a generic container or utility class (`Pair`, `Optional`, `Stack`, `Grid`) that should expose natural operators to its users. The rule of thumb is the same as for ordinary operators — only overload an operator if its meaning for your type is obvious and unsurprising. In a template context that constraint is even more important: a template operator fires for every type `T`, so an unexpected overload can cause confusing errors far from the template definition. If the operator only makes sense for some specializations, prefer a named member function instead.
