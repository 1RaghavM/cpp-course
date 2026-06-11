## The idea

In previous lessons you saw that a class can inherit from multiple base classes. Consider a classic layout: `PoweredDevice` is a base class, both `Scanner` and `Printer` inherit from it, and then `Copier` inherits from both `Scanner` and `Printer`. This is the "diamond problem." Without special handling, `Copier` ends up with two separate copies of `PoweredDevice` — one tucked inside `Scanner` and one tucked inside `Printer`. A `Copier` object contains two `PoweredDevice` sub-objects, which means two copies of every data member in `PoweredDevice`, and accessing those members becomes ambiguous.

Virtual inheritance solves this by telling the compiler "even if this class is inherited from multiple times in the hierarchy, include only one shared copy of me." When a base class is declared with the `virtual` keyword in the inheritance list, all paths through the hierarchy share the same single sub-object of that base.

The keyword here is the same `virtual` used for virtual functions, but the context is completely different: this is `virtual` in an inheritance declaration (`class Derived : virtual public Base`), not in a member-function declaration.

## How it works

Without virtual inheritance the diamond creates two copies:

```cpp
#include <iostream>

struct PoweredDevice {
    int power_;
    PoweredDevice(int p) : power_(p) {}
};

struct Scanner : public PoweredDevice {
    Scanner(int p) : PoweredDevice(p) {}
};

struct Printer : public PoweredDevice {
    Printer(int p) : PoweredDevice(p) {}
};

struct Copier : public Scanner, public Printer {
    Copier(int p) : Scanner(p), Printer(p) {}
};

int main() {
    Copier c{100};
    // c.power_ is ambiguous — which copy?
}
```

`c.power_` is a compile error because the name is ambiguous between `Scanner::PoweredDevice::power_` and `Printer::PoweredDevice::power_`.

Adding `virtual` to the intermediate classes fixes it:

```cpp
struct Scanner : virtual public PoweredDevice {
    Scanner(int p) : PoweredDevice(p) {}
};

struct Printer : virtual public PoweredDevice {
    Printer(int p) : PoweredDevice(p) {}
};

struct Copier : public Scanner, public Printer {
    Copier(int p) : Scanner(p), Printer(p), PoweredDevice(p) {}
};
```

Now `Copier` contains exactly one `PoweredDevice` sub-object shared between both paths. `c.power_` is unambiguous.

There is a rule you must follow: **the most-derived class is responsible for constructing the virtual base.** In the example above, `Copier` must call `PoweredDevice(p)` directly in its initializer list even though `Scanner` and `Printer` also call it in their own constructors. When `Copier` is being constructed, the calls to `PoweredDevice(p)` inside `Scanner`'s and `Printer`'s constructors are silently ignored; only `Copier`'s direct call is used. If `Copier` does not explicitly initialize `PoweredDevice`, the default constructor is used, which causes a compile error if `PoweredDevice` has no default constructor.

```cpp
#include <iostream>

struct PoweredDevice {
    int power_;
    PoweredDevice(int p) : power_(p) {
        std::cout << "PoweredDevice(" << p << ")\n";
    }
};

struct Scanner : virtual public PoweredDevice {
    Scanner(int p) : PoweredDevice(p) {
        std::cout << "Scanner\n";
    }
};

struct Printer : virtual public PoweredDevice {
    Printer(int p) : PoweredDevice(p) {
        std::cout << "Printer\n";
    }
};

struct Copier : public Scanner, public Printer {
    Copier(int p) : PoweredDevice(p), Scanner(p), Printer(p) {
        std::cout << "Copier\n";
    }
};

int main() {
    Copier c{5};
    std::cout << c.power_ << "\n";
}
```

Output:
```
PoweredDevice(5)
Scanner
Printer
Copier
5
```

`PoweredDevice` is constructed exactly once despite two paths leading to it.

## Common mistakes

**Mistake 1: Forgetting to initialize the virtual base in the most-derived constructor.**

```cpp
struct Copier : public Scanner, public Printer {
    Copier(int p) : Scanner(p), Printer(p) {}  // PoweredDevice not initialized
};
```

If `PoweredDevice` has no default constructor, this is a compile error. Even if there is a default constructor, the virtual base will be default-constructed rather than initialized with `p`, which is almost never what you want.

**Mistake 2: Applying `virtual` to the wrong level of the hierarchy.**

Virtual inheritance must be declared in the classes that directly inherit from the shared base — `Scanner` and `Printer` — not in `Copier`. Putting `virtual` only in `Copier` does nothing useful because `Copier` does not inherit `PoweredDevice` directly.

**Mistake 3: Expecting regular (non-virtual) inheritance to deduplicate the base.**

Without `virtual` in both intermediate classes, you always get two copies, regardless of what `Copier` does. Both `Scanner` and `Printer` must use `virtual` inheritance from `PoweredDevice`.

## When to use this

Virtual inheritance is the correct tool when a diamond inheritance pattern genuinely represents your domain — for example, a `FlyingFish` that is both a `Bird` and a `Fish`, each of which is an `Animal`. Without virtual inheritance, `FlyingFish` would have two `Animal` sub-objects.

In practice, diamond inheritance is a signal that the design may need rethinking. Many experienced C++ programmers prefer to break up such hierarchies using composition or multiple interface classes (pure virtual only, no data) rather than reaching for virtual inheritance. Interface classes have no data, so a diamond of interfaces creates no duplication problem. Virtual inheritance adds overhead — each virtual base requires an extra pointer in each sub-object, and construction order becomes more complex.

Use virtual inheritance when you must model a true diamond with shared state in the common base, when refactoring the hierarchy is not practical, and when you are prepared to follow the "most-derived class constructs the virtual base" rule correctly.
