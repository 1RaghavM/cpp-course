## The idea

C++ classes protect their private members from outside access — that is the whole point of encapsulation. But sometimes a function that is not a member of a class genuinely needs to see that class's private data. Rather than making the data public (which exposes it to everyone) or adding a getter (which exposes it forever), C++ lets you grant a specific function special access with the `friend` keyword. A **friend non-member function** is a standalone function — not a member of the class — that has been explicitly invited to see private and protected members.

Think of a private room in a hotel. Normally only the guest with the key can enter. But the hotel housekeeper is granted access even though they are not the guest — they have been specifically authorized. Friends in C++ work the same way: the class grants access to specific outsiders, not to everyone.

## How it works

You declare the friend function *inside* the class body with the `friend` keyword. The declaration there is not a member function — it is a statement granting access. The actual function definition lives outside the class as a free function.

```cpp
#include <iostream>

class Box {
    double m_length;
    double m_width;
public:
    Box(double l, double w) : m_length{ l }, m_width{ w } {}

    friend double area(const Box& b);  // grant access — not a member
};

double area(const Box& b) {    // defined as a free function
    return b.m_length * b.m_width;  // can access private members
}

int main() {
    Box myBox{ 3.0, 4.0 };
    std::cout << area(myBox) << "\n";  // 12
}
```

The function `area` is called without any class-name prefix — it is a free function, called like any other free function. The `friend` declaration inside `Box` simply says "this specific function is permitted to read our private members." Access is granted by the class, not claimed by the function.

You can also define the friend function directly inside the class body — the `friend` keyword and the function body together:

```cpp
class Temperature {
    double m_celsius;
public:
    Temperature(double c) : m_celsius{ c } {}

    friend double toFahrenheit(const Temperature& t) {
        return t.m_celsius * 9.0 / 5.0 + 32.0;
    }
};
```

When a friend function is defined inside the class body like this, it is still a non-member free function — it just lives textually inside the class definition. It does not have `this`. Call it as `toFahrenheit(temp)`, not as `temp.toFahrenheit()`.

**Operator overloading** is the most common real-world use of friend non-member functions. The `<<` operator used with `std::cout` needs to take an `ostream` as its left operand, so it cannot be a member function of your class. It becomes a friend:

```cpp
#include <iostream>

class Point {
    int m_x;
    int m_y;
public:
    Point(int x, int y) : m_x{ x }, m_y{ y } {}

    friend std::ostream& operator<<(std::ostream& out, const Point& p) {
        out << "(" << p.m_x << ", " << p.m_y << ")";
        return out;
    }
};

int main() {
    Point pt{ 3, 7 };
    std::cout << pt << "\n";   // (3, 7)
}
```

The `operator<<` function takes two parameters — `out` on the left, `p` on the right — and returns `out` so you can chain `<<` calls. It accesses `m_x` and `m_y` directly because the `Point` class declared it a friend.

## Common mistakes

**Thinking the friend function is a member function.** Because the `friend` declaration appears inside the class body, beginners sometimes call it as if it were a method: `myBox.area()`. That is a compile error — `area` is a free function. The call is `area(myBox)`.

```cpp
Box myBox{ 3.0, 4.0 };
myBox.area();         // WRONG — area is not a member
area(myBox);          // CORRECT
```

**Forgetting to pass the object as a parameter.** Since a friend non-member function has no `this`, it receives the object through an explicit parameter. A common mistake is declaring the friend correctly but then writing the definition as if it has access to `this`:

```cpp
double area(const Box& b) {
    return m_length * m_width;  // WRONG: m_length is not in scope; use b.m_length
}
```

The members are accessed through the parameter `b`, not through an implicit `this`.

**Overusing `friend`.** The friend mechanism exists for specific cases where tight coupling between a free function and a class is genuinely justified (operator overloading being the prime example). Using `friend` to avoid designing a proper interface is a code smell. If you find yourself granting friend access to many unrelated functions, consider whether your class's public interface is insufficient and needs member functions or getter methods instead.

## When to use this

Friend non-member functions are most justified for operator overloading — particularly `operator<<`, `operator>>`, and binary arithmetic operators where the left operand is not the class. They also appear in cases where a utility function logically operates on two different classes and should not belong to either one.

Avoid friends when a proper member function would serve the same purpose. A function that only ever needs to read data can often be satisfied by a `const` getter instead of a friend declaration. Reserve `friend` for situations where keeping the function as a free function (rather than a member) meaningfully improves the design or is required by the language (as with `operator<<`).
