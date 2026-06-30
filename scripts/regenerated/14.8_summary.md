## The idea

The previous lessons taught you the mechanics: how to make members private, how to write getters and setters, how to return references. Now it is time to step back and ask: why do any of this? What is the actual payoff?

The answer is **encapsulation** — the practice of hiding an object's internal implementation details and exposing only a well-defined public interface. Encapsulation is not just a coding style rule. It is the engineering decision that makes classes maintainable, testable, and safe to use by other code.

The clearest way to see the benefit is through what it prevents. If every data member is public, any piece of code anywhere in your program can reach in and set any value directly. A bug that corrupts an object's state could be introduced from any file. When the program misbehaves, you have to search the entire codebase to find the culprit. With private data and a controlled public interface, the list of code that can modify the internal state is exactly the class itself — nowhere else. That is a much smaller search space.

## How it works

**Invariant enforcement**

An invariant is a condition that must always be true about an object. A public member offers no protection:

```cpp
struct BadTimer {
    int seconds{ 0 };  // public — anything can set this to -5
};
```

Contrast with a class that enforces a non-negative invariant:

```cpp
class Timer {
private:
    int m_seconds{ 0 };

public:
    void setSeconds(int s) {
        if (s < 0) s = 0;
        m_seconds = s;
    }
    int getSeconds() const { return m_seconds; }
};
```

Now `m_seconds` can never be negative, regardless of what any caller passes in. The class is self-protecting.

**Implementation can change without breaking callers**

Suppose you store a distance in centimeters today. Later you decide to store it in millimeters for higher precision. With a private member, only the class's own member functions need to change:

```cpp
class Distance {
private:
    int m_mm{ 0 };     // changed from m_cm — callers never knew

public:
    void setCentimeters(int cm) { m_mm = cm * 10; }
    int  getCentimeters() const { return m_mm / 10; }
};
```

Every caller still uses `setCentimeters` and `getCentimeters`. Nothing outside `Distance` needs to change. If `m_mm` had been public, every caller that accessed it directly would need to be updated.

**Debugging is faster**

When an invariant is violated — say, a timer goes negative — there is exactly one place to look: the class's own member functions. You do not have to grep 50 files. This is sometimes described as the "breadcrumbs" benefit: the trail of possible corruption is short and contained.

## Common mistakes

**Mistake 1: Making data public "just temporarily"**

It is tempting to make a member public to get something working quickly. In practice, once callers start using a public member directly, removing that access becomes a breaking change. Write the getter/setter from the start.

**Mistake 2: Believing encapsulation is only about security**

Encapsulation is primarily an engineering tool for correctness and maintainability, not a security boundary. The compiler enforces private access at compile time, which eliminates entire categories of bugs, but it is not designed to prevent a determined programmer from using `reinterpret_cast` to bypass it.

**Mistake 3: Confusing encapsulation with secrecy**

Private means "only accessible through this class's member functions." It does not mean the implementation is secret or hidden from the programmer who reads the class definition. The header file still shows the private members. Encapsulation is about controlling write paths, not about hiding text.

## When to use this

Apply encapsulation whenever a type has an invariant — a rule that must always hold true — or whenever you anticipate that the internal representation might change. That covers most non-trivial classes.

Skip it for simple passive data bundles where there is no invariant to protect. A `struct` with public members representing a 2D point or a color value is fine. When such a struct grows into something with rules (e.g., the x-coordinate must never exceed the y-coordinate), that is the moment to convert it to a class with private members.

The rule of thumb from the prior lessons holds: `struct` for passive data, `class` for objects with behavior and invariants.
