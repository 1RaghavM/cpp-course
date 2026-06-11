## The idea

When you call a member function on an object, C++ gives the function implicit access to the object through `this`. But `this` can point to two very different kinds of object: a regular named variable you can assign to and modify (*lvalue*), or a temporary that exists only for the duration of an expression (*rvalue*). Normally you cannot tell which one you have inside a member function. Ref qualifiers let you write two versions of the same member function — one that runs on lvalues and one that runs on rvalues — and have the compiler call the right one automatically.

Think of a coffee mug. If you have your own mug sitting on your desk, you'd pour fresh coffee into it carefully. If someone hands you an empty paper cup that will be thrown away immediately, you might treat it differently — maybe you pour from it instead. The physical action differs based on whether the thing you're holding is permanent or temporary. Ref qualifiers give your member functions that same awareness.

## How it works

Ref qualifiers are placed after the parameter list (and after `const` if present) in the function declaration and definition. `&` means the function is called on lvalues; `&&` means it is called on rvalues.

```cpp
#include <iostream>

class Message {
    std::string m_text;
public:
    Message(std::string t) : m_text{ std::move(t) } {}

    void print() & {       // called on lvalues
        std::cout << "lvalue: " << m_text << "\n";
    }

    void print() && {      // called on rvalues
        std::cout << "rvalue: " << m_text << "\n";
    }
};

int main() {
    Message m{ "hello" };
    m.print();               // calls print() & — m is an lvalue
    Message{ "world" }.print();  // calls print() && — temporary is an rvalue
}
```

Output:
```
lvalue: hello
rvalue: world
```

The two overloads have identical signatures apart from the ref qualifier. The compiler selects the right one based on whether the object the function is called on is an lvalue or rvalue.

**Combining `const` with ref qualifiers:** `const` and the ref qualifier stack. `void get() const &` is a function that runs on `const` lvalues (and non-const lvalues, by the usual `const` rule). `void get() const &&` runs on `const` rvalues. The order is always: `const` first, ref qualifier after.

```cpp
class Buffer {
    int m_data{ 0 };
public:
    const int& value() const & {
        return m_data;         // safe to return a reference — object persists
    }

    int value() && {
        return m_data;         // return by value — object is temporary, a reference would dangle
    }
};
```

This is the primary real-world motivation for ref qualifiers: preventing a reference to a member from outliving a temporary. If `Buffer{}` is a temporary and you called `Buffer{}.value()`, returning a `const int&` would give you a dangling reference to a destroyed object. The `&&`-qualified overload returns by value instead, which is safe.

**What happens with no ref qualifier?** A member function with no ref qualifier can be called on both lvalues and rvalues — it is the default before this feature was needed. Adding a ref-qualified overload alongside an unqualified one is a compile error; you must either qualify both or qualify neither.

## Common mistakes

**Forgetting that `const` and `&&` stack in a specific order.** Writing `void f() && const` is a syntax error; the correct order is `void f() const &&`. Similarly, `void f() const` is unrelated to ref qualifiers — it qualifies `this` as `const`, not as lvalue-or-rvalue.

**Returning a reference from a `&&`-qualified overload.** The whole reason to write a `&&`-qualified overload is often to handle temporaries safely. Returning `const T&` from a `&&` overload is dangerous:

```cpp
class Temp {
    int m_val{ 5 };
public:
    const int& get() && {
        return m_val;  // DANGER: m_val lives in a temporary that is about to be destroyed
    }
};

const int& r = Temp{}.get();  // r is now a dangling reference
```

The fix is to return by value from `&&`-qualified overloads.

**Mixing qualified and unqualified overloads.** Once you write one overload with a ref qualifier, the compiler expects consistency. Providing `void f() &` but not `void f() &&` means rvalue objects cannot call `f` at all (a compile error), which is usually not what you intended. Either provide both, or provide neither.

## When to use this

Ref qualifiers are most useful in library-grade code where you want to prevent dangling references and enable move-friendly optimizations. A getter that returns a reference to an internal member is the canonical case: return `const T&` for lvalue objects (safe — the object lives), return `T` by value for rvalue objects (safe — the temporary is about to die).

In application-level code, ref qualifiers appear less often. If you find yourself writing a member function and wondering whether it will be called on a temporary, that is the signal to consider a `&&` overload. For most learner exercises and everyday utility classes, a single `const &`-qualified or unqualified getter is sufficient.
