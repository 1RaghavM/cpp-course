## The idea

Back in chapter 11 you met function templates: one piece of source code with a placeholder type, from which the compiler stamps out a concrete function for every type you actually use. A function template is a recipe; the compiler does the cooking.

Class templates are the same idea applied to user-defined types instead of functions. You write a struct definition with a placeholder where a member type would normally appear, and the compiler stamps out a concrete struct for every type you instantiate. Think of a cookie cutter that takes a piece of paper saying "use this kind of dough" — bring chocolate dough and you get a chocolate cookie, bring sugar dough and you get a sugar cookie, but it is the same cutter.

Why bother? Without templates, if you want a pair of `int`s, a pair of `double`s, and a pair of `std::string`s, you write the same struct three times with the type swapped. The bodies are identical; only the type changes. That is exactly the kind of repetition the compiler should handle for you. The class template captures the shape once and lets the type vary.

## How it works

A class template is introduced by a `template` clause that names one or more placeholder types, followed by the struct definition that uses those placeholders. Here is the canonical example, a generic pair:

```cpp
#include <iostream>

template <typename T>
struct Pair
{
    T first;
    T second;
};

int main()
{
    Pair<int> p{ 1, 2 };
    std::cout << p.first + p.second << '\n';
    return 0;
}
```

`template <typename T>` says "the next thing depends on a type, which I will call `T` inside it". The struct uses `T` wherever the member type would normally be spelled out. To actually create a variable, you write `Pair<int>`: the compiler takes the template, substitutes `int` for every `T`, and produces a concrete type that behaves exactly as if you had hand-written `struct Pair { int first; int second; };`. The output is `3`.

`Pair<int>` and `Pair<double>` are different types. The compiler generates one instantiation per unique type argument you use. If you write `Pair<int>` in three different functions, the compiler only generates the int version once and reuses it.

A template can take more than one type parameter:

```cpp
#include <iostream>

template <typename T, typename U>
struct Tagged
{
    T value;
    U tag;
};

int main()
{
    Tagged<int, char> entry{ 42, 'A' };
    std::cout << entry.tag << ": " << entry.value << '\n';
    return 0;
}
```

Now `T` and `U` are independent placeholders. `Tagged<int, char>` is a different type from `Tagged<char, int>`. Member functions on a class template are templates too — if you defined `void print()` inside `Tagged`, the compiler would generate a separate `print` for each instantiation that uses it.

A class template definition usually lives in a header. Unlike ordinary functions, the compiler needs to see the full template body at every point of use, because it cannot generate the instantiated code from a declaration alone. Putting the whole template in a header is the standard workaround.

```cpp
template <typename T>
struct Box
{
    T contents;
};

// later, in any file that includes the header:
Box<int> a{ 7 };
Box<int> b{ 9 };
Box<double> c{ 3.14 };
```

`a` and `b` share one instantiation because they use the same type argument. `c` triggers a second instantiation for `double`. The compiler does this on demand: types you never use never get generated.

## Common mistakes

The first mistake is forgetting the template arguments when you declare a variable. The template name on its own is not a type:

```cpp
template <typename T>
struct Pair { T first; T second; };

Pair p{ 1, 2 };
```

`Pair` is a template, not a type. To get a type you must supply `Pair<int>`. The compiler diagnostic says exactly that — `missing template arguments before 'p'`. The next lesson covers CTAD, which lets the compiler deduce the argument in some cases, but until then the brackets are mandatory.

The second mistake is treating different instantiations as compatible. `Pair<int>` and `Pair<long>` are unrelated types as far as the type system is concerned — you cannot assign one to the other any more than you could assign a raw `int` to a raw `std::string`. Beginners often expect implicit conversion between instantiations and are surprised when the compiler refuses.

The third mistake is putting a class template's definition in a `.cpp` file instead of a header. The code compiles in the file that defines the template, but every other translation unit that tries to use it gets a linker error — there is no instantiated code to link to, because the compiler never saw the definition while compiling that file.

## When to use this

Reach for a class template when you find yourself writing the same struct two or three times with only the member types changing. The standard library uses this pattern heavily — `std::pair`, `std::array`, and the containers you will meet later are all class templates. Stick with a plain struct (chapter 13.7 onwards) when there is genuinely only ever one type involved; the template machinery costs extra compile time and a lot of extra error-message noise, and it is not worth paying that cost for a one-off shape. The next lesson shows how CTAD trims the syntactic overhead, and 13.15 introduces alias templates for naming common specializations.
