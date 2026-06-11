## The idea

A container class is a class whose primary purpose is to hold and manage a collection of other objects. `std::vector`, `std::array`, and `std::string` are the most familiar examples from the standard library, but you can write your own container classes whenever none of the standard ones fits your needs.

Container classes are a natural application of the object-relationship ideas from earlier in this chapter. A container *composes* the storage for its elements (it owns them) and provides an interface for adding, removing, and accessing those elements. The storage is usually a dynamically-allocated array managed internally, hidden behind a clean public interface: `add`, `remove`, `size`, `operator[]`, and so on.

Writing a simple container from scratch is one of the best exercises for solidifying understanding of dynamic memory management, constructors, destructors, and the copy-control idioms introduced in earlier chapters.

## How it works

A minimal integer stack that composes a heap-allocated array illustrates the core ideas:

```cpp
class IntStack {
    int* data{nullptr};
    std::size_t size_{0};
    std::size_t capacity_{0};

    void grow() {
        std::size_t newCap = (capacity_ == 0) ? 1 : capacity_ * 2;
        int* newData = new int[newCap];
        for (std::size_t i = 0; i < size_; ++i)
            newData[i] = data[i];
        delete[] data;
        data = newData;
        capacity_ = newCap;
    }
public:
    ~IntStack() { delete[] data; }

    void push(int value) {
        if (size_ == capacity_) grow();
        data[size_++] = value;
    }

    int top() const { return data[size_ - 1]; }
    void pop()      { --size_; }
    bool empty() const { return size_ == 0; }
    std::size_t size() const { return size_; }
};
```

The class owns the array pointed to by `data`. The destructor releases it. `push` expands capacity automatically, hiding the reallocation detail from users.

Notice the rule-of-three concern: if you copy an `IntStack` using the default copy constructor, both copies point to the same `data` array, and both destructors will call `delete[]` on it — a double-free. A real container must implement a copy constructor and copy-assignment operator (or delete them). For this lesson, the key insight is that the container owns its elements and is responsible for their lifetime.

A container class can also wrap a fixed-size array without dynamic allocation:

```cpp
class FixedIntQueue {
    int data[8]{};
    int head_{0};
    int tail_{0};
    int count_{0};
public:
    void enqueue(int v) {
        data[static_cast<std::size_t>(tail_)] = v;
        tail_ = (tail_ + 1) % 8;
        ++count_;
    }
    int dequeue() {
        int v = data[static_cast<std::size_t>(head_)];
        head_ = (head_ + 1) % 8;
        --count_;
        return v;
    }
    int count() const { return count_; }
};
```

Here the storage is a composed array member — no dynamic allocation needed. Copying the class copies the entire array correctly with the default copy constructor because there are no pointers.

A container's interface typically includes:

- A way to add elements (`push`, `add`, `insert`, `enqueue`)
- A way to remove elements (`pop`, `remove`, `dequeue`)
- A way to query state (`size`, `empty`, `count`)
- A way to access elements (`operator[]`, `top`, `front`, `back`)
- A destructor that releases resources if dynamic allocation is used

## Common mistakes

**Forgetting to delete the array in the destructor.** If the container uses `new[]` and the destructor does not call `delete[]`, every container object leaks memory when it goes out of scope:

```cpp
~IntStack() {
    // MISSING: delete[] data;
}
```

Always pair every `new[]` with a `delete[]` in the destructor.

**Off-by-one errors in size tracking.** When elements are added, `size_` must be incremented after writing to `data[size_]`, not before. Writing to `data[size_]` then doing `++size_` is correct; doing `++size_` then writing to `data[size_]` skips index 0 and eventually writes out of bounds:

```cpp
// WRONG: increments first, then writes — skips index 0
data[++size_] = value;

// RIGHT: writes at current size, then increments
data[size_++] = value;
```

**Copying a container that has a raw pointer without a deep copy.** The default copy constructor copies the pointer value, not the pointed-to data. Two containers then share the same array, and both destructors try to free it:

```cpp
IntStack a;
a.push(1);
IntStack b = a;   // default copy — b.data == a.data
// Both destructors call delete[] on the same address → undefined behavior
```

The fix is a user-defined copy constructor that allocates a new array and copies the data.

## When to use this

Write a custom container class when you need a data structure with specific invariants, access patterns, or performance properties that standard containers do not provide — for example, a circular buffer, a priority queue with a custom eviction policy, or a fixed-capacity stack that never allocates. In most real code, `std::vector`, `std::deque`, or `std::stack` will do the job without any custom implementation. Custom containers are primarily a teaching tool and an occasional necessity for highly constrained environments.
