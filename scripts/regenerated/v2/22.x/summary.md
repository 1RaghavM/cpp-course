## The idea

Chapter 22 addressed a fundamental tension in C++: raw pointers give you full control over heap memory but demand that you manage every allocation and deallocation by hand. One forgotten `delete`, one early return, one thrown exception — and you leak or double-free. The chapter introduced two related solutions: **move semantics**, which lets you transfer ownership of resources without copying them, and **smart pointers**, which automate the delete at the point of ownership transfer.

The central insight is that most ownership problems dissolve when you make the type system track who owns what. A `unique_ptr<T>` is a type-level promise that exactly one object owns this resource. A `shared_ptr<T>` is a type-level promise that ownership is shared and deletion happens when the last owner leaves. `weak_ptr<T>` is a type-level "I observe but do not own." Encoding ownership in types turns a runtime error (use-after-free, double-free) into a compile-time error.

## How it works

The concepts build in a deliberate order.

**Rvalue references** (`T&&`) let you distinguish temporaries from named objects. A function that accepts `T&&` can steal the resource because the caller has signalled "I am done with this." Without this distinction, the compiler would always copy.

**Move constructors and move assignment operators** are the implementations that do the stealing. A move constructor takes `T&&`, pilfers the internal pointer, and nulls the donor. A well-written move constructor is marked `noexcept` so that standard containers can use it during reallocation.

**`std::move`** is not a move — it is a cast to `T&&`. It tells overload resolution to prefer the move path. Use it on named variables you are done with; avoid it on return expressions of local variables (let NRVO handle those).

**`std::unique_ptr<T>`** wraps a raw pointer with single-ownership semantics. It is zero-overhead: same size as a pointer, destructor inlined. `std::make_unique<T>(args)` is the canonical way to construct one — it keeps allocation and initialization together and is exception-safe. Moving a `unique_ptr` transfers ownership; copying is deleted.

**`std::shared_ptr<T>`** tracks shared ownership via a reference count in a separate control block. The managed object is deleted when the last `shared_ptr` destructs. `std::make_shared<T>(args)` is preferred because it combines the object allocation and the control block into one heap block. Copying increments the count (atomic operation); moving transfers without incrementing.

**`std::weak_ptr<T>`** observes a `shared_ptr`-managed object without holding a counted reference. `.lock()` produces a `shared_ptr` if the object is still alive, or null otherwise. Its primary use is breaking reference cycles: when two objects would otherwise hold `shared_ptr`s to each other, the back-pointer is made a `weak_ptr`.

## Common mistakes

**Mixing raw and smart pointer ownership** is the most destructive mistake in this chapter. Constructing two independent `shared_ptr`s from the same raw pointer, or manually deleting a pointer that a smart pointer already owns, results in double-free. The rule: once you hand a raw pointer to a smart pointer, never use the raw pointer for ownership again.

**Forgetting to null the donor in a move constructor** is the move-semantics equivalent. If the move constructor does not set `other.data = nullptr`, both the original and the moved-to object call `delete` on the same address when they destruct.

**Using a moved-from object** is a logic error that the compiler does not always catch. After `std::move(x)` and a subsequent move construction or assignment, `x` is in a valid but empty state. Treat it as destroyed.

**Reference cycles with shared_ptr** are silent leaks. Two objects that hold `shared_ptr`s to each other never have their reference counts reach zero. Every back-pointer in a bidirectional structure must be a `weak_ptr`.

## When to use this

The practical decision tree:

- You need heap allocation and there is one clear owner: use `std::unique_ptr`. Return it from factory functions, store it in class members, pass it by value with `std::move`. Never write raw `new` in new code.
- You need shared ownership that is not knowable at compile time: use `std::shared_ptr`. Accept the reference-count overhead as the cost of the safety guarantee.
- You have a back-pointer or cache observer in a shared-ownership graph: use `std::weak_ptr`. Always check `.lock()` before dereferencing.
- You are implementing a data structure that manages memory directly (a custom allocator, a pool): write proper move constructors and move assignment operators following the rule of five. Mark move operations `noexcept`.
- You see `new` and `delete` in application code that is not a low-level library: replace them with smart pointers.

The goal of this chapter is a codebase where `delete` never appears outside of custom data structures, ownership is always expressed in types, and moving large objects (strings, vectors, class instances) is as cheap as swapping two pointers.
