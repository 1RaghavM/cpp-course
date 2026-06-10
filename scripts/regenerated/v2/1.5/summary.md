## The idea

A program that can only emit a fixed, unchanging output is not very interesting. You need a way to send values out to the user and, just as importantly, bring values in from the user at runtime. That two-way channel is the standard input/output stream library, accessed through the header `<iostream>`.

Think of the terminal as a pipe: `std::cout` ("character output") is the writing end — you push text and numbers into it from the program. `std::cin` ("character input") is the reading end — the user types something and your program pulls it back out. Every program you write from here on will use at least one of these two objects.

`std::endl` and the character literal `'\n'` both move the cursor to the next line after output, but they differ in one important way: `std::endl` flushes the output buffer, making it slightly slower in loops. For a first program that prints a handful of lines, the difference is invisible; the convention on this platform is to prefer `'\n'`.

## How it works

**Sending output with `std::cout` and `<<`**

The insertion operator `<<` pushes a value into the stream on its left. You can chain multiple insertions in one statement; they execute left to right.

```cpp
#include <iostream>

int main()
{
    std::cout << "Enter your age: ";
    return 0;
}
```

Running this prints `Enter your age: ` with no newline at the end, so the cursor stays on the same line waiting for the user.

**Reading input with `std::cin` and `>>`**

The extraction operator `>>` pulls one whitespace-delimited token from the stream and stores it in the variable on its right.

```cpp
#include <iostream>

int main()
{
    int age;
    std::cout << "Enter your age: ";
    std::cin >> age;
    std::cout << "You are " << age << " years old.\n";
    return 0;
}
```

When the user types `25` and presses Enter, `std::cin >> age` stores `25` in `age`. The program then prints `You are 25 years old.` followed by a newline character.

Notice the two different operators: `<<` goes *into* `cout` (output), and `>>` comes *out of* `cin` (input). A useful memory trick: the angle brackets point in the direction the data flows — toward the stream for output, toward the variable for input.

**Chaining insertions and reading multiple variables**

You can read two integers in a single statement. The user can separate them with a space or press Enter between them — whitespace handling is automatic.

```cpp
#include <iostream>

int main()
{
    int x;
    int y;
    std::cout << "Enter two integers: ";
    std::cin >> x >> y;
    std::cout << "Sum: " << x + y << '\n';
    return 0;
}
```

If the user enters `10 32`, then `x` becomes `10` and `y` becomes `32`, and the program prints `Sum: 42`.

## Common mistakes

**Mistake 1 — Swapping the operators**

Beginners frequently write `std::cout >> value` or `std::cin << value`, confusing which operator belongs to which stream.

```cpp
// WRONG — will not compile
std::cout >> "Hello";
```

The compiler rejects this because `>>` is not defined for `std::cout`. The rule is: `<<` with `cout`, `>>` with `cin`. If you swap them, you get a compile error along the lines of "no match for operator>>".

**Mistake 2 — Forgetting `#include <iostream>`**

Both `std::cout` and `std::cin` live inside the `<iostream>` header. If you omit it, the compiler cannot find them and produces an error like `'cout' was not declared in this scope`.

```cpp
// WRONG — iostream not included
int main()
{
    std::cout << "Hello\n"; // error: 'cout' not declared
    return 0;
}
```

Fix: always place `#include <iostream>` at the top of any file that uses input or output.

**Mistake 3 — Expecting `std::cin` to flush `std::cout` automatically**

When you print a prompt and then call `std::cin`, the prompt may not appear on the terminal before the user has to type. This is a buffering issue: output is collected in memory and might not display until the buffer is flushed.

The safe fix is to end your prompt with `std::endl` or `'\n'` — or to separate the output and input statements so the output flushes before reading. In practice, most compilers and terminals flush before a `cin` read, but relying on this is fragile. Using `'\n'` after your prompt is the clean habit to form.

## When to use this

You reach for `std::cout` every time you need to send any text or computed value to the user — error messages, results, prompts, or debug information. `std::cin` is your entry point whenever a program needs values that differ each time it runs. Together, these two objects handle the vast majority of user interaction in the programs you will write in this course.

When `std::cin` is not the right tool — for example, when reading structured files, large data sets, or binary data — you will eventually learn about file streams (`std::ifstream`, `std::ofstream`), but those build on exactly the same operator syntax you learned here, so your investment is not wasted. For now, every exercise that needs input will use `std::cin`.
