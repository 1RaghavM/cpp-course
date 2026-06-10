## The idea

A dependency is the weakest, most transient kind of object relationship. One object *uses* another for a brief period — typically for the duration of a single function call — without ever storing a pointer or reference to it as a member variable. When the function returns, the relationship ends entirely.

Think of borrowing a pen to sign a document. You use the pen once, hand it back, and neither you nor the pen remembers the encounter. The pen has no idea you used it. You have no lasting record of having used that specific pen. That is a dependency: one-directional, brief, non-storing.

Dependencies are common in C++ wherever a function needs a helper object — a logger, a formatter, a random-number engine, a comparator — without the class needing to own or remember it.

## How it works

The most common expression of a dependency is a function parameter:

```cpp
struct Logger {
    void log(const std::string& msg) { std::cout << "[LOG] " << msg << "\n"; }
};

struct FileExporter {
    void exportData(const std::vector<int>& data, Logger& logger) {
        logger.log("Export started");
        for (int v : data)
            std::cout << v << "\n";
        logger.log("Export done");
    }
};
```

`FileExporter` depends on `Logger` to record progress, but it does not store a `Logger` member. The dependency exists only during the `exportData` call. `FileExporter` has no idea which `Logger` implementation it will get; it just uses whatever is passed in.

Dependencies can also appear as local variables inside a function body, when the function creates a helper object only to perform one operation:

```cpp
void printSorted(std::vector<int> values) {
    // local sort — the comparison function is a transient dependency
    std::sort(values.begin(), values.end());
    for (int v : values)
        std::cout << v << " ";
    std::cout << "\n";
}
```

The comparison logic (implicit in `std::sort`) is used and forgotten within the function. No member variable stores it.

Another common pattern: a function accepts a formatter or writer as a parameter, uses it to produce output, and discards it:

```cpp
struct Formatter {
    std::string format(int value) const {
        return "Value=" + std::to_string(value);
    }
};

struct Report {
    int score{};
    void print(const Formatter& fmt) const {
        std::cout << fmt.format(score) << "\n";
    }
};
```

`Report` depends on `Formatter` for display but holds no `Formatter*` member. Each call to `print` can receive a different formatter.

The distinction from association is straightforward: association stores the pointer or reference as a class member. Dependency uses it only within the function scope and stores nothing. If you look at a class definition and see no raw-pointer or reference member connected to the helper, it is a dependency, not an association.

## Common mistakes

**Storing the pointer and forgetting to null it out after the call.** If you accidentally promote a dependency to a stored member, the pointer can become dangling:

```cpp
struct Processor {
    Logger* log;  // accidentally stored
    void run(Logger& l) {
        log = &l;        // address of a temporary or local
        log->log("running");
        // log is still set after run() returns — dangling if l was a local
    }
};
```

If the relationship is genuinely just for one call, do not store the pointer. Pass it as a function parameter and use it without assignment to a member.

**Confusing dependency with aggregation.** Aggregation stores a non-owning pointer as a member that persists between calls. Dependency uses the object only within a single call. The test: does the class have a member that points to the helper? If yes, it is at least aggregation. If no, it is a dependency.

**Passing by value instead of by reference.** Dependencies on class-type helpers should usually be passed as `const T&` (read-only helper) or `T&` (read-write helper, for things like loggers that accumulate state). Passing by value makes a copy of the helper, which is usually wasteful and sometimes wrong (the copy cannot update the original logger's internal state):

```cpp
// BAD: copies the logger — log entries written to a temporary copy
void process(Logger logCopy) { logCopy.log("done"); }

// GOOD: uses the actual logger
void process(Logger& logger) { logger.log("done"); }
```

## When to use this

Dependencies are the right tool when a function needs a helper for a single operation and the class does not need to remember that helper between calls. Loggers, formatters, sorters, validators, and random-number engines are all commonly injected as function-parameter dependencies.

Prefer dependencies over stored associations whenever the helper does not need to persist. They reduce coupling: the class does not need to know where the helper came from, does not hold a potentially-dangling pointer, and can receive any compatible helper on each call. When you find yourself adding a member variable just to hold a reference to something that is only needed inside one function, reconsider whether passing it as a parameter instead would be cleaner.
