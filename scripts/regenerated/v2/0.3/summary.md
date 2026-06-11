## The idea

C and C++ are two related but distinct programming languages. Understanding their relationship — and why it matters — saves a lot of confusion when you encounter code online, in books, or in job descriptions that use the names interchangeably (incorrectly).

C is older. It was developed in the early 1970s by Dennis Ritchie at Bell Labs as a practical language for writing operating systems. It is small, close to the hardware, and extremely portable. The Unix operating system was rewritten in C, which helped spread both the language and the operating system widely. C's design goals were radical simplicity and direct hardware access — it gave programmers nearly complete control over memory, execution, and data layout.

C++ was created by Bjarne Stroustrup, also at Bell Labs, starting in 1979. The original goal was to add object-oriented programming features — particularly classes — to C without sacrificing C's runtime performance. The name "C++" is a pun: `++` is the increment operator in C, so C++ means "one step beyond C." The first version was called "C with Classes" and that name captures the original scope well. Over the following decades, the language accumulated templates, exceptions, a rich standard library, and eventually the modern features of C++11 through C++23.

## How it works

C++ is largely a superset of C in practice, though not technically. Most valid C code will compile as C++ with few or no changes. However, C++ has evolved significantly since its creation and is now a very different language in terms of idioms, standard library, and best practices. Modern C++ looks nothing like C-with-classes.

The major categories of features C++ brought over C include:

- Classes and objects: a way to bundle data and the functions that operate on that data, so the two stay together and the data cannot be manipulated accidentally from outside the agreed interface.
- Templates: a mechanism for writing code that works correctly with many different types without rewriting the logic for each type. This is the foundation of the standard library's containers and algorithms.
- The C++ Standard Library: containers like vector, map, and string; algorithms for sorting, searching, and transforming; I/O facilities. This is far richer than the C standard library.
- References and improved type safety: features that make a large class of C's most dangerous patterns either unnecessary or explicit.
- Modern additions in C++11 and later: smart pointers that manage memory automatically, lambdas for inline functions, move semantics for efficient data transfer, and much more.

Both languages remain actively used today. C stays dominant in embedded systems, operating system kernels, and firmware where every byte of memory and every CPU cycle matters and where the overhead of C++ runtime features would be unacceptable or where the toolchain does not support C++. C++ is the language of choice for game engines, high-frequency trading systems, browsers, compilers, physics simulations, and any domain that needs performance close to C but benefits from higher-level abstractions.

## Common mistakes

The most common mistake is treating C and C++ as the same language, or as interchangeable. They are not. C code and C++ code can look similar, especially in short examples, but the two languages have diverged substantially over five decades. Best practices differ, standard libraries differ, memory management idioms differ, and type safety guarantees differ. A textbook titled "C/C++ Programming" usually means "C with some C++ syntax borrowed from the early 1990s," not modern C++. Be skeptical of any resource that conflates the two, because advice valid in one language is frequently invalid in the other.

Another mistake is assuming that because C is simpler, it is easier or safer to learn first. C's simplicity is deceptive. It gives you less protection from mistakes, not more. The language does not prevent you from reading beyond the end of an array, using memory after it has been freed, or mixing incompatible pointer types. Modern C++ provides tools — containers that bounds-check themselves, smart pointers that manage memory automatically, references that cannot be null — that make a large class of beginner errors impossible before they happen. Starting with modern C++ idioms is frequently safer for beginners than starting with C.

A third misunderstanding is thinking that C++ features carry an automatic runtime cost compared to equivalent C code. Some features do have overhead, and some do not. The C++ design philosophy, sometimes called "zero-overhead abstractions," holds that using a C++ feature should cost no more than writing the equivalent low-level code by hand. A `std::vector` is not slower than a hand-rolled C array when both are used correctly; a virtual function call costs one pointer dereference, exactly what you would pay if you implemented the same dispatch manually in C.

## When to use this

This historical context matters when you are choosing learning resources and when you are reading code you did not write. If you encounter code that uses `malloc` and `free` for memory management, `char` arrays instead of strings, `printf` and `scanf` for I/O, or raw function pointers for dispatch, you are reading C or very old C++. This course teaches modern C++, and the advice here may not apply to that code.

It also matters when job postings or project requirements specify "C/C++." That phrase is used loosely. Often it means the codebase contains both C and C++ files, or that C-style coding is expected. Sometimes it means modern C++ is expected. When in doubt, look at the actual codebase or ask directly, because the two languages require different knowledge and habits.

Understanding that C++ has a history also explains why some parts of the language look strange or inconsistent. Decisions made in 1983 that could not be revoked in 1998 are still present in C++23. The language carries its history, and knowing that history makes the inconsistencies make sense.
