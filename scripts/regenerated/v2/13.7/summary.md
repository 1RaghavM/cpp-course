## The idea

Until now, every variable you have written holds exactly one value. An `int` holds one integer, a `double` holds one floating-point number, a `std::string` holds one sequence of characters. But the real world deals in groups: a point in 2D space has both an x-coordinate and a y-coordinate, a student has both a name and a grade, an employee has both an ID and a salary.

A struct lets you bundle multiple values of different types under a single name. Once you define the struct, you can create variables of that type and access each piece of data through the dot operator. Think of a struct as a form with named fields: the form type describes which fields exist, and each filled-in form is a separate variable that carries its own independent copy of every field.

Structs are the first example of a user-defined type that actually stores multiple pieces of data together. They are the foundation for almost every non-trivial data model you will write in C++.

## How it works

You define a struct with the `struct` keyword, a name, a pair of curly braces, the list of member declarations inside, and — critically — a semicolon after the closing brace:

```cpp
struct Point
{
    int x;
    int y;
};   // <-- semicolon is required
```

The definition only describes the shape of the type. To actually store data you declare a variable of that type, then use the dot operator (`.`) to reach each member and assign to it:

```cpp
#include <iostream>

struct Point
{
    int x;
    int y;
};

int main()
{
    Point p;   // creates a Point variable
    p.x = 3;   // assign the x member
    p.y = 4;   // assign the y member
    std::cout << "x=" << p.x << " y=" << p.y << '\n';   // x=3 y=4
    return 0;
}
```

Members can be of any type — ints, doubles, strings, even other structs or enums defined earlier:

```cpp
#include <iostream>
#include <string>

struct Employee
{
    int id;
    double salary;
    std::string name;
};

int main()
{
    Employee e;
    e.id     = 42;
    e.salary = 75000.0;
    e.name   = "Alice";
    std::cout << e.name << " earns " << e.salary << '\n';
    return 0;
}
```

You can have multiple variables of the same struct type. Each variable is entirely independent — modifying one does not affect the other:

```cpp
struct Point { int x; int y; };

int main()
{
    Point a;
    a.x = 1; a.y = 2;

    Point b;
    b.x = 5; b.y = 6;

    b.x = 99;  // only b is affected; a.x is still 1
    return 0;
}
```

The dot operator can both read and write. Reading a member on the right-hand side of an expression just retrieves its value; using it on the left-hand side assigns to it. You can also use a member in any expression where a value of its type would be legal: `a.x + b.x`, `e.salary * 1.1`, `e.name.size()`, and so on.

## Common mistakes

**Forgetting the semicolon after the closing brace.**

```cpp
struct Point
{
    int x;
    int y;
}   // BUG: missing semicolon
```

The error message is famously confusing — the compiler complains about the line that follows the struct definition rather than the struct itself. If the next line is `int main()`, the error often reads something like `expected ';' before 'int'`. The fix is always to add `;` after the closing `}` of the struct definition.

**Reading an uninitialized member.**

```cpp
#include <iostream>

struct Point { int x; int y; };

int main()
{
    Point p;
    std::cout << p.x << '\n';   // BUG: p.x has indeterminate value
    return 0;
}
```

Unlike `std::string`, which initializes itself to an empty string, the built-in numeric types inside a struct are not automatically zeroed. Reading them before assigning is undefined behavior. Assign every member before use, or use aggregate initialization (covered in lesson 13.8) which handles this cleanly.

**Defining a struct inside a function when it needs to be shared.**

```cpp
int main()
{
    struct Point { int x; int y; };   // local definition
    return 0;
}

void printPoint(Point p) { }   // BUG: Point is not visible here
```

A local struct definition is only visible within the block where it is defined. Struct definitions that are used across multiple functions should be placed at file scope — outside all functions, typically near the top of the file.

## When to use this

Use a struct any time two or more values always belong together conceptually. Coordinates, color channel values, date components, and name-score pairs are all natural candidates. Compared to passing individual variables separately, grouping them into a struct makes function signatures shorter, keeps related data from drifting apart, and lets you give the bundle a meaningful name. The assignment-style initialization shown here works for all cases; lesson 13.8 introduces aggregate initialization which gives you a more concise way to set all members at once. Later, lesson 13.10 covers passing and returning structs by value, and chapter 14 shows how the `class` keyword builds on everything structs introduce here.
