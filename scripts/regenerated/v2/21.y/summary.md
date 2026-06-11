## The idea

Chapter projects give you a chance to apply everything from the chapter without a worked example to follow. This project pulls together the full range of operator overloading skills: arithmetic, comparison, I/O, typecast, prefix decrement, and copy semantics. The goal is to build a small, complete class from scratch — one that behaves like a natural C++ type, where each operation uses the natural operator syntax rather than a named method call.

The project builds `IntStack`, a fixed-capacity stack of integers that exposes a natural operator interface. You will implement the full suite of operators covered in chapter 21, make sure the stack copies correctly, and verify each piece before moving on.

Think of this as your chapter 21 exit ticket: if the stack compiles, passes all tests, and uses only techniques covered in chapters 1–21, you are ready for chapter 22.

## How it works

This summary is a design brief rather than a worked example — the code is yours to write. The exercises below specify the exact interface; read them carefully before starting.

**`IntStack` specification:**

`IntStack` holds up to 8 integers in a fixed internal array `int m_data[8]`. An `int m_count` member tracks how many elements are currently stored (initialized to 0). The stack follows last-in, first-out order: elements pushed later are popped first.

The class exposes these operations:

- `operator+=(int value)` — pushes `value` onto the top. If the stack is already at capacity (8 elements), do nothing. Returns `*this` by reference.

- Prefix `operator--` — pops the top element by decrementing `m_count`. If the stack is empty (`m_count == 0`), do nothing. Returns `*this` by reference.

- `explicit operator bool() const` — returns `true` if the stack is non-empty (`m_count > 0`). Marking it `explicit` prevents the stack from being silently used as an integer.

- `friend std::ostream& operator<<(std::ostream& out, const IntStack& s)` — prints all elements from bottom to top in the format `[a, b, c]`. An empty stack prints `[]`. The loop runs `m_count` times, not `MAX_SIZE` times.

- Copy constructor — copies both `m_count` and all `m_count` elements from `m_data`. Since the array is a fixed member (not heap memory), the compiler-generated copy would actually work, but writing it explicitly reinforces the deep-copy habit from the shallow-vs-deep-copying lesson.

**Design notes and relationships:**

The push operation writes to `m_data[m_count]` then increments `m_count`. The pop operation decrements `m_count` — the data stays in the array but is logically invisible because all operations respect the `m_count` bound. This means `operator<<` must loop from `0` to `m_count - 1`, never from `0` to `MAX_SIZE - 1`.

The `explicit operator bool` combines naturally with the pop operator. A safe pop-until-empty loop can be written as:

```cpp
while (stack) {
    // process stack[m_count - 1]
    --stack;
}
```

The copy constructor's relationship with the rest of the class illustrates the Rule of Three in a low-stakes context: there is no destructor needed here (no heap memory), but if you added `new int[]` storage, you would immediately need all three.

**What makes this a project:**

Each piece individually is a review of a single lesson. Putting them together in one class — and making sure they interact correctly — is the challenge. For example: `operator--` needs to coordinate with `operator bool` to guard against empty-stack pops. The copy constructor must copy `m_count` before copying the data elements, or the loop bound is wrong. The stream operator must use `m_count`, not `MAX_SIZE`, or it prints garbage from uninitialized array slots.

## Common mistakes

**Printing MAX_SIZE elements instead of m_count in `operator<<`:**

The array is always allocated with 8 slots, but only `m_count` of them hold valid data. Iterating up to `MAX_SIZE` prints garbage from uninitialized memory with no compile-time warning.

**Returning `*this` by value from prefix `operator--`:**

Prefix `operator--` should return `IntStack&`, consistent with how prefix `--` works on integers. Returning by value creates a temporary and breaks any context where the result of the pop is used as an lvalue.

**Forgetting the empty-stack guard in `operator--`:**

Decrementing `m_count` when it is already 0 gives a negative count. Subsequent pushes write to negative-indexed positions, producing undefined behavior. Guard with `if (m_count > 0) --m_count;`.

**Copying `m_count` after the loop in the copy constructor:**

If you write the copy constructor body as a loop over `m_count` before assigning `m_count` from `src.m_count`, you are looping over the default-initialized value (0) and copying nothing. Initialize `m_count` from `src.m_count` first (or in the member initializer list), then copy the elements.

## When to use this

The specific class built here is for practice — you would use `std::stack` from the standard library in real code. What you are practicing is the discipline of writing a complete, consistent interface: every operator defined correctly, copy semantics handled, and resource ownership clear. That discipline transfers to any class you will ever write that wraps state — a smart pointer, a game board, a network message buffer. The chapter 21 techniques you have practiced here are the foundation for everything that comes next.
