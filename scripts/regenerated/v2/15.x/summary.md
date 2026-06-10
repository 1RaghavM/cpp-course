## The idea

Chapter 15 is titled "More on Classes" and that title is accurate: every lesson in this chapter took one mechanism from the chapter-14 foundation and went one level deeper. You saw how `this` is a hidden pointer in every non-static member function and how to expose it deliberately for method chaining. You saw how to split a class across a header and a source file. You added nested types, destructors, class templates, static members, friend declarations, and finally ref qualifiers. This lesson ties those threads together so you leave chapter 15 with a coherent picture of what a class can contain.

Think of the chapter as a systematic expansion of the class toolbox: each lesson answered the question "what else can I put inside a class?"

## How it works

**The hidden `this` pointer and method chaining.** Every non-static member function receives the object it was called on as a hidden pointer named `this`. You rarely need to name it, but it becomes useful when you want to return `*this` from a mutating method so the caller can chain calls:

```cpp
class Counter {
    int m_count{ 0 };
public:
    Counter& increment() { ++m_count; return *this; }
    Counter& add(int n)  { m_count += n; return *this; }
    int get() const { return m_count; }
};
// counter.increment().add(3).increment() is valid
```

Returning `*this` by reference lets the next method call operate on the same object. If you return by value instead you operate on a copy.

**Static members.** A static data member belongs to the class, not to any individual object. Every instance shares the same variable. A static member function has no `this` pointer and can be called on the class name directly without an object. Static data members (that are not `constexpr`) must be defined outside the class body in exactly one translation unit.

**Nested types.** A type (enum, struct, or class) defined inside another class is a nested type. It is scoped to the outer class — you access it as `Outer::Inner`. Nested types communicate that `Inner` is an implementation detail of `Outer` and should not be used in isolation.

**Destructors.** The destructor (`~ClassName()`) runs automatically when an object's lifetime ends. It is the cleanup counterpart to the constructor. For objects with only plain data members the compiler-generated destructor is correct. Write a custom one only when the class directly owns a resource — a file handle, a lock — that must be released when the object is destroyed.

**Class templates.** `template <typename T> class Box { ... };` parameterizes the entire class on a type. `Box<int>` and `Box<double>` are distinct classes generated from the same definition. All template definitions must be visible at the point of instantiation — put them in headers, not in separate `.cpp` files.

**Friend declarations.** A `friend` declaration grants a specific non-member function or another class access to private members without making them public. Use `friend` sparingly and prefer returning access via a public accessor when that is cleaner.

**Ref qualifiers.** A member function can be marked `&` (callable on lvalues only) or `&&` (callable on rvalue temporaries only). This lets you distinguish between long-lived objects and temporaries, usually to prevent callers from storing a dangling reference to a member of a temporary.

## Common mistakes

**Mistake 1: Forgetting that static data members need an out-of-class definition.**

```cpp
class Counter {
    static int s_count;   // declaration only — not defined yet
};
// Missing: int Counter::s_count = 0;
// Linker error: undefined symbol Counter::s_count
```

The class body is a declaration. The actual storage is created by the definition outside the class. `constexpr static` members initialized in the class body are the one exception — they do not need a separate definition for most uses.

**Mistake 2: Calling a custom destructor explicitly.**

```cpp
Widget w;
w.~Widget();   // runs the destructor now
// ... scope ends — destructor runs again — double destruction
```

When the object goes out of scope the destructor runs a second time. For a class that releases a resource this means releasing it twice — undefined behavior. Destructors are always called by the compiler; never call them directly in application code.

**Mistake 3: Returning `this` by value in a method intended for chaining.**

```cpp
Counter increment() { ++m_count; return *this; }  // returns a copy
counter.increment().add(3);  // add(3) acts on the copy, counter is unchanged
```

To chain mutations on the same object, return `Counter&` (a reference to `*this`), not `Counter` (a copy). The copy is constructed, mutated, and then discarded.

## When to use this

The mechanisms in chapter 15 cover the full anatomy of a class in standard C++. Static members are for class-level state or factory functions. Nested types are for types that only make sense as part of the outer class. Destructors are for deterministic resource cleanup. Class templates are for type-generic utilities. Friend declarations are a narrow escape hatch when non-member functions need private access. Ref qualifiers are for library-quality APIs that need to distinguish lvalue and rvalue object contexts. When building application code you will use static members and class templates regularly, destructors whenever you manage a resource, and friend/ref qualifiers rarely. Chapter 16 moves on to dynamic arrays, where the destructor and copy-constructor patterns from chapters 14–15 become essential.
