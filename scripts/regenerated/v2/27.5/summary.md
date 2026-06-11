## The idea

You already know that exceptions can be objects of any type, and that the standard library throws objects derived from `std::exception`. This lesson shows two powerful patterns: first, deriving your own exception classes from `std::exception` (or its children) to carry domain-specific information; second, understanding how catch-clause matching interacts with inheritance — a catch for a base class will catch derived exceptions, and this can catch you off guard.

Think of the exception hierarchy as a family tree. A `catch (const std::exception& e)` is like calling out for any family member. A `catch (const std::runtime_error& e)` answers only to a specific branch. When you derive your own class from `std::runtime_error`, it becomes a new leaf on that branch, automatically caught by all its ancestors.

## How it works

**Deriving a custom exception class.**

```cpp
#include <iostream>
#include <stdexcept>
#include <string>

class DatabaseError : public std::runtime_error {
public:
    int error_code;

    DatabaseError(const std::string& msg, int code)
        : std::runtime_error(msg), error_code(code) {}
};

void query(bool fail) {
    if (fail)
        throw DatabaseError("connection refused", 1045);
}

int main() {
    try {
        query(true);
    } catch (const DatabaseError& e) {
        std::cout << "DB error " << e.error_code
                  << ": " << e.what() << "\n";
    }
    return 0;
}
```

`DatabaseError` inherits `what()` from `std::runtime_error`, and adds its own `error_code` field. Callers that only care about the message can catch `const std::runtime_error&` and use `what()`. Callers that need the code catch `const DatabaseError&` and read `error_code`.

**Inheritance and catch ordering — the critical rule.**

Because `DatabaseError` derives from `std::runtime_error`, which derives from `std::exception`, a catch for any ancestor will match:

```cpp
try {
    throw DatabaseError("disk full", 28);
} catch (const std::exception& e) {
    std::cout << "exception: " << e.what() << "\n";
}
// Output: exception: disk full
```

This is useful — one catch at the top level catches everything. But it leads to the most common mistake: ordering derived catches after base catches.

```cpp
try {
    throw DatabaseError("disk full", 28);
} catch (const std::runtime_error& e) {   // matches DatabaseError too!
    std::cout << "runtime\n";             // this one fires
} catch (const DatabaseError& e) {        // NEVER REACHED
    std::cout << "database\n";
}
```

Always list derived exception types before base types.

**Catching by base to handle all library errors uniformly.**

```cpp
#include <iostream>
#include <stdexcept>

int main() {
    try {
        std::string s = "hello";
        s.at(100);   // throws std::out_of_range
    } catch (const std::exception& e) {
        std::cout << "caught std exception: " << e.what() << "\n";
    }
    return 0;
}
```

`std::string::at` throws `std::out_of_range`, which derives from `std::exception`. A single `catch (const std::exception&)` handles it and any other standard exception.

## Common mistakes

**Mistake 1 — catching derived before — wait, catching BASE before derived.**

```cpp
try {
    throw DatabaseError("oops", 99);
} catch (const std::exception& e) {      // catches DatabaseError because it IS a std::exception
    std::cout << "generic: " << e.what() << "\n"; // wrong handler fires
} catch (const DatabaseError& e) {       // dead code
    std::cout << "specific code: " << e.error_code << "\n";
}
```

The derived catch never runs. Reverse the order: `DatabaseError` first, then `std::exception`.

**Mistake 2 — slicing a caught exception.**

```cpp
try {
    throw DatabaseError("fail", 5);
} catch (std::exception e) {    // catches BY VALUE — slices!
    // e is a std::exception, the DatabaseError part is gone
    // e.error_code does not exist here
    std::cout << e.what() << "\n"; // OK, but error_code lost
}
```

Catching by value copies only the base portion. The derived data (like `error_code`) is sliced away. Always catch by `const` reference.

**Mistake 3 — forgetting to call the base constructor with the message.**

```cpp
class MyError : public std::runtime_error {
public:
    MyError(const std::string& msg)
        : std::runtime_error("") {}  // BUG: empty string — msg is ignored!
};
```

`std::runtime_error` stores the message in its constructor. If you forget to pass `msg` to the base constructor, `what()` returns an empty string. Always forward the message: `: std::runtime_error(msg)`.

## When to use this

Derive custom exception classes when you need to carry domain-specific data beyond a text message (error codes, file names, line numbers, request IDs). Derive from the most specific applicable standard base — `std::runtime_error` for runtime conditions, `std::logic_error` for programmer mistakes, `std::out_of_range` when you want callers to recognize a range violation specifically.

When writing library code, your own exception hierarchy makes it easy for callers to catch all your library's errors with a single base-class catch, or to handle specific error types individually — the same flexibility the standard library gives you with `std::exception`.
