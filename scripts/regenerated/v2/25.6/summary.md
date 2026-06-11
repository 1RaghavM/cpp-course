## The idea

You have been using virtual functions and seeing that they dispatch to the correct override at runtime. The mechanism that makes this possible is called the virtual table (vtable). Understanding the vtable gives you a concrete mental model for how virtual dispatch works, what its cost is, and what limitations apply.

Every class that has at least one virtual function gets a vtable: a static array of function pointers, one per virtual function in the class. Each instance of such a class contains a hidden pointer — the vptr — pointing to its class's vtable. When you call a virtual function through a pointer or reference, the runtime follows the vptr to the vtable and jumps through the appropriate function pointer. It is simply two extra pointer dereferences plus one indirect jump.

## How it works

Consider this hierarchy:

```cpp
class Animal {
public:
    virtual void speak() const;
    virtual void move() const;
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void speak() const override;
    // does not override move()
};
```

The compiler creates two vtables:

- `Animal`'s vtable: `[Animal::speak, Animal::move, Animal::~Animal]`
- `Dog`'s vtable: `[Dog::speak, Animal::move, Dog::~Dog]`

Notice: `Dog` does not override `move()`, so `Dog`'s vtable still holds `Animal::move`. Only the entries for functions that `Dog` overrides are replaced.

Every `Animal` object contains a hidden vptr. When you write:

```cpp
Animal a;
Dog d;
```

Both `a` and `d` have a vptr. `a.vptr` points to `Animal`'s vtable; `d.vptr` points to `Dog`'s vtable. This is set up by the constructor.

When the runtime executes `ptr->speak()` through an `Animal* ptr`:

1. Read `ptr->vptr` to get the address of the vtable.
2. Index into the vtable at the slot for `speak` (slot 0 in this example).
3. Jump to the function pointer stored there.

If `ptr` holds an `Animal`, slot 0 holds `Animal::speak`. If `ptr` holds a `Dog`, slot 0 holds `Dog::speak`. Same index, different table — that is how one piece of code handles many types.

The size impact is real but small:

```cpp
#include <iostream>

class Plain { int x; };
class WithVirtual { int x; virtual void f() {} };

int main() {
    std::cout << sizeof(Plain) << "\n";        // typically 4
    std::cout << sizeof(WithVirtual) << "\n";  // typically 16 (4 int + padding + 8 vptr)
}
```

The vptr adds one pointer-sized field to every instance (8 bytes on 64-bit). The vtable itself is shared — there is only one vtable per class no matter how many objects are created.

Multiple inheritance complicates the picture: an object may have more than one vptr (one per base class that has virtual functions). This is why multiple inheritance with virtual functions has a steeper cost than single inheritance, but the principle is the same.

## Common mistakes

**Mistake 1: Thinking the vtable is per-object.**

The vtable is a static structure shared by all instances of the same class. Only the vptr is stored per object. Creating a million `Dog` objects creates a million vptrs, all pointing to the same `Dog` vtable.

**Mistake 2: Assuming virtual calls are dramatically slower.**

The overhead is typically two pointer dereferences: one to follow vptr to the vtable, one to read the function pointer. On modern CPUs with caches warmed up (which happens in any loop over the same type), this is often just a few nanoseconds extra. The inability to inline is a bigger concern than the raw dispatch cost, and it only matters in extremely hot paths.

**Mistake 3: Expecting the vtable to change after construction.**

The vptr is set once in the constructor of the most-derived class and never changes during the lifetime of the object. You cannot swap an object's vtable at runtime to switch behavior — that would require a different runtime dispatch mechanism entirely.

## When to use this

You do not interact with the vtable directly — C++ manages it automatically. The value of understanding the vtable is in reasoning about performance (one indirect call per virtual dispatch), memory layout (one extra pointer per object), and edge cases (virtual calls in constructors hit the wrong vtable, multiple inheritance adds extra vptrs). When performance profiling shows that virtual dispatch in a tight loop is a bottleneck, the cure is usually to restructure the algorithm to batch objects by type rather than to remove virtual functions, or to use templates for compile-time polymorphism in those paths.
