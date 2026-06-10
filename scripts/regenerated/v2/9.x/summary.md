## The idea

Chapter 9 has covered the full arc of writing software that doesn't just work for the happy path — it works reliably, fails loudly when something is wrong, and communicates clearly what went wrong. These ideas are not isolated tricks; they form a single, coherent strategy for building robust programs. Testing finds bugs. Coverage tells you where you haven't looked. Semantic error patterns give you a checklist of where bugs hide. Error handling strategies let you respond gracefully. `std::cin` validation prevents bad input from corrupting your program. Assertions make your assumptions explicit and verifiable.

This summary connects the six lessons into a unified picture and shows how the techniques compose.

## How it works

The six lessons fit into three phases of a program's lifecycle:

**Phase 1 — Testing and Coverage (9.1 and 9.2)**

Testing is the discipline of running your code with known inputs and checking the output against expected results. A test that prints `PASS` or `FAIL` is better than one that just prints a raw number, because the expected value is embedded in the code. Code coverage tracks whether you have tested enough: statement coverage means every line ran; branch coverage means every conditional outcome was taken. The minimum bar is branch coverage on every function with conditional logic, plus at least one test on each boundary value where behavior changes.

```cpp
// Pattern: PASS/FAIL test with boundary and branch values
std::cout << (classify(14) == 0 ? "PASS" : "FAIL") << '\n';  // just below boundary
std::cout << (classify(15) == 1 ? "PASS" : "FAIL") << '\n';  // boundary itself
```

**Phase 2 — Knowing Where Bugs Hide (9.3)**

Most semantic errors fall into five recurring patterns: wrong logical operator (`||` instead of `&&` in range checks), off-by-one in loop or boundary conditions, integer division when a decimal was expected, uninitialized variable reads, and accidental assignment in a condition (`=` instead of `==`). When a function produces the wrong answer and the compiler says nothing, scan for these patterns in order.

```cpp
// Off-by-one: loop prints 1,2,3 instead of 1,2,3,4,5
for (int i = 1; i < 5; ++i)   // fix: i <= 5
    std::cout << i << '\n';

// Integer division: avg is 3, not 3.5
double avg = 7 / 2;            // fix: static_cast<double>(7) / 2
```

**Phase 3 — Handling Errors at Runtime (9.4, 9.5, 9.6)**

Once you detect a problem, you need a strategy for responding to it:

- **Sentinel values** (9.4): return a special value (`-1`, `false`) that signals failure; the caller checks and acts accordingly.
- **`std::exit` / `std::abort`** (9.4): for truly fatal errors where the program cannot continue.
- **`std::cin` validation** (9.5): check `if (!(std::cin >> x))`, then call `std::cin.clear()` followed by `std::cin.ignore(...)`. Always validate the value's range separately — a successful extraction doesn't mean the value is in bounds.
- **`assert`** (9.6): enforce programmer invariants — conditions that must always be true in correct code. Place them at the top of functions as documented preconditions. Never use `assert` for expected user-input errors.
- **`static_assert`** (9.6): for compile-time checks on type sizes and constants, costing nothing at runtime.

The key distinction that the entire chapter builds toward is the difference between two kinds of "bad situation":

- **Expected runtime errors** (user typed a letter, number is out of range): handle these with validation and return values or error messages.
- **Programmer assumption violations** (a function was called with an argument you guaranteed would never happen): catch these with `assert`.

Mixing the two is the most common error in applying this chapter's ideas. A user typing `abc` is not an assertion failure — it is an expected event to handle gracefully. A denominator of zero passed to an internal `divide` function where every caller was supposed to have validated first is an assertion target.

## Common mistakes

**Mistake 1 — testing only the "main scenario" and shipping:**
The most common mistake in chapter 9's scope is thinking "it works when I run it" means it works for all inputs. Testing is only as good as its coverage. If you never tested `0`, `negative values`, or the exact boundary between two branches, you have not tested the function.

**Mistake 2 — using `assert` as a substitute for `std::cin` validation:**

```cpp
int n;
std::cin >> n;
assert(n > 0);  // WRONG: user can type anything; this crashes instead of recovering
```

`assert` should protect internal invariants, not user-facing errors. For user input, use `if (!(std::cin >> n))` plus a range check and an appropriate message.

**Mistake 3 — forgetting `std::cin.ignore` after `std::cin.clear`:**
`clear()` resets the fail flag. Without `ignore()`, the bad characters remain in the buffer and the next read fails again immediately.

## When to use this

Every function with a conditional should be tested for branch coverage. Every function with preconditions should have `assert` calls enforcing them. Every program that reads user input should check `std::cin`'s success and validate ranges separately. When something goes wrong, your checklist is: Is the condition wrong (wrong operator, off-by-one)? Is there integer division where floating point was needed? Is there an uninitialized variable? Is user input unchecked? Did a caller violate a precondition that `assert` would catch? In that order, these questions resolve the vast majority of bugs in programs at this level.
