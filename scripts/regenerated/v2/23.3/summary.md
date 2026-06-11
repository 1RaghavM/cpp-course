## The idea

Aggregation is the "has a" relationship where one object holds a reference or pointer to another object that it does *not* own. The contained object can exist independently of the container, may be shared across multiple containers simultaneously, and its lifetime is managed by something outside the aggregating class.

Think of a playlist and the songs in it. A playlist *references* songs, but deleting the playlist does not delete the songs — the songs still exist in your music library. Multiple playlists can reference the same song. That is aggregation: the container holds a pointer or reference to an externally-managed object.

The key difference from composition: in composition the sub-object is *part of* the parent and dies with it. In aggregation the sub-object has an independent existence and the parent merely *knows about* it.

## How it works

The most direct way to express aggregation in C++ is to store a pointer (or reference) to an object whose lifetime is managed elsewhere:

```cpp
#include <string>
#include <vector>

struct Student {
    std::string name;
};

class Classroom {
    std::vector<Student*> students;   // non-owning pointers
public:
    void enroll(Student* s) { students.push_back(s); }
    std::size_t count() const { return students.size(); }
};
```

Here `Classroom` aggregates `Student` objects. A `School` (or `main`) is responsible for creating and destroying the actual `Student` instances. The classroom just holds pointers. Destroying a `Classroom` does not destroy any `Student`.

The critical invariant: the aggregated objects must outlive every container that holds a pointer to them. If a `Student` is destroyed while a `Classroom` still holds a pointer to it, accessing that pointer is undefined behavior:

```cpp
Classroom* makeClassroom() {
    Student alice{"Alice"};          // local variable
    Classroom* c = new Classroom{};
    c->enroll(&alice);               // fine so far
    return c;                        // PROBLEM: alice destroyed here
    // caller now has a classroom with a dangling pointer
}
```

The fix is to ensure the students outlive the classroom. A typical pattern is to store the owning objects in a vector at a longer-lived scope, then fill classrooms with pointers to them:

```cpp
int main() {
    std::vector<Student> roster{{"Alice"}, {"Bob"}, {"Carol"}};
    Classroom c1, c2;
    c1.enroll(&roster[0]);
    c1.enroll(&roster[1]);
    c2.enroll(&roster[1]);   // Bob is in both classrooms — shared reference
    c2.enroll(&roster[2]);
    // roster outlives both classrooms: safe
}
```

Aggregation can also be expressed with `std::reference_wrapper` (for members that are conceptually non-nullable) or with `std::weak_ptr` when the objects are heap-managed via `std::shared_ptr`. In both cases the aggregating class holds a non-owning reference rather than a pointer it is responsible for deleting.

The destructor of an aggregating class has nothing to do with the aggregated objects — it does not call `delete` on any of its pointer members. This is the clearest signal that a class is aggregating rather than composing:

```cpp
class Classroom {
    std::vector<Student*> students;
public:
    ~Classroom() {
        // nothing — we do not own the students
    }
};
```

## Common mistakes

**Calling delete on aggregated pointers.** If the classroom destructor calls `delete` on each student pointer, it destroys objects it does not own. Those objects may still be pointed to elsewhere or may be managed (and will be deleted again) by their actual owner — a double-free:

```cpp
~Classroom() {
    for (Student* s : students)
        delete s;   // WRONG: we don't own these
}
```

Always ask: "who created this object?" If the answer is "not me," you should not delete it.

**Forgetting that a pointer in a class does not extend lifetime.** Storing a pointer in a class member does not keep the pointed-to object alive. If the student object is a local variable in a function that returns, the pointer in the classroom becomes dangling immediately. The compiler will not warn:

```cpp
void fillClassroom(Classroom& c) {
    Student temp{"Temp"};
    c.enroll(&temp);
    // temp destroyed here — c now holds a dangling pointer
}
```

**Confusing aggregation with composition when using unique_ptr.** A `std::unique_ptr<T>` member is *composition* (the class owns the heap-allocated object). A raw `T*` member where the class does not delete it is *aggregation*. The pointer type alone is not enough to classify the relationship; you have to look at whether the class manages the lifetime.

## When to use this

Use aggregation when objects naturally have independent lifetimes or when multiple containers need to refer to the same object simultaneously. A library catalog aggregates `Book` objects that exist in an inventory. A sports team aggregates `Player` objects who also belong to other rosters. A graph's edges aggregate `Node` objects that the graph itself owns in a separate container.

When you are unsure whether to compose or aggregate, ask: "Can this sub-object meaningfully exist without me?" If yes, aggregation. If no, composition. If the sub-objects are heap-managed and may be shared, `std::shared_ptr` for ownership combined with `std::weak_ptr` for non-owning references is the modern idiom for aggregation.
