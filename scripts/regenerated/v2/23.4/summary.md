## The idea

Association is a "uses a" relationship between two otherwise independent objects. Neither object owns the other, and neither is a structural part of the other — they simply know about each other in some directional or bidirectional way. The relationship is often navigational: a `Doctor` has treated certain `Patient` objects; a `Course` has an assigned `Instructor`.

Unlike aggregation — where a container holds pointers to objects that are clearly "in" it — association describes a peer relationship where neither object is conceptually inside the other. The association may be stored (as a pointer or reference member in the class) or it may be purely transient (as a function parameter). Either way, neither side owns the other, and destroying one object should not destroy the other.

## How it works

A stored association keeps a pointer or reference to another object as a class member, but the class never calls `delete` on it and does not consider itself responsible for that object's lifetime:

```cpp
#include <string>

struct Patient {
    std::string name;
};

struct Doctor {
    std::string name;
    Patient* currentPatient{nullptr};  // associated — not owned

    void assignPatient(Patient* p) { currentPatient = p; }
    void clearPatient()            { currentPatient = nullptr; }
};
```

`Doctor` holds a pointer to a `Patient`, but the patient exists independently. The doctor can change which patient is currently assigned, and the patient can exist without a doctor. Neither creates nor destroys the other.

Bidirectional association is possible — both classes hold a pointer to each other. It requires care to avoid circular references and dangling pointers:

```cpp
struct Course;  // forward declaration

struct Instructor {
    std::string name;
    Course* teaching{nullptr};   // associated — does not own Course
};

struct Course {
    std::string title;
    Instructor* instructor{nullptr};  // associated — does not own Instructor

    void assign(Instructor* i) {
        instructor = i;
        i->teaching = this;
    }
};
```

When `Course::assign` is called, both objects know about each other. When either is destroyed, the other still exists — but its pointer becomes dangling. It is the caller's responsibility to clear these pointers when one side is about to be destroyed.

Transient association (as a function parameter) is the simpler form and avoids the lifetime problem entirely:

```cpp
struct Logger {
    void log(const std::string& message) { /* write to file */ }
};

struct OrderProcessor {
    void processOrder(int orderId, Logger& logger) {
        logger.log("Processing order " + std::to_string(orderId));
        // do work...
        logger.log("Order done");
    }
};
```

`OrderProcessor` uses a `Logger` during one function call. There is no stored relationship — no pointer member. Once the function returns, the association ends.

The difference in where the relationship is stored (class member vs function parameter) affects how long it lasts and which lifetime rules apply:

- Stored as a member: the association lasts as long as the object exists; watch for dangling pointers.
- Passed as a parameter: the association lasts only for the function call; no lifetime risk beyond keeping the argument alive for the duration.

## Common mistakes

**Not nulling out the association pointer after the associated object is destroyed.** If a `Doctor` holds a `Patient*` and the `Patient` is destroyed, the pointer becomes dangling. Accessing it is undefined behavior. The fix is to null out the pointer in the patient's destructor or to use an observer pattern:

```cpp
// Fragile: patient destroyed but doctor still has its address
Patient* p = new Patient{"Alice"};
Doctor d;
d.assignPatient(p);
delete p;                    // p destroyed
d.currentPatient->name;     // undefined behavior — dangling pointer
```

Use `d.clearPatient()` before deleting the patient, or check for nullptr before dereferencing.

**Mixing association and aggregation by accident.** If a class stores a pointer to an object it *did not receive from outside* (it created it internally), that is composition or aggregation, not association. Association specifically means the two objects come from independent sources and neither is the other's "part."

**Using a raw reference member to express a stored association.** A reference member can express an association, but it cannot be reseated — you cannot change which object it refers to after construction. A pointer (`T*`) is more flexible for stored associations that may change over time.

## When to use this

Use stored association when two objects genuinely need to maintain a navigational link over time — a `Course` that always knows its `Instructor`, or a `Node` in a graph that points to its neighbors. Use transient association (function parameters) when the link is short-lived and the receiving object only needs the other object for the duration of one operation.

Association is appropriate when neither object is logically "inside" the other and neither is responsible for the other's lifetime. If one object clearly creates and manages the other, that is composition. If one object holds pointers to objects it did not create, that is aggregation. If they are peers that merely reference each other, that is association.
