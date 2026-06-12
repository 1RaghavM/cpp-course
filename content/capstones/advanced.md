# Capstone: Build a Geometry Studio in C++

You've worked with shapes since grade school, but a real geometry program is more than formulas — it's a polymorphic system where many different kinds of shapes live behind one common interface, get stored together, and answer questions about themselves on demand. In this capstone you'll build **Geometry Studio**, a small command-driven C++ program that reads shape commands from standard input, stores them through smart pointers behind an abstract base class, and reports statistics on request. By the end you'll have exercised every load-bearing topic from the Advanced part: inheritance, virtual functions, abstract base classes, smart pointers, class templates, exceptions, and string streams.

## What you'll build

Geometry Studio reads one command per line from standard input. Each command either constructs a shape and adds it to the collection (`circle 3`, `rectangle 4 5`, `triangle 3 4 5`), inspects the collection (`list`, `summary`, `stats`), or stops the program (`quit`). All numeric output is formatted with two digits after the decimal point. Bad input — an unknown command, a non-positive dimension, or a triangle that violates the triangle inequality — is caught by a `try`/`catch` block and reported as a single `ERROR: <reason>` line, after which the program keeps accepting commands. Internally, every shape is stored polymorphically as a `std::unique_ptr<Shape>` inside the same `std::vector`, and the `stats` command runs through a generic `Stats<T>` class template that works on any numeric type, not just `double`.

## Milestone 1: shape hierarchy with virtual area and perimeter

**Goal:** Set up the abstract base class `Shape` with pure virtual `name()`, `area()`, and `perimeter()` methods plus a virtual destructor, then implement two concrete shapes — `Circle` and `Rectangle`. Read one shape per line and immediately print its name, area, and perimeter.

**Acceptance criteria:** A line like `circle 3` prints `added circle area=28.27 perimeter=18.85`. A line like `rectangle 4 5` prints `added rectangle area=20.00 perimeter=18.00`. All numeric output uses `std::fixed` with `setprecision(2)`. The `quit` command ends the program.

**Hint:** Make `Shape::area()` and `Shape::perimeter()` pure virtual, give `Shape` a virtual destructor, and use the literal `3.14159265358979323846` for circle math.

## Milestone 2: triangle via inheritance

**Goal:** Add a third concrete shape, `Triangle`, that stores three sides and computes area using Heron's formula. It must derive from the same `Shape` interface as `Circle` and `Rectangle`, so no calling code has to know it exists.

**Acceptance criteria:** A `triangle 3 4 5` line prints `added triangle area=6.00 perimeter=12.00`. The order in which you read mixed shape commands does not change the per-line output for previously implemented shapes.

**Hint:** Heron's formula: if `s = (a+b+c)/2`, then `area = sqrt(s*(s-a)*(s-b)*(s-c))`. Use `<cmath>` for `std::sqrt`.

## Milestone 3: store shapes polymorphically with smart pointers

**Goal:** Stop printing-and-forgetting. Keep every constructed shape in a `std::vector<std::unique_ptr<Shape>>` and add two new commands: `list` (one line per shape: `<index> <name> area=<a> perimeter=<p>`) and `summary` (single line: `count=<n> total_area=<sum>`).

**Acceptance criteria:** After adding a circle of radius 1 and a rectangle 2 by 3, the `list` command prints `0 circle area=3.14 perimeter=6.28` then `1 rectangle area=6.00 perimeter=10.00`. The `summary` command then prints `count=2 total_area=9.14`.

**Hint:** Construct each shape with `std::make_unique<...>(...)`, then `shapes.push_back(std::move(p))`. Iterate the vector with `for (const auto& s : shapes)` and call virtual methods through `s->area()`.

## Milestone 4: a generic Stats class template

**Goal:** Introduce a class template `Stats<T>` that stores a sequence of `T` values and exposes `min()`, `max()`, and `avg()`. Use two instances of `Stats<double>` to power a new `stats` command that prints min/max/avg of both areas and perimeters across the current collection.

**Acceptance criteria:** With one circle of radius 1 and one rectangle 2 by 3, `stats` prints two lines — `area min=3.14 max=6.00 avg=4.57` then `perimeter min=6.28 max=10.00 avg=8.14`. When the collection is empty, `stats` prints `no shapes` instead.

**Hint:** A class template starts with `template <typename T> class Stats { ... };`. A `std::vector<T>` inside is fine; min/max can be plain loops, and avg is `sum / static_cast<T>(count)`.

## Milestone 5: validation with exceptions and std::istringstream

**Goal:** Define a custom exception type `ShapeError` deriving from `std::runtime_error`. Parse each command line with `std::istringstream` and `throw ShapeError` from shape constructors (or the parser) on bad input. In `main`, wrap each command in a `try`/`catch (const ShapeError&)` block that prints `ERROR: <message>` on one line and keeps the loop running.

**Acceptance criteria:** `circle -2` prints `ERROR: circle radius must be positive`. `triangle 1 2 5` prints `ERROR: triangle inequality violated`. `pentagon 5` prints `ERROR: unknown shape: pentagon`. None of these errors abort the program — subsequent valid commands still work.

**Hint:** Make `ShapeError` a class deriving from `std::runtime_error` with an `explicit ShapeError(const std::string&)` constructor that forwards to the base. Catch by `const ShapeError&` and call `e.what()`.

## Stretch goals

- Add a `Pentagon`, `Hexagon`, or general `RegularPolygon` shape without touching `main` or `Stats`.
- Add a `save <filename>` command that uses `<fstream>` to persist the collection, plus `load <filename>` to read it back.
- Add a `Stats<int>` specialization that also reports the median.
- Use `std::move_if_noexcept` when growing the vector to study how moves interact with exceptions.

## Topics you'll use

- (24.1) Introduction to inheritance
- (24.2) Basic inheritance in C++
- (24.4) Constructors and initialization of derived classes
- (25.2) Virtual functions and polymorphism
- (25.3) The override and final specifiers
- (25.4) Virtual destructors
- (25.7) Pure virtual functions and abstract base classes
- (26.1) Template classes
- (27.2) Basic exception handling
- (27.5) Exceptions, classes, and inheritance
- (28.4) Stream classes for strings
