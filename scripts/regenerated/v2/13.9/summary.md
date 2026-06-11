## The idea

When you define a struct, you are creating a blueprint for objects. Sometimes you want certain fields to always start with a sensible value unless the caller explicitly says otherwise. Default member initialization is how you bake those starting values directly into the blueprint, so every object that skips a particular field during initialization still ends up with a predictable value instead of garbage.

Think of it like a form that has pre-filled defaults. If you fill in a blank, your value wins. If you leave it blank, the pre-filled default is used. The form never leaves a field indeterminate just because you forgot to provide a value for it.

## How it works

You write a default value right next to the member name inside the struct definition, using either `=` or brace syntax:

```cpp
#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

int main() {
    Point a{};       // x=0, y=0 (defaults used for both)
    Point b{ 3, 7 }; // x=3, y=7 (both defaults overridden)
    std::cout << a.x << ' ' << a.y << '\n'; // 0 0
    std::cout << b.x << ' ' << b.y << '\n'; // 3 7
}
```

You can also mix: provide a value for some members and let others fall back to their defaults. Designated initializers (from lesson 13.8) make this readable even for structs with many fields:

```cpp
#include <iostream>

struct Config {
    int width{ 800 };
    int height{ 600 };
    bool fullscreen{ false };
};

int main() {
    Config c{ .width = 1920, .height = 1080 }; // fullscreen stays false
    std::cout << c.width << 'x' << c.height << ' '
              << (c.fullscreen ? "full" : "windowed") << '\n';
    // 1920x1080 windowed
}
```

The default only applies when aggregate initialization does not supply a value for that member. As soon as you provide a value — even `0` — the default is bypassed entirely for that member. That distinction matters when the default is something other than zero.

There is also a subtle difference between `Point p{};` and `Point p;`. With braces, any member that has no default initializer gets value-initialized (zeroed for fundamental types). Without braces, any member with no default initializer is left uninitialized — reading it is undefined behavior. Default member initializers sidestep this hazard for the fields they cover, but you should still prefer `{}` initialization for structs even when all members have defaults, just as a habit.

```cpp
#include <iostream>

struct Sensor {
    float reading{ -1.0f }; // -1 signals "no data yet"
    bool valid{ false };
};

int main() {
    Sensor s{};          // reading=-1.0, valid=false
    s.reading = 98.6f;
    s.valid   = true;
    std::cout << (s.valid ? s.reading : -1.0f) << '\n'; // 98.6
}
```

## Common mistakes

**Mistake 1 — Declaring without braces and reading an uninitialized member.**

```cpp
struct Widget {
    int code;          // no default initializer
    std::string label{ "unnamed" };
};

int main() {
    Widget w;          // 'code' is NOT value-initialized
    std::cout << w.code << '\n'; // undefined behavior — reads garbage
}
```

Using `Widget w;` (no braces) leaves `code` uninitialized because it has no default initializer. The label gets its default, but `code` is garbage. The fix is either to add a default initializer (`int code{ 0 };`) or to always write `Widget w{};`.

**Mistake 2 — Assuming the default still applies when you supply a value.**

```cpp
struct Timer {
    int seconds{ 60 }; // default: one minute
};

int main() {
    Timer t{ 0 };      // seconds = 0, NOT 60
    std::cout << t.seconds << '\n'; // 0
}
```

Because `0` was supplied explicitly, the default of `60` is completely ignored. This trips people up when they write `Timer t{ 0 }` intending "use defaults but also zero out seconds." The provided value always wins.

**Mistake 3 — Confusing default member initializers with constructor logic.**

At this point in the course, structs do not have constructors. Default member initializers are not code that runs; they are values baked into the type definition. You cannot call a function or compute an expression using other members as part of a default initializer. Keeping defaults to simple literals avoids surprises.

## When to use this

Use default member initialization any time a struct has fields that have a natural starting state, such as a counter that starts at zero, a flag that starts as false, or a sentinel like `-1` meaning "not yet assigned." This pairs naturally with aggregate initialization from lesson 13.8: callers provide only the fields that differ from the defaults, keeping call sites concise. When combined with designated initializers, it produces self-documenting code where the intent is obvious even without reading the struct definition.
