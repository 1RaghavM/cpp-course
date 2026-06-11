## The idea

When you write `2 + 3 * 4`, do you get 20 or 14? You get 14, because multiplication happens before addition. That rule — which operations go first and how ties are broken — is called **operator precedence and associativity**. Every language that has operators needs these rules, and C++ has a complete, well-defined table of them.

Precedence tells you which operator binds tighter. A higher-precedence operator grabs its operands before a lower-precedence one gets a chance. Associativity settles ties among operators at the *same* precedence level: left-to-right means you evaluate from the left side first, right-to-left means you start from the right.

Think of precedence like the order of operations you learned in school: parentheses first, then exponents, then multiplication/division, then addition/subtraction. C++ extends this idea to dozens of operators — function calls, subscripts, unary operators, relational comparisons, logical operators, and assignment all have fixed positions in the table. You do not need to memorize the whole table; you just need to know it exists, understand the major tiers, and reach for parentheses whenever something is ambiguous.

## How it works

The precedence and associativity rules are applied by the compiler when it **parses** your expression into a tree. The tree determines evaluation order. You can always override the default grouping with parentheses.

**Example 1: Precedence in action**

```cpp
#include <iostream>

int main()
{
    int result = 2 + 3 * 4;   // * has higher precedence than +
    std::cout << result << '\n'; // prints 14, not 20
    return 0;
}
```

The compiler sees `3 * 4` first (precedence 5) and then adds 2 (precedence 6 is lower). The tree is `2 + (3 * 4)`. Parentheses let you force a different grouping:

```cpp
#include <iostream>

int main()
{
    int result = (2 + 3) * 4;  // parentheses override precedence
    std::cout << result << '\n'; // prints 20
    return 0;
}
```

**Example 2: Associativity with subtraction**

All four basic arithmetic operators (`+`, `-`, `*`, `/`) associate left-to-right when they appear at the same level. That means `10 - 3 - 2` is parsed as `(10 - 3) - 2`, not `10 - (3 - 2)`.

```cpp
#include <iostream>

int main()
{
    int a = 10 - 3 - 2;  // left-to-right: (10-3)-2 = 5
    int b = 10 - (3 - 2); // parentheses change meaning: 10-1 = 9
    std::cout << a << '\n'; // prints 5
    std::cout << b << '\n'; // prints 9
    return 0;
}
```

**Example 3: Assignment is right-to-left**

Assignment (`=`) associates right-to-left. That is what makes chained assignment work — each `=` grabs the value from its right side first.

```cpp
#include <iostream>

int main()
{
    int x = 0;
    int y = 0;
    x = y = 5;  // right-to-left: y=5 first, then x=5
    std::cout << x << ' ' << y << '\n'; // prints 5 5
    return 0;
}
```

The major precedence tiers you will use most often, from highest to lowest:

- Function call `()`, subscript `[]`
- Unary operators: `+x`, `-x`, `!x`, `++x`, `--x`
- Multiplication, division, remainder: `*`, `/`, `%`
- Addition, subtraction: `+`, `-`
- Comparison: `<`, `>`, `<=`, `>=`
- Equality: `==`, `!=`
- Logical AND: `&&`
- Logical OR: `||`
- Assignment: `=`, `+=`, `-=`, etc.

## Common mistakes

**Mistake 1: Assuming addition and multiplication have equal priority**

A common assumption coming from reading left-to-right: "I wrote `a + b * c`, so addition happens first because it comes first." The compiler does not read left-to-right when building the parse tree — it applies precedence. Multiplication always wins over addition regardless of position.

```cpp
int a = 1 + 2 * 3;   // you might expect 9 (left-to-right reading)
                      // actual result: 7 (2*3 first, then +1)
```

If you want left-to-right behavior, add parentheses: `(1 + 2) * 3`.

**Mistake 2: Comparing with `==` in a chain**

In mathematics, `1 < x < 10` means "x is between 1 and 10." In C++ this compiles but does something completely different. The comparison operators are left-associative, so `1 < x < 10` parses as `(1 < x) < 10`. The first comparison produces `0` or `1` (a bool), and then you compare that small integer against 10 — which is always true.

```cpp
int x = 50;
bool result = 1 < x < 10;  // parsed as (1 < x) < 10
                             // (1 < 50) is true -> 1 (int), then 1 < 10 is true
                             // result is true even though 50 is NOT in [1,10]!
```

The correct way is `x > 1 && x < 10` (using the logical AND operator, which you will learn later in this chapter).

**Mistake 3: Forgetting that assignment has very low precedence**

Assignment sits near the bottom of the precedence table. This surprises people when they mix it with comparisons or arithmetic in the same expression without parentheses.

```cpp
int x = 0;
bool test = x = 5;  // assigns 5 to x, then converts 5 to bool (true)
                    // this compiles; it does NOT compare x to 5
```

The intent was probably `bool test = (x == 5);`. Using `=` where you meant `==` is a classic C++ bug and one reason some style guides ban assignment inside conditions.

## When to use this

You do not reach for a "precedence rule" deliberately — the rules apply automatically every time you write an expression. What you do reach for is **parentheses** whenever you have any doubt about grouping. Parentheses are free: they do not slow down your program and they make intent unmistakable to the next reader (often yourself six months later).

Keep the precedence table bookmarked when you are learning. After a few weeks the common tiers (`*`/`/` over `+`/`-`, comparisons over `&&`/`||`, all of those over `=`) will be automatic. Right-to-left associativity appears almost exclusively with assignment; everything else you will encounter is left-to-right.
