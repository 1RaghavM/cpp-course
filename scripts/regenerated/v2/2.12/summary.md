## The idea

When you split a project across multiple files, it is easy for the same header to get included more than once. A header might be included directly by `main.cpp`, and also pulled in indirectly because some other header it depends on includes it too. Without protection, the compiler sees the same declarations twice in the same translation unit and reports errors — or worse, sees the same definitions twice and violates the one-definition rule.

Header guards solve this by wrapping a header's content in a conditional preprocessor block. The first time the preprocessor reads the header, a special macro is not yet defined, so it processes the content and defines the macro. Every subsequent time the same header is included in the same translation unit, the macro is already defined, so the preprocessor skips the entire body. The content is seen exactly once, no matter how many times the header is included.

Think of it like a ticket stub at a concert. The first time you enter you give up the stub. If you try to re-enter, there is nothing to give — you are turned away. The macro is the used stub.

## How it works

A header guard uses three preprocessor directives: `#ifndef`, `#define`, and `#endif`.

**Example 1 — a basic header guard**

```cpp
// math_utils.h
#ifndef MATH_UTILS_H
#define MATH_UTILS_H

int add(int a, int b);
int multiply(int a, int b);

#endif  // MATH_UTILS_H
```

When the preprocessor first encounters this file:
1. `#ifndef MATH_UTILS_H` — the macro is not defined yet, so the block is entered.
2. `#define MATH_UTILS_H` — the macro is now defined.
3. The declarations are processed.
4. `#endif` — the block ends.

The second time this header is included (from anywhere in the same translation unit), step 1 evaluates as false — `MATH_UTILS_H` is already defined — so the entire body is skipped.

**Example 2 — the problem header guards solve**

Without a guard, including a header twice causes a redeclaration:

```cpp
// no guard — bad
int add(int a, int b);
int add(int a, int b);  // second include: compiler error
```

Adding the guard makes the second pass a no-op:

```cpp
// with guard — fine
#ifndef MATH_UTILS_H
#define MATH_UTILS_H
int add(int a, int b);
#endif
```

The second `#include "math_utils.h"` simply falls through the `#ifndef` check and produces no tokens at all.

**Example 3 — naming conventions**

The guard macro name must be unique across the entire project (not just one file). The near-universal convention is to derive it from the file path, converting letters to uppercase and replacing dots and slashes with underscores:

```cpp
// file: engine/renderer/shader.h
#ifndef ENGINE_RENDERER_SHADER_H
#define ENGINE_RENDERER_SHADER_H

// declarations…

#endif  // ENGINE_RENDERER_SHADER_H
```

A short, generic name like `HEADER_H` risks colliding with a macro from a library or another file. Using the full path-derived name makes collisions extremely unlikely.

## Common mistakes

**Mistake 1 — forgetting the header guard entirely**

The most common mistake is writing a header with no guard and then including it from two places that are compiled into the same translation unit. The symptom is a cascade of "redeclaration of …" compile errors that can be hard to trace back to the missing guard.

```cpp
// broken.h — no guard
int helper(int x);

// a.h
#include "broken.h"

// main.cpp
#include "a.h"
#include "broken.h"  // second include → compiler sees helper declared twice
```

The fix: wrap `broken.h` with `#ifndef BROKEN_H / #define BROKEN_H / … / #endif`.

**Mistake 2 — inconsistent macro names between `#ifndef` and `#define`**

Typos in the macro names mean the guard never fires correctly. The `#ifndef` checks one name while `#define` defines a different one, so the header is never "marked as seen."

```cpp
#ifndef MATH_UTILS_H     // checks MATH_UTILS_H
#define MATH_UTILS_HPP   // defines MATH_UTILS_HPP — different name!
// guard does not work
#endif
```

Both lines must use the exact same identifier. Check for case and underscore differences.

**Mistake 3 — placing code outside the guard**

If declarations appear before `#ifndef` or after `#endif`, they are not protected and will be processed on every include.

```cpp
// leaking code outside the guard
int dangling(int x);    // outside the guard — processed every time!

#ifndef STUFF_H
#define STUFF_H
int protected_fn(int x);
#endif
```

Every statement you want protected must sit between `#define MACRO_NAME` and `#endif`.

## When to use this

Every header file you write should have a header guard. There are no exceptions in practice. Some modern compilers and build systems support the non-standard `#pragma once` directive as a shorter alternative; it is widely supported but is not part of the C++ standard. If you need portability, stick to `#ifndef` guards. If you know your toolchain supports `#pragma once` and prefer brevity, it is fine — but the `#ifndef` form is universal and is what you should learn first.
