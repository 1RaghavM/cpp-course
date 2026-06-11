## The idea

When you use a C-style array in most expressions, it silently transforms into a pointer to its first element. This transformation is called *array decay*. Think of it as an automatic narrowing: the rich "I know my size and my type" array object shrinks down to a bare pointer that knows only its address and the type of one element. The array "decays" from a complete type into a lesser one.

Decay is not a bug—it is a deliberate language rule that lets C-style arrays be passed cheaply to functions. But it is the root cause of the most notorious C++ pitfall with C-style arrays: once decay happens, `sizeof` and range-for both stop working correctly, and you need another way to know how many elements you have.

## How it works

**Example 1 — when decay occurs**

```cpp
#include <iostream>

void print(int* ptr) {
    std::cout << *ptr << '\n';    // prints first element only
}

int main() {
    int nums[4]{ 10, 20, 30, 40 };
    print(nums);    // nums decays to int* pointing at nums[0]
}
```

When `nums` is passed to `print`, the compiler sees that `print` expects an `int*` and that `nums` is an `int[4]`. It automatically converts `nums` into a pointer to its first element—`&nums[0]`—and passes that pointer. The function receives only the address; it has no idea the array has 4 elements.

**Example 2 — sizeof after decay**

```cpp
#include <iostream>

void showSize(int* arr) {
    // sizeof(arr) here is the size of a pointer, not the array
    std::cout << sizeof(arr) << '\n';   // prints 8 (on 64-bit: pointer size)
}

int main() {
    int data[5]{};
    std::cout << sizeof(data) << '\n';  // 20 (5 * 4 bytes per int)
    showSize(data);                      // data decays; sizeof misleads inside
}
```

Inside `main`, `sizeof(data)` is 20 because `data` is still the array type. After passing to `showSize`, `arr` is just a pointer, so `sizeof(arr)` is 8 (the size of a pointer on a 64-bit system). This is why the `sizeof(arr) / sizeof(arr[0])` trick for computing element count breaks the moment the array crosses a function boundary.

**Example 3 — passing with an explicit size**

The standard C idiom to work around lost size information is to pass the count separately:

```cpp
#include <iostream>

void printAll(const int* arr, int count) {
    for (int i = 0; i < count; ++i) {
        std::cout << arr[i] << '\n';
    }
}

int main() {
    int vals[3]{ 7, 14, 21 };
    printAll(vals, 3);   // pass both pointer and count
}
```

This is the canonical C-style pattern. It works correctly but is error-prone: nothing stops you from passing a wrong count. `std::array` (or `std::span`, if introduced later) solves this by keeping size and data together.

## Common mistakes

**Mistake 1 — using range-for on a decayed pointer**

```cpp
void loop(int* arr) {
    for (int v : arr) {  // compile error: can't range-for over a pointer
        std::cout << v << '\n';
    }
}
```

Range-based `for` works on C-style arrays only when the compiler can see the full array type. Once the array decays to a pointer, the range-for has no way to determine the end, so it is a compile error. Use an explicit count loop with the size passed separately, or use `std::array` which always carries its size.

**Mistake 2 — assuming two arrays compare equal by value**

```cpp
int a[3]{ 1, 2, 3 };
int b[3]{ 1, 2, 3 };

if (a == b) {   // comparing pointers, not contents — always false
    std::cout << "equal\n";
}
```

`a` and `b` decay to `int*` pointing to different memory addresses, so `a == b` compares addresses and is always false regardless of the contents. To compare element-by-element you need an explicit loop, or switch to `std::array` which supports `==` on values.

**Mistake 3 — sizeof trick used after passing to a function**

```cpp
void bad(int arr[]) {             // same as int* arr — array silently decays
    int count = sizeof(arr) / sizeof(arr[0]);  // wrong: sizeof(pointer)/4 = 2
    // ...
}
```

The function parameter `int arr[]` looks like an array but is actually `int*`. The `sizeof` trick silently gives the wrong answer (pointer size divided by element size, typically 2 on 64-bit). This is one of the most common silent bugs in C code ported to C++.

## When to use this

Array-to-pointer decay is the mechanism that makes passing C-style arrays to functions work at all. You will see it in every legacy C and C++ codebase, and in any code that interfaces with C APIs. The practical rule: any time you pass a C-style array to a function, document or pass the size alongside it, because the function cannot recover it. For new code, avoid the problem entirely by using `std::array` (which does not decay) or passing the array by reference with a template parameter for its size. When you must use C-style arrays, always track the count in a `constexpr` constant defined next to the array.
