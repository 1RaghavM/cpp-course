## The idea

You have seen that a base-class pointer or reference can refer to a derived object, and virtual dispatch still calls the correct overridden function. The key word there is "pointer or reference." When you copy a derived object into a base-class variable by value, something different and dangerous happens: only the base-class portion of the object is copied. The derived-class members simply vanish. This is called object slicing.

The mental image is literal: imagine a derived object as a tall layer cake — the base class is the bottom tier and the derived class adds tiers on top. Assigning the cake by value into a base-class variable is like using a cheese wire to slice off everything above the bottom tier and discard it. The original cake is unchanged, but the copy is missing all the extra layers.

Slicing is a silent bug. The code compiles, there are no warnings by default, and the program runs — it just runs with less data than you intended, and virtual dispatch no longer works on the sliced copy because the object is now genuinely a base-class instance.

## How it works

The fundamental example:

```cpp
#include <iostream>

class Animal {
public:
    virtual std::string name() const { return "Animal"; }
};

class Dog : public Animal {
public:
    std::string name() const override { return "Dog"; }
};

int main() {
    Dog d;
    Animal a = d;            // slicing happens here
    std::cout << a.name() << "\n";  // prints "Animal", not "Dog"
}
```

`a` is a genuine `Animal` object. It was copy-constructed from `d`, but only the `Animal` portion of `d` was copied into `a`. The vtable pointer in `a` points to `Animal`'s vtable, not `Dog`'s. Virtual dispatch on `a` calls `Animal::name()`.

The same problem hits function parameters. Because the parameter type is `Animal` (a value), the compiler invokes `Animal`'s copy constructor at the call site, which only copies the `Animal` sub-object of the `Dog`:

```cpp
void print(Animal a) {               // pass by value — slices
    std::cout << a.name() << "\n";
}

int main() {
    Dog d;
    print(d);   // prints "Animal"
}
```

Containers are equally affected. A `std::vector<Animal>` stores `Animal` values. When you `push_back` a `Dog`, the vector stores a copy of the `Animal` portion only:

```cpp
std::vector<Animal> animals;
Dog d;
animals.push_back(d);               // slices d into an Animal
std::cout << animals[0].name();     // "Animal"
```

No warning appears in any of these cases. The compiler is doing exactly what you asked — constructing or copying an `Animal`.

The fix for all three cases is the same: use pointers or references instead of values. A reference binds to the original object without copying it; a pointer stores the address of the original object. Both preserve the runtime type and the vtable pointer:

```cpp
void print(const Animal& a) {        // reference — no slicing
    std::cout << a.name() << "\n";
}

std::vector<Animal*> animals;       // pointer — no slicing
```

For containers, `std::vector<Animal*>` preserves runtime types as long as the pointed-to objects outlive the vector. If you need ownership semantics, `std::vector<std::unique_ptr<Animal>>` is the standard approach (unique_ptr is from chapter 22).

## Common mistakes

**Mistake 1: Passing polymorphic objects by value to a function.**

```cpp
void describe(Animal a) { std::cout << a.name() << "\n"; }
Dog d;
describe(d);   // prints "Animal" — silently sliced
```

The fix is to make the parameter `const Animal&` or `Animal*`. Passing by value is almost never what you want for a polymorphic hierarchy. A compiler set to warn about potentially sliced copies (`-Wno-sliced`) will catch this, but the default warning level is silent.

**Mistake 2: Assigning to a base-class variable instead of a base-class pointer.**

```cpp
Animal a;
Dog d;
a = d;   // slicing: a.name() == "Animal"
```

This looks like a harmless assignment but discards the derived portion. If you need polymorphism, store a pointer or reference to `d`, never a copy.

**Mistake 3: Storing derived objects in a vector of base objects.**

```cpp
std::vector<Animal> zoo;
zoo.push_back(Dog{});   // each Dog becomes an Animal on insertion
```

Every element in `zoo` is literally an `Animal`; the `Dog` data is gone. Use `std::vector<Animal*>` or smart pointers to preserve the runtime type.

## When to use this

Object slicing is generally something to avoid, not something to use deliberately. The lessons that matter here are defensive:

- Always accept polymorphic base classes by reference (`const Base&`) in function parameters, never by value.
- Never store a heterogeneous polymorphic collection in a `std::vector<Base>`. Use pointers or smart pointers.
- If you want to copy a derived object through a base-class reference without slicing, add a virtual `clone()` function that returns a heap-allocated copy of the correct derived type. For example: `virtual Animal* clone() const { return new Dog(*this); }` in `Dog`.

Slicing becomes especially painful in algorithms that accept containers by value or functions templated on a base type. Any time you see a polymorphic object being passed somewhere, ask whether the receiver is taking it by value, by reference, or by pointer. Value means slicing; reference or pointer means safe.

In the rare case where slicing is intentional — you genuinely want just the base portion, for example logging only the base-class fields — document it clearly, because every code reviewer will assume it is a bug.
