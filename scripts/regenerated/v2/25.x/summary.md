## The idea

Chapter 25 is about runtime polymorphism — the ability to write code that operates on base-class pointers or references and automatically calls the right function for whatever derived type is actually there. This works because of the virtual dispatch mechanism: a hidden pointer inside each object points to a vtable that maps each virtual function to the correct implementation for that object's actual type.

The chapter builds a complete picture: how polymorphism works, what its costs are, and a set of tools and pitfalls that every C++ programmer who works with hierarchies needs to know.

## How it works

The core lessons of the chapter, summarized:

**Virtual functions and polymorphism (25.2):** Prefix a member function with `virtual` in the base class. Derived classes override it. Any call through a base-class pointer or reference dispatches to the most-derived override at runtime.

**override and final (25.3):** Use `override` on every derived override to get a compile error if the signature drifts. Use `final` to prevent further overriding or inheritance.

**Virtual destructors (25.4):** Any class intended to be used polymorphically — where you might `delete` a base pointer — must have a virtual destructor. Without it, deleting a derived object through a base pointer calls only the base destructor, leaking the derived portion.

**Early and late binding (25.5):** Non-virtual calls are resolved at compile time (early binding). Virtual calls are resolved at runtime via the vtable (late binding). Late binding has a small but real cost: two pointer dereferences plus an indirect jump.

**The vtable (25.6):** Each polymorphic class has one vtable — a static array of function pointers. Each object has a vptr pointing at its class's vtable. The vtable is shared; only the vptr is per-object.

**Pure virtual functions and abstract classes (25.7):** Mark a function `= 0` to make it pure virtual. The class becomes abstract and cannot be instantiated. Derived classes must implement every pure virtual function to become concrete. An interface class has only pure virtual functions and a virtual destructor.

**Virtual base classes (25.8):** In diamond inheritance (`A → B, A → C, B+C → D`), mark the middle inheritance `virtual` on `B` and `C` to share one `A` sub-object. The most-derived class must explicitly initialize the virtual base.

**Object slicing (25.9):** Copying a derived object into a base-class value discards the derived portion silently. Always use references or pointers for polymorphic parameters and containers.

**Dynamic casting (25.10):** `dynamic_cast<Derived*>(base_ptr)` performs a runtime type check. It returns `nullptr` on failure (pointer form) or throws `std::bad_cast` (reference form). Only works on polymorphic classes. Use it sparingly; prefer virtual functions when possible.

**Printing through operator<< (25.11):** A non-member `operator<<` cannot be virtual. The pattern is: define one `operator<<` in the base that calls a virtual `print` member function. Derived classes override `print`. The operator handles the whole hierarchy.

## Common mistakes

**Calling a virtual function in a constructor or destructor.** During base construction and destruction, the vtable pointer is set to the base class's vtable, not the most-derived class's. A virtual call in a constructor dispatches to the base version, not the override — often a surprise. The rule is: do not rely on virtual dispatch inside constructors or destructors.

**Forgetting a virtual destructor when deleting through a base pointer.** This is undefined behavior in C++ and commonly causes memory leaks or crashes. Any base class that is to be deleted polymorphically needs `virtual ~Base() = default;`. A good default: if a class has any virtual function at all, give it a virtual destructor.

**Treating slicing as a copy.** Assigning a derived object to a base-class value looks like a copy but loses all derived data and resets the vtable. Store polymorphic objects through pointers or references, not values. The compiler gives no warning for slicing by default, so the bug is silent.

**Wrong signature in an override.** If a derived class omits `const` or changes a parameter type, the function does not override anything — it creates a new overload that hides the base's virtual function. Calling through a base pointer then calls the base version instead. Always use `override` to have the compiler catch this immediately.

## When to use this

Runtime polymorphism is the right tool when you need to write code that works uniformly across a family of related types whose behavior varies, and when the specific type is not known until runtime. It is the foundation of plugin systems, game entity hierarchies, document models, and many other designs.

When the set of types is fixed and known at compile time, templates (chapter 26) often give the same flexibility with no runtime cost. When a hierarchy becomes complicated with many `dynamic_cast` chains or diamond patterns, consider whether composition or a redesign with interface classes would be cleaner. The tools in this chapter are powerful; use them where they genuinely simplify the design.
