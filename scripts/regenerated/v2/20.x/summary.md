## The idea

Chapter 20 explored the advanced end of C++ functions: treating functions as values (function pointers and lambdas), understanding the memory model that makes function calls work (the stack and the heap), writing functions that recur (recursion), making programs configurable from the command line, and understanding why the C ellipsis exists but should be avoided. Together these topics complete the picture of functions as first-class building blocks in C++ programs.

The thread connecting all of them is the idea that behavior can be data. Function pointers and lambdas make callbacks, strategy patterns, and higher-order functions possible. Recursion expresses algorithms that are naturally defined in terms of themselves. Command-line arguments parameterize behavior without recompiling. The stack and heap explain where all the data goes.

## How it works

**Function pointers** store the address of a named function and allow calling it indirectly. The syntax is `ReturnType (*name)(Params...)`. A type alias (`using Op = int(*)(int,int);`) or `auto` removes the syntactic noise. Function pointers are the building block for callback-based APIs and simple dispatch tables. They cannot hold lambdas with captures.

**The stack** is the fast, automatically managed memory region for local variables and function call frames. Each function call pushes a new frame; each return pops it. Stack memory is limited — deeply recursive calls or very large local arrays can exhaust it. **The heap** is explicitly managed memory allocated with `new` and freed with `delete`. Heap allocations outlive the functions that create them, but every `new` must be paired with exactly one `delete` (or `delete[]` for arrays).

**Recursion** is a function calling itself, using the call stack as its bookkeeping mechanism. Every correct recursive function has a base case (returns directly) and a recursive case (calls itself with a strictly smaller input). Missing a base case produces infinite recursion and a stack overflow. Recursive solutions are natural for tree traversal, divide-and-conquer algorithms, and mathematically recursive definitions.

**Command-line arguments** arrive via `int main(int argc, char* argv[])`. `argc` is the count (including the program name at `argv[0]`); user arguments start at `argv[1]`. Always check `argc` before indexing `argv`. Convert string arguments to numbers with `std::stoi` or `std::stod`.

**Ellipsis (`...`)** functions accept a variable number of arguments through the C-style `va_list` / `va_start` / `va_arg` / `va_end` macros. They bypass the type system entirely — passing a wrong type silently produces undefined behavior. Avoid in new code; use `std::initializer_list<T>`, function overloads, or variadic templates instead.

**Lambdas** are anonymous functions written inline at the point of use. The syntax is `[captures](params) { body }`. Lambdas without captures convert implicitly to function pointers. **Lambda captures** extend lambdas to access variables from their enclosing scope. Capture by value (`[x]`) freezes a copy; capture by reference (`[&x]`) reads and writes through to the original. Default captures `[=]` and `[&]` capture everything referenced. Capturing by reference after the referenced variable is destroyed is undefined behavior (dangling reference).

## Common mistakes

Three patterns cause the most problems in this chapter:

- **Memory bugs from `new`/`delete`:** Forgetting to call `delete` (memory leak), using `delete` instead of `delete[]` for arrays (undefined behavior), and returning a pointer to a local variable (dangling pointer) are the three most common heap errors.
- **Infinite recursion:** Any recursive function that lacks a reachable base case, or whose recursive step does not reduce the input toward the base case, will overflow the stack. Always trace through the first few calls to verify convergence.
- **Wrong lambda capture:** Capturing by value when the lambda needs to modify or observe the latest state of the outer variable causes silent wrong results. Capturing by reference when the lambda outlives the variable causes undefined behavior. Match the capture mode to the intended lifetime and mutation semantics.

## When to use this

Prefer lambdas over named functions for small, single-use predicates and callbacks. Prefer function pointers only when you need to store or pass callables that are free functions with no captures. Avoid ellipsis in new code — the type-safety cost is too high.

Use heap allocation (via `new` or containers like `std::vector`) only when the data must outlive the function that created it or its size is not known at compile time. For everything else, keep variables on the stack where memory management is automatic.

Recursion is the right tool when the problem is recursively structured (trees, divide-and-conquer, mathematical recursion with small depth). For large linear traversals, iterative loops are safer and avoid stack overflow risk.
