## The idea

Every name you write in a C++ program lives inside some namespace. `std::cout`, `std::cin`, and `std::string` all belong to the `std` namespace; the scope resolution operator `::` is the explicit path to them. Writing `std::` dozens of times in a short program is tedious, and C++ gives you two tools to reduce that typing: a **using declaration** and a **using directive**.

A **using declaration** introduces one specific name from a namespace into the current scope so you can use it without the prefix. Think of it like inviting one person into the room — only that individual enters, no one else.

A **using directive** introduces *every* name from a namespace into the current scope at once. This is like opening the door and inviting the whole crowd in. Convenient when there are only a few people, risky when there are hundreds.

Understanding which one to use — and when to avoid both — is the real lesson here. These tools interact with the scope and linkage rules you have built up throughout chapter 7, so it is worth being precise about what they actually do.

## How it works

**Using declarations** have the form `using namespace_name::name;`. After that line, `name` alone refers to `namespace_name::name` in the current scope.

```cpp
#include <iostream>

int main() {
    using std::cout;
    using std::endl;

    cout << "Hello" << endl;   // no std:: needed
    return 0;
}
```

Only `cout` and `endl` were brought in. If you try to write `cin >> x` in the same function without a `using std::cin;` declaration, the compiler still requires `std::cin`.

**Using directives** have the form `using namespace namespace_name;`. They make all names in the namespace available without qualification.

```cpp
#include <iostream>

int main() {
    using namespace std;

    cout << "Hello" << endl;
    cin.ignore();              // works too — everything is in
    return 0;
}
```

The convenience is obvious. The hidden cost is also obvious once you know what can go wrong (see the next section).

**Scope matters.** Both forms respect normal scope rules. A using declaration or directive placed inside a block (a function, an if-body, a nested block) only applies within that block, not outside it.

```cpp
#include <iostream>

void greet() {
    using std::cout;   // applies only inside greet()
    cout << "Hi\n";
}

int main() {
    greet();
    // cout here is unknown — the using declaration is out of scope
    std::cout << "Done\n";
    return 0;
}
```

Placing them at function scope rather than file scope is a safety habit: the imported names cannot bleed into other translation units.

## Common mistakes

**Mistake 1: `using namespace std;` at file scope in a header.**

The most widespread bad habit in beginner C++ is writing `using namespace std;` at the top of a file, or worse, in a header file. In a header, every file that includes it silently inherits the entire `std` namespace. If two of those names happen to collide with names in another namespace, you get ambiguous-call errors that are extremely hard to trace back to their source. Even in a `.cpp` file, putting it at file scope means the entire file is affected, not just the function that needs it.

```cpp
// bad_header.h
using namespace std;    // WRONG: pollutes every file that includes this
#include <string>
```

**Mistake 2: a using declaration shadowing a local name.**

A using declaration introduces a name into the scope. If a name already exists in that scope, you get a redefinition error rather than shadowing — the compiler treats it as a clash, not a choice.

```cpp
#include <iostream>

int main() {
    int cout = 5;           // local variable named cout
    using std::cout;        // ERROR: redefinition — cout already exists here
    return 0;
}
```

**Mistake 3: assuming `using namespace` is permanent.**

Learners sometimes add `using namespace std;` at the top of `main()` and then wonder why a name inside a nested block is still unknown. The rule is that a `using namespace` directive brings names into the current scope's **lookup pool**, not into nested scopes as declarations — but names found there are still accessible from nested scopes through the normal lookup chain. Conversely, the directive has no effect outside the scope where it appears.

```cpp
#include <iostream>

int main() {
    {
        using namespace std;
        cout << "inside\n";   // OK
    }
    cout << "outside\n";      // ERROR: cout not found — directive was in the inner block
    return 0;
}
```

## When to use this

Use a **using declaration** inside a function body when you call the same long-qualified name many times and the scope is small enough that the introduced name cannot conflict with anything. `using std::cout;` at the top of `main` is the canonical example.

Use a **using directive** only in small, self-contained `.cpp` files where you control all the names and the file is short. Never put `using namespace` in a header — that is a firm rule, not a guideline.

In production C++ code, the most common pattern is no `using` at all in headers and fully qualified names (`std::`) or targeted using declarations in `.cpp` files. As you learn to work across multiple files (introduced in earlier lessons on internal and external linkage), the discipline of keeping namespaces explicit pays off with compiler errors that actually point at the real problem.
