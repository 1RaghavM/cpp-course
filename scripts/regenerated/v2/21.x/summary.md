## The idea

Chapter 21 covered operator overloading — the mechanism that lets user-defined types participate in C++ expressions using the same syntax as built-in types. Instead of writing `add(a, b)` you can write `a + b`; instead of `print(os, obj)` you can write `os << obj`. Operator overloading does not add new capability to the language — it is syntactic sugar that makes class-based abstractions feel natural and consistent with the rest of C++. The entire chapter builds one central skill: recognizing when overloading an operator makes an abstraction clearer, and knowing which implementation form to choose.

This lesson recaps each technique, ties them together, and flags the questions that often come up in review.

## How it works

**Three implementation forms, and when to use each:**

Every overloaded operator can be written in one of three ways.

- Member function: the left operand is `*this`. Use for operators that naturally modify the object (`operator=`, `operator+=`, `operator[]`, `operator()`, `operator++`, typecast operators). The rule of thumb: if the operator needs access to private members of the *left* operand only, make it a member.

- Friend function: declared inside the class but defined outside; can access private members of both operands. Use for binary arithmetic operators (`operator+`, `operator-`, `operator*`) when you want symmetric behavior — both operands are treated equally, and implicit conversions apply to both sides.

- Normal non-member function: uses only the public interface. Use when the operator does not need private access and you want to keep the class header clean.

**Key operators and their canonical forms:**

`operator+`, `operator-`, `operator*`, `operator/` — friend or non-member functions; return by value; never modify the operands.

`operator+=`, `operator-=` — member functions; modify `*this` in place; return `*this` by reference.

`operator<<`, `operator>>` — non-member or friend functions; take `std::ostream&` or `std::istream&` as the first argument; return that stream reference for chaining.

`operator==`, `operator!=`, `operator<`, `operator>` — friend or non-member; return `bool`; define all four or use `operator==` and `operator<` to derive the rest.

`operator++` (prefix) — member; returns `*this&` after incrementing. `operator++` (postfix) — member; takes a dummy `int` parameter; increments `*this`, returns the old value by value.

`operator[]` — member; typically provide both a const and a non-const overload; returns a reference to the element.

`operator()` — member; can take any parameters; turns the object into a *functor* (callable object).

Typecast operators (`operator double()`, `operator bool()`) — member; no return type in the declaration; prefer `explicit` to avoid implicit conversions.

`operator=` — member; returns `*this&`; include a self-assignment guard; if the class owns a resource, implement the full Rule of Three (destructor + copy constructor + copy assignment).

**Shallow vs. deep copy in context:**

If a class owns heap memory, the compiler-generated copy operations perform shallow copy — they copy the pointer address, not the data. Both copies end up pointing at the same memory. When one is destroyed, the other holds a dangling pointer. Writing a custom copy constructor and `operator=` that allocate a new buffer and copy the contents is called deep copy. The Rule of Three states: if you need a custom destructor, you almost certainly need a custom copy constructor and copy assignment too.

**Operators in templates:**

A template class's member operators are automatically templated — no extra `template <typename T>` on the operator itself. A function template can freely use any operator on its type parameter; the compiler only checks that the operator exists when the template is instantiated for a specific type, not when it is defined.

## Common mistakes

**Writing `operator+` as a member and then wondering why `1 + myObj` doesn't compile:**

A member `operator+` makes `myObj + 1` work (left is `*this`) but not `1 + myObj` (left must be an `int`). As a friend function both sides are treated as regular arguments, so implicit conversions apply to both, and `1 + myObj` compiles if `1` can convert to the class type.

**Forgetting to return `*this` from `operator=` and `operator+=`:**

Any assignment or compound-assignment operator that returns `void` breaks chained expressions like `a = b = c` or `(a += b) += c`. Always return `ClassName&` and `return *this`.

**Confusing prefix and postfix `operator++`:**

Prefix returns a reference to the incremented object. Postfix saves the old value, increments `*this`, and returns the old value *by value* (not by reference — the old value is a local). Returning a reference to the local from postfix is undefined behavior.

## When to use this

Use operator overloading when the operator's meaning for your type is obvious to any reader and consistent with how the same symbol behaves on built-in types. Overloading `operator+` on a `Vector2D` to mean component-wise addition is appropriate; overloading it on a `Logger` to mean "append log entry" is surprising and should be a named function instead. When in doubt, prefer a named function. Operator overloading is a tool for improving readability, not for showing off — restrain it to the cases where it genuinely makes expressions cleaner.
