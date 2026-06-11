## The idea

Writing a program does not start with typing code. It starts with thinking. The gap between a blank editor and a working program is a planning step that beginners often skip — and then wonder why they are stuck after five minutes. Good program design means deciding, before you write a single line, exactly what the program needs to do, what inputs it uses, what outputs it produces, and which smaller pieces it can be broken into.

The core technique is decomposition: breaking a big task into smaller sub-tasks, each of which is manageable on its own. Once you have a list of sub-tasks, you implement them one at a time, test each piece before moving on, and combine them at the end. This is not a rigid methodology — it is just a way to keep your head above water when complexity grows.

Think of it like building a piece of furniture from a kit. You do not glue all the pieces at once and hope for the best. You identify the legs, the top, the bolts, and you follow an order. Each piece gets checked before you add the next.

## How it works

**Example 1 — stating the problem clearly before writing code**

Suppose the task is: "Read two integers and print their sum and their difference."

Before opening the editor, write these out in plain English:
- Input: two integers `a` and `b`.
- Output: two lines — `Sum: <a+b>` then `Diff: <a-b>`.
- Sub-tasks: (1) read the integers, (2) compute sum, (3) compute diff, (4) print both.

Once that is clear, the code almost writes itself:

```cpp
#include <iostream>

int sum(int a, int b) { return a + b; }
int diff(int a, int b) { return a - b; }

int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << "Sum: " << sum(a, b) << "\n";
    std::cout << "Diff: " << diff(a, b) << "\n";
    return 0;
}
```

Each sub-task became either a helper function or one line of `main`. There is no mystery about what goes where because the plan said so.

**Example 2 — identifying inputs, outputs, and the processing step**

For any program you write at this stage, ask three questions before touching the keyboard:

What goes in? (stdin — integers, counts, labels)
What comes out? (stdout — exact format, newlines, labels)
What happens in between? (arithmetic, function calls)

For the task "read N values and print their total":
- In: integer N, then N more integers.
- Out: one line `Total: X`.
- In-between: add them up.

With this plan, you write the loop (which you will learn in a later chapter), but the point is: the planning step makes the implementation step a mechanical translation.

**Example 3 — building bottom-up, testing as you go**

A reliable approach is to write and test the smallest sub-task first, then add the next:

```cpp
// Step 1: can I read two numbers and print them back?
#include <iostream>
int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << a << " " << b << "\n";
    return 0;
}
```

Once that works, add the computation. Once that works, add the formatting. Never add more than one thing at a time. Each step is small enough that if something breaks, you know exactly what changed.

## Common mistakes

**Mistake 1 — writing the entire program before testing any of it**

Beginners often write fifty lines of code and then run it for the first time. When it fails, there are fifty possible causes. Testing small increments — even just reading input and printing it back — catches errors when they are still small.

```cpp
// Problematic: wrote everything at once, now baffled by a wrong answer
int result = a * b + c / d - e;  // which operation is wrong?
```

Build it in steps. Test each step.

**Mistake 2 — not specifying the output format before writing the code**

If you do not decide ahead of time whether the output is `Sum: 7` or `7` or `The sum is 7`, you will change your mind mid-way and introduce inconsistencies. Fix the exact output format — label, spacing, newlines — before you write a single `std::cout`.

**Mistake 3 — putting too much logic in `main`**

`main` that does everything is hard to read and harder to fix. If your task has three distinct steps — read, compute, display — each step is a candidate for its own function. A `main` with three function calls is much clearer than a `main` with thirty lines of mixed input, arithmetic, and printing.

```cpp
// hard to follow
int main() {
    int a, b, c;
    std::cin >> a >> b >> c;
    int t1 = a + b;
    int t2 = t1 * c;
    int t3 = t2 - a;
    std::cout << t3 << "\n";
    return 0;
}

// better: name the computation
int compute(int a, int b, int c) {
    int t1 = a + b;
    int t2 = t1 * c;
    return t2 - a;
}

int main() {
    int a, b, c;
    std::cin >> a >> b >> c;
    std::cout << compute(a, b, c) << "\n";
    return 0;
}
```

## When to use this

Always. The habit of stating inputs, outputs, and sub-tasks before writing code pays off even for ten-line programs, because it surfaces ambiguities early. For longer programs the payoff is larger: a clear plan prevents half-written spaghetti that is painful to revisit. If a task is short and well-understood (a single arithmetic expression), you can keep the plan in your head; write it down only when the task has more than one moving part.
