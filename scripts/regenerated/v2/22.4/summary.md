## The idea

A named variable is an lvalue. By the rules you learned in the rvalue references lesson, passing a named variable to a function always invokes the copy path, even when you know you are done with it and would prefer the move path.

`std::move` solves this problem. It is not a function that moves anything. It is a **cast** — it converts its argument from an lvalue to an rvalue reference. When the compiler sees an rvalue reference, it picks the move constructor or move assignment operator instead of the copy equivalents.

Think of `std::move(x)` as a sticky note you place on a box that says "I'm done with this, feel free to take everything inside." The note does not empty the box — but the person who receives the box now has permission to empty it.

After you call `std::move(x)` and pass the result somewhere, `x` is in a valid but unspecified state. You can reassign it or let it destruct safely; you just cannot rely on it still holding its original value.

## How it works

**Example 1 — std::move on a string: avoiding a copy**

```cpp
#include <iostream>
#include <string>

void store(std::string s) {
    std::cout << "stored: " << s << "\n";
}

int main() {
    std::string text = "Hello, world!";
    store(text);               // copy: text remains valid after the call
    store(std::move(text));    // move: text is now unspecified
    std::cout << "text length after move: " << text.size() << "\n";
    return 0;
}
```

Output (typical):
```
stored: Hello, world!
stored: Hello, world!
text length after move: 0
```

The first call copies the string; the second steals it. After the move, `text` is still a valid `std::string` but its contents are unspecified — often the empty string, but the standard only guarantees a valid state.

**Example 2 — std::move with a unique_ptr**

```cpp
#include <iostream>
#include <memory>

void use(std::unique_ptr<int> p) {
    std::cout << "value: " << *p << "\n";
}

int main() {
    auto ptr = std::make_unique<int>(42);
    use(std::move(ptr));   // transfers ownership into the function
    if (!ptr) {
        std::cout << "ptr is now null\n";
    }
    return 0;
}
```

Output:
```
value: 42
ptr is now null
```

`std::unique_ptr` has no copy constructor — you cannot pass it by value without `std::move`. After the call, `ptr` is null: ownership was transferred into the `use` parameter, which destroys it when the function returns.

**Example 3 — std::move inside a move constructor (delegating to member moves)**

```cpp
#include <string>
#include <iostream>

struct Person {
    std::string name;
    int         age;

    Person(std::string n, int a) : name(std::move(n)), age(a) {}

    Person(Person&& other) noexcept
        : name(std::move(other.name)), age(other.age) {
        other.age = 0;
    }
};

int main() {
    Person alice("Alice", 30);
    Person moved = std::move(alice);
    std::cout << moved.name << " " << moved.age << "\n";
    return 0;
}
```

Output:
```
Alice 30
```

Inside the move constructor, `std::move(other.name)` triggers `std::string`'s own move constructor, stealing the string's internal buffer. Without `std::move(other.name)`, the compiler would copy the string because `other.name` is a named sub-object (an lvalue).

## Common mistakes

**Mistake 1 — calling std::move on a function return value**

```cpp
std::string get_message() {
    std::string msg = "hello";
    return std::move(msg);   // pessimization: disables NRVO
}
```

The compiler can often apply Named Return Value Optimization (NRVO) and construct the return value directly in the caller's storage, bypassing any copy or move. Writing `std::move(msg)` in a return statement blocks NRVO, forcing a move where zero-overhead construction would have happened. For local variables returned by value, just write `return msg;`.

**Mistake 2 — reading from a moved-from object**

```cpp
std::string a = "data";
std::string b = std::move(a);
std::cout << a;   // a is valid but unspecified — might print "" or worse
```

The standard guarantees that `a` is in a valid (destructible, assignable) state after the move. It does not guarantee any particular value. Relying on `a` for data after the move is a logic error. Assign a new value before using `a` again.

**Mistake 3 — moving a const object**

```cpp
const std::string msg = "hello";
std::string other = std::move(msg);   // actually copies!
```

`std::move` casts to `const std::string&&`. The move constructor requires a non-const `string&&` — it cannot steal from a const object because that would modify the source. The compiler silently falls back to the copy constructor. No error, just a surprise copy. Do not `std::move` const objects.

## When to use this

Use `std::move` when you are passing a named local variable into a function that accepts by value and you will not use the variable again. Use it inside move constructors and move assignment operators to forward member objects to their own move constructors. Avoid it on return values of local variables — let the compiler use NRVO. Avoid it on const objects — the result is a silent copy.
