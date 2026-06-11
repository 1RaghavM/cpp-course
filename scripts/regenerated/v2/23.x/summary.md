## The idea

Chapter 23 explored five distinct ways objects can relate to each other: composition, aggregation, association, dependency, and container relationships. Each relationship is defined by two properties — ownership (who is responsible for creating and destroying the other object) and lifetime (how long one object lives relative to the other).

Think of these relationships as a spectrum from tight coupling to loose coupling. A heart is part of a person and cannot outlive them (composition). A department contains employees but an employee can exist without a department and join another (aggregation). A doctor knows about patients but neither creates nor owns them (association). A printer function uses an object briefly and forgets it immediately (dependency). A container class holds a homogeneous collection and manages its members' storage (container class with `std::initializer_list`).

Recognizing which relationship you need before you write a single line of code shapes every design decision that follows: what the constructor receives, what the destructor does, whether to store by value or by pointer, and whether to build a full container.

## How it works

**Composition: part-of with ownership**

The contained object is created inside the owner and destroyed with it. Store it as a value member or in a `std::unique_ptr`. There is no way to extract the part and hand it to someone else.

```cpp
class Engine {
    int horsepower_;
public:
    explicit Engine(int hp) : horsepower_{hp} {}
    int hp() const { return horsepower_; }
};

class Car {
    Engine engine_;          // Engine is part of Car; lives and dies with it
    std::string model_;
public:
    Car(std::string m, int hp) : model_{std::move(m)}, engine_{hp} {}
    void describe() const {
        std::cout << model_ << " (" << engine_.hp() << " hp)\n";
    }
};
```

`engine_` is constructed when `Car` is constructed and destroyed when `Car` is destroyed. No code outside `Car` ever sees or touches the `Engine`.

**Aggregation: has-a with non-ownership**

The contained object is created outside and passed in. Store it as a pointer or reference. The owner does not delete it.

```cpp
class Student {
    std::string name_;
public:
    explicit Student(std::string n) : name_{std::move(n)} {}
    const std::string& name() const { return name_; }
};

class Classroom {
    Student* students_[30];
    int count_{0};
public:
    void add(Student* s) { students_[count_++] = s; }
    void roll() const {
        for (int i = 0; i < count_; ++i)
            std::cout << students_[i]->name() << "\n";
    }
};
```

`Student` objects are created elsewhere and outlive any particular `Classroom` they pass through. `Classroom` just holds pointers — no `new`, no `delete`.

**Association: uses-a without part-of**

Two independent objects that know about each other but neither owns nor is part of the other. Typically implemented as a pointer stored in one class that points at the other, or a reference passed to a function.

**Dependency: temporary uses-a**

The user object receives the other object as a function argument and uses it only for the duration of that call. No member variable stores it. This is the loosest coupling possible.

**Container classes and `std::initializer_list`**

A container class owns and manages a homogeneous collection. When you add a constructor that accepts `std::initializer_list<T>`, users can initialize the container with a brace list. `std::initializer_list<T>` provides `.size()`, `.begin()`, and `.end()`. The constructor must copy the values out of the list into its own storage before the list's temporary backing array is destroyed.

```cpp
#include <initializer_list>

class IntBag {
    int data_[16]{};
    int count_{0};
public:
    IntBag(std::initializer_list<int> list) {
        for (int v : list)
            data_[count_++] = v;
    }
    int size()     const { return count_; }
    int get(int i) const { return data_[i]; }
};

// usage
IntBag bag{3, 1, 4, 1, 5};   // five elements
```

An important subtlety: when both a list constructor and a matching non-list constructor exist, braces prefer the list constructor. `std::vector<int>{3, 5}` gives two elements (3 and 5), not three fives.

## Common mistakes

**Storing an `std::initializer_list` as a member variable**

The backing array for an initializer list is a temporary that lives only for the duration of the constructor call. Storing the `std::initializer_list` object in a member variable creates a dangling reference — the pointer inside the list is stale the moment the constructor returns.

```cpp
class Bad {
    std::initializer_list<int> stored_;   // DANGEROUS
public:
    Bad(std::initializer_list<int> l) : stored_{l} {}
    int first() { return *stored_.begin(); }  // undefined behaviour
};
```

Fix: copy the values into your own array or vector during construction.

**Using `delete` in an aggregating container**

In aggregation, the container does not own the objects. Calling `delete` on a stored pointer in the destructor destroys an object the container never created, leading to a double-free if the original owner also destroys it.

```cpp
class BadRoom {
    Student* students_[30];
    int count_{0};
public:
    ~BadRoom() {
        for (int i = 0; i < count_; ++i)
            delete students_[i];   // WRONG: BadRoom doesn't own these
    }
};
```

**Confusing `std::vector<T>(n, v)` with `std::vector<T>{n, v}`**

Parentheses call the count-and-fill constructor; braces call the initializer-list constructor. `std::vector<int>(3, 5)` creates three fives. `std::vector<int>{3, 5}` creates two elements: 3 and 5. This is a direct consequence of how initializer-list constructors are preferred over other constructors when braces are used.

## When to use this

Use composition when the contained object is an intrinsic part of the owner and has no identity independent of it. Use aggregation when objects need to participate in multiple containers or outlive any one of them. Use association when two objects simply need to know about each other without either owning the other. Use dependency when an object is needed only transiently — pass it as a function argument instead of storing it.

Container classes with `std::initializer_list` constructors are appropriate any time you build a homogeneous collection that users will want to initialize from a literal list of values — the same way they initialize `std::vector`. For all other OOP relationships and type modeling, returning to this chapter's decision tree — ownership? lifetime? is-it-a-part? — will guide the correct design.
