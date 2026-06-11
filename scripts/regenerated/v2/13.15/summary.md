## The idea

A type alias gives a long type a shorter name. You met the regular form in earlier chapters: `using Score = int;` lets you write `Score` wherever you meant a specific kind of `int`. The alias is not a new type — it is a synonym, like calling the same person by either their full name or a nickname. The compiler treats both spellings as identical.

An alias template extends this convenience to templates. When you have a class template that gets used in only a few shapes, you can give each common shape its own name. `MyPair<int>` can be made into shorthand for `Pair<int, int>`. The alias is parameterised — there is still a type parameter — but it pins down some of the underlying template's arguments so callers do not have to.

This is purely a naming tool. Nothing new is generated, no new type appears in the program, no extra work happens at runtime. An alias template is to a class template what a synonym is to a noun: a different way of pointing at the same thing.

## How it works

The basic syntax stacks `template` in front of an ordinary `using` declaration:

```cpp
#include <iostream>

template <typename T, typename U>
struct Pair
{
    T first;
    U second;
};

template <typename T>
using SameTypePair = Pair<T, T>;

int main()
{
    SameTypePair<int> p{ 1, 2 };
    std::cout << p.first + p.second << '\n';
    return 0;
}
```

`SameTypePair<T>` is an alias template. When you write `SameTypePair<int>`, the compiler expands it to `Pair<int, int>` and proceeds as if you had typed that directly. The output is `3`. There is no new struct; `SameTypePair<int>` and `Pair<int, int>` name the exact same type, and you can pass an object of one to a function expecting the other without any conversion.

Alias templates do not have to use all the parameters of the underlying template. They can also rename a parameter:

```cpp
#include <iostream>

template <typename Key, typename Value>
struct Entry
{
    Key k;
    Value v;
};

template <typename V>
using StringEntry = Entry<const char*, V>;

int main()
{
    StringEntry<int> e{ "score", 42 };
    std::cout << e.k << '=' << e.v << '\n';
    return 0;
}
```

Here `StringEntry<int>` expands to `Entry<const char*, int>`. The alias hides the fact that the key type is fixed, leaving only the value type to be supplied by the caller. The output is `score=42`.

Aliases compose with CTAD in a limited way — from C++20 onwards, CTAD works through alias templates so you can write `SameTypePair p{ 1, 2 };` and have the compiler deduce `T = int` and then expand to `Pair<int, int>`. Older compilers may require the explicit angle brackets, so it is worth testing on the version you target.

A common use is to give a small, sharper name to a frequently used standard-library type. If a project keeps reaching for `std::pair<std::string, int>`, defining `using Score = std::pair<std::string, int>;` removes the noise at every use site. If the project wants to vary the value type, an alias template — `template <typename V> using NamedValue = std::pair<std::string, V>;` — does the same job.

## Common mistakes

The first mistake is treating the alias as a distinct type. It is not. Two function overloads, one taking `SameTypePair<int>` and one taking `Pair<int, int>`, are not overloads at all — they are the same function signature, and the compiler rejects the second as a redefinition:

```cpp
template <typename T, typename U> struct Pair { T first; U second; };
template <typename T> using SameTypePair = Pair<T, T>;

void f(Pair<int, int>) {}
void f(SameTypePair<int>) {}
```

The error reads `redefinition of 'void f(Pair<int, int>)'`. The two names refer to the same type, so the second overload collides with the first.

The second mistake is expecting the alias to constrain what the underlying template will accept. Writing `SameTypePair<int>` does not make the underlying `Pair<int, int>` reject a non-pair argument — the alias only affects how you spell the type at the call site, not what the template body does. Any validation must happen in the template itself.

The third mistake is putting an alias template definition before the class template it refers to. The compiler reads the file top to bottom; if `Pair` is not yet visible when the `using` line appears, the alias fails to compile with `'Pair' was not declared in this scope`. Order matters.

## When to use this

Use alias templates whenever a class template's full spelling repeats so often that it adds noise. A shorter, domain-specific name (`Coordinate<T>` instead of `Pair<T, T>`) tells the next reader what role the type plays, not just what shape it has. Avoid them when the underlying template is already short and well-known — wrapping `std::array<T, 4>` in an alias adds an extra hop without saving anything. Combined with class templates (13.13) and CTAD (13.14), alias templates round out the small toolbox that chapter 13 gives you for naming and reusing structured types.
