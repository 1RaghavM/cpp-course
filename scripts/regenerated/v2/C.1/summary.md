## The idea

You have completed the learncpp.com curriculum. You have gone from not knowing what a variable is to writing templates, managing memory with RAII, throwing and catching exceptions, and reasoning about `noexcept` guarantees. That is a substantial body of knowledge.

But finishing a curriculum and becoming proficient are two different things. This final lesson is about the gap between them — what comes next, where to go from here, and how to keep improving.

## How it works

**What you have actually learned.**

Walking backwards through the curriculum, you now understand:

- **Chapters 1–9** — the language's foundation: types, expressions, control flow, functions, scope, and basic I/O.
- **Chapters 10–12** — type system mechanics: type deduction, function overloads, references, and pointers.
- **Chapters 13–16** — user-defined types: enums, structs, classes, operator overloading, and dynamic arrays.
- **Chapters 17–21** — arrays, strings, the standard library containers, and iterators.
- **Chapters 22–23** — move semantics: rvalue references, the rule of five, `std::move`, and smart pointers.
- **Chapters 24–26** — object-oriented programming: inheritance, virtual functions, and polymorphism.
- **Chapter 27** — exception handling: throw/catch, stack unwinding, RAII, `noexcept`, and `std::move_if_noexcept`.
- **Appendices A–B** — the language's evolution from C++11 through C++23.

Here is a small program that exercises several of these layers together — it is a miniature summary of the kind of C++ you can now write and read fluently:

```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

class Task {
    std::string name_;
public:
    explicit Task(std::string name) : name_(std::move(name)) {}
    void run() const {
        if (name_.empty())
            throw std::invalid_argument("task name cannot be empty");
        std::cout << "running: " << name_ << "\n";
    }
    const std::string& name() const noexcept { return name_; }
};

int main() {
    std::vector<std::unique_ptr<Task>> tasks;
    tasks.push_back(std::make_unique<Task>("compile"));
    tasks.push_back(std::make_unique<Task>("test"));

    for (const auto& t : tasks) {
        try {
            t->run();
        } catch (const std::exception& e) {
            std::cout << "error: " << e.what() << "\n";
        }
    }
    return 0;
}
```

Every line here is something you have learned: classes, move semantics, smart pointers, exceptions, range-based for, const-correctness, `noexcept` annotations. This is idiomatic modern C++.

**The gap between reading and writing.**

Reading correct C++ is easier than writing it. The next step is deliberate practice: take a problem you care about and solve it from scratch using the constructs you have learned. Mistakes you make on your own code teach you more than any lesson — and now you have the vocabulary to look up the fix.

**Productive next steps.**

The following areas build directly on what you have learned and are worth exploring in roughly this order:

- **Build something:** Pick a small project — a command-line tool, a text file processor, a simple game. The concrete decisions force you to practice everything at once.
- **Read the standard library:** Browse `<algorithm>`, `<numeric>`, `<iterator>`, and `<filesystem>`. These headers extend what you can do without writing it yourself.
- **Study the C++ Core Guidelines** (isocpp.github.io/CppCoreGuidelines): a living document of expert advice organized by topic. Even reading the headers gives you a map of what careful C++ looks like.
- **Deepen on templates and metaprogramming:** You have seen templates, but `if constexpr`, `std::enable_if`, `consteval`, and variadic templates are worth a focused study once you are comfortable.
- **Concurrency:** `std::thread`, `std::mutex`, `std::atomic`, and `std::jthread` are in `<thread>` and `<atomic>`. Concurrent programming is a separate skill but one that matters for real-world C++.

## Common mistakes

**Mistake 1 — trying to learn everything before writing anything.**

This is the most common post-curriculum trap. Reading more material without writing code does not build skill. Write code. Break it. Fix it.

**Mistake 2 — skipping the standard library.**

`std::accumulate`, `std::sort`, `std::find_if`, `std::transform`, and `std::min_element` exist and are correct, tested, and readable. Writing your own loop when a standard algorithm exists is not wrong, but it is worth knowing what the library already provides.

**Mistake 3 — treating undefined behavior as a secondary concern.**

Now that you have the full picture, undefined behavior deserves more attention. Reading uninitialized memory, out-of-bounds access, signed integer overflow, and dangling references all invoke undefined behavior — meaning the compiler is allowed to assume they never happen and optimize accordingly, sometimes in ways that are very hard to debug. Tools like AddressSanitizer (`-fsanitize=address`) and UBSan (`-fsanitize=undefined`) are your friends.

## When to use this

This lesson is a transition point, not a destination. The knowledge from the curriculum is the prerequisite — what matters now is what you do with it. Write code that matters to you, read code written by others, run your programs under sanitizers, and revisit confusing topics after you have used them in practice. The depth of your understanding compounds with each program you complete.
