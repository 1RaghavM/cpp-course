## The idea

Programs that do interesting things almost always model real-world objects, and real-world objects are almost never isolated. A car has an engine. A library holds books. A doctor treats patients. A function depends on a utility class. These connections between objects are *object relationships*, and choosing the right kind of relationship is one of the most consequential design decisions you make when writing C++ classes.

Object relationships fall into a handful of recognizable patterns, each with a different level of ownership, coupling, and lifetime dependency. Understanding these patterns gives you a vocabulary for talking about design, and more importantly, it guides how you translate "a car has an engine" into concrete C++ code. The same object interaction can be expressed several ways — and picking the wrong one silently creates bugs, resource leaks, or code that is hard to extend.

This lesson introduces the five main relationship types you will see across a C++ codebase. Later lessons in this chapter dive into the implementation of each one.

## How it works

The five relationship types, from strongest to weakest coupling:

**Composition** ("part of") — one object owns another object as a permanent part. The contained object cannot exist independently; its lifetime is entirely managed by the outer object. A `Heart` belongs to a `Person` — when the person is destroyed, the heart goes with it. This is the most common relationship in C++ classes, and the default to reach for when in doubt.

**Aggregation** ("has a") — one object holds a reference or pointer to another object, but does not own it. The contained object can exist independently and may be shared by multiple containers. A `Classroom` has `Student` objects, but the students also exist outside that classroom and belong to their own lives. The classroom's destructor does nothing to the students.

**Association** ("uses a") — two otherwise unrelated objects know about each other temporarily. The relationship is often directional and may be transient. A `Doctor` treats a `Patient`: the doctor object holds a reference to a patient (perhaps as a function parameter), but neither owns the other.

**Dependency** ("depends on") — the weakest relationship: one object uses another in a brief, local scope without storing it as a member. A function that accepts a `Logger&` parameter *depends on* `Logger`, but the dependency lasts only for the duration of the call.

**Inheritance** ("is a") — a derived class is a specialization of a base class and inherits its interface and implementation. A `Dog` is an `Animal`. Inheritance is the most complex relationship and is covered separately in a later chapter.

Here is a quick illustration showing composition versus aggregation side by side:

```cpp
// Composition: Engine is created and destroyed with Car
struct Engine { int horsepower{}; };
struct Car {
    Engine engine;          // owned directly — part of Car's storage
};

// Aggregation: Classroom holds a pointer to Students it doesn't own
struct Student { std::string name; };
struct Classroom {
    std::vector<Student*> students;  // pointers to externally owned objects
};
```

```cpp
// Association: Doctor has a temporary relationship with a Patient
struct Patient { std::string name; };
struct Doctor {
    void treat(Patient& p) {         // no member variable — just a parameter
        // diagnose and treat p
    }
};
```

```cpp
// Dependency: Logger is used for one call only
struct Logger {
    void log(const std::string& msg) { /* ... */ }
};

struct ReportGenerator {
    void generate(Logger& logger) {  // dependency via parameter
        logger.log("Report started");
    }
};
```

The key questions to ask when classifying a relationship:

- Does the outer object *create* and *destroy* the inner one? → Composition
- Does the outer object *hold a reference* but not control lifetime? → Aggregation
- Does the relationship exist as a *stored pointer/reference but among peers*? → Association
- Does the relationship exist only *within a function call*? → Dependency
- Does one type *extend* the other's interface? → Inheritance

## Common mistakes

**Treating every "has a" as composition.** If a `School` class stores `std::vector<Student>` by value, those students are destroyed with the school. That may be correct for a toy example, but in a real system where students exist across multiple enrollments, you want aggregation (`std::vector<Student*>` or `std::vector<std::shared_ptr<Student>>`). Using composition when the lifetime should be independent creates dangling-reference bugs or premature destruction.

**Using raw pointers for aggregation without thinking about lifetime.** Aggregation stores a non-owning pointer or reference. If the pointed-to object is destroyed first, the pointer becomes dangling. The compiler will not warn you:

```cpp
Classroom* buildClassroom() {
    Student s{"Alice"};
    Classroom c;
    c.students.push_back(&s);   // s will be destroyed when function returns
    return new Classroom(c);    // dangling pointer in the returned classroom
}
```

The fix is to ensure that the owner of the pointed-to objects has a longer lifetime than the container, or to use `std::shared_ptr`/`std::weak_ptr` to express shared ownership and non-owning references respectively.

**Conflating association and aggregation.** Association involves a *use* relationship that is usually temporary or navigational (a function parameter, a search result). Aggregation involves a persistent *part-of* relationship stored as a member. Storing a raw pointer as a class member is almost always aggregation; passing a reference as a function argument is almost always association or dependency.

## When to use this

Composition is the workhorse of C++ OOP — use it whenever an object fully owns and controls the lifetime of its parts. Aggregation is the next step when objects need to be shared or when their lifetimes are managed elsewhere (for example by a factory or a container that predates any individual user). Association covers navigational relationships where two objects know about each other without ownership. Dependency is fine for utility objects passed as function parameters.

When the design feels ambiguous, default to the relationship with the least coupling. If composition works, prefer it over aggregation because it eliminates lifetime management complexity. Only reach for raw pointers or stored references when you genuinely need aggregation or association semantics — and consider whether a smart pointer (`std::shared_ptr`, `std::weak_ptr`) expresses the intent more clearly than a raw pointer.
