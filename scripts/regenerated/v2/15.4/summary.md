## The idea

A constructor runs when an object is created. Its counterpart, the **destructor**, runs when an object is *destroyed* — when it goes out of scope, when a block ends, or when a dynamically allocated object is explicitly released. The destructor's job is cleanup: releasing any resources the object acquired during its lifetime.

For most beginner classes, the compiler-generated destructor is all you need — it simply destroys each member in reverse construction order and that is enough. But once a class acquires an external resource (an open file, a network connection, a raw allocation), you write a custom destructor to release it. This is the foundation of C++'s resource management idiom: the resource lives exactly as long as the object that owns it.

## How it works

**Syntax**

A destructor has the same name as the class, preceded by a tilde (`~`), takes no parameters, and returns nothing.

```cpp
class Logger {
public:
    Logger() {
        std::cout << "Logger created\n";
    }
    ~Logger() {
        std::cout << "Logger destroyed\n";
    }
};
```

Running this in a block:

```cpp
int main() {
    Logger log;         // prints: Logger created
    std::cout << "Using logger\n";
}                       // end of scope: prints: Logger destroyed
```

The output order is: *created*, *using*, *destroyed*. The destructor fires automatically when `log` goes out of scope at the closing brace.

**Destruction order**

When multiple objects exist in the same scope, they are destroyed in *reverse order of construction*: the last object constructed is the first destroyed. This mirrors a stack: push on construction, pop on destruction.

```cpp
int main() {
    Logger a;   // constructed first
    Logger b;   // constructed second
}   // b destroyed first, then a
```

Output:
```
Logger created   (a)
Logger created   (b)
Logger destroyed (b)
Logger destroyed (a)
```

**When to write a custom destructor**

If a class holds a resource that the compiler does not know how to release — a file handle it opened, a raw buffer it allocated — you write a destructor to release it. For classes that only hold plain data members (ints, doubles, other objects with their own destructors), the compiler-generated destructor does the right thing and you should omit a custom one.

```cpp
class FileWrapper {
public:
    FileWrapper(const char* path) {
        m_file = std::fopen(path, "r");
    }
    ~FileWrapper() {
        if (m_file) std::fclose(m_file);  // guaranteed cleanup
    }
private:
    FILE* m_file{nullptr};
};
```

The file is closed automatically when a `FileWrapper` object leaves scope — even if the code that uses it throws an exception or returns early from a function. This is what makes destructors powerful: cleanup happens no matter which path the code takes.

## Common mistakes

**Mistake 1 — Writing a destructor for a class that does not need one**

```cpp
class Point {
public:
    ~Point() {}   // unnecessary — compiler-generated destructor is identical
    int x, y;
};
```

Adding an empty destructor is harmless but misleading: it implies the class manages a resource when it does not. It also suppresses the compiler-generated move operations (a subtlety covered in later lessons). The rule: if you would not know what to put in the destructor body, do not write one.

**Mistake 2 — Calling the destructor manually**

```cpp
Logger log;
log.~Logger();  // legal but almost always wrong
```

The destructor will then run again automatically when `log` goes out of scope, resulting in double-destruction. For a class that closes a file or frees memory, this means the resource is released twice — undefined behavior. Destructors should be called by the compiler, not by your code.

**Mistake 3 — Assuming the destructor runs at a specific time for heap objects**

```cpp
Logger* p = new Logger();    // created on heap
// ...
// forget to delete p — destructor never runs, resource is leaked
```

For objects created with `new`, the destructor runs only when `delete` is called. If `delete` is never called, the destructor never runs and the resource leaks. This is one of the main reasons modern C++ avoids raw `new`/`delete` — but that belongs to a later lesson. For now, understand that automatic (stack) objects always have their destructors called when they go out of scope; heap objects do not.

## When to use this

Write a custom destructor whenever your class is the *sole owner* of a resource that must be explicitly released: a file opened with `fopen`, a mutex that must be unlocked, a database connection that must be closed. If a class only holds objects that manage their own cleanup (standard types, other well-written classes), let the compiler generate the destructor. Destructor-based cleanup is the mechanism behind the broader RAII pattern (Resource Acquisition Is Initialization) that you will see repeatedly in idiomatic C++ code: acquire in the constructor, release in the destructor, and the lifetime of the resource is tied to the lifetime of the object.
