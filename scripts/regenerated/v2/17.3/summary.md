## The idea

When you write a function that works with a collection of values, you need to know how the collection travels in and out. With `std::array`, the rules are the same as for any struct: by default, the whole array is *copied* when you pass it to a function, and you can also pass it by reference to avoid the copy. The difference matters when the array is large, when you want to modify the original, or when you want to guarantee the caller's data stays unchanged. Returning a `std::array` from a function is equally straightforward — the compiler typically elides the copy — and it allows clean, value-returning APIs that do not require output parameters.

## How it works

**Passing by value (copy)**

When you declare `void print(std::array<int, 3> arr)`, every call makes a full copy of the three integers. Changes inside the function do not affect the caller's array.

```cpp
#include <array>
#include <iostream>

void doubleAll(std::array<int, 3> arr) {
    for (std::size_t i = 0; i < arr.size(); ++i) {
        arr[i] *= 2;
    }
    std::cout << arr[0] << ' ' << arr[1] << ' ' << arr[2] << '\n';
}

int main() {
    std::array<int, 3> nums { 1, 2, 3 };
    doubleAll(nums);   // prints: 2 4 6
    std::cout << nums[0]; // still 1 — caller's copy unchanged
    return 0;
}
```

**Passing by const reference (read-only, no copy)**

For read-only access, pass as `const std::array<T, N>&`. The reference avoids copying the entire array, and `const` prevents accidental modification. This is the preferred way to pass arrays to functions that only read the data.

```cpp
#include <array>
#include <iostream>

int sumAll(const std::array<int, 4>& arr) {
    int total = 0;
    for (int v : arr) {
        total += v;
    }
    return total;
}

int main() {
    std::array<int, 4> data { 5, 10, 15, 20 };
    std::cout << sumAll(data) << '\n'; // 50
    return 0;
}
```

**Passing by non-const reference (modify in place)**

When the function needs to modify the caller's original array, drop `const`:

```cpp
#include <array>
#include <iostream>

void fillWithZero(std::array<int, 5>& arr) {
    for (int& v : arr) {
        v = 0;
    }
}

int main() {
    std::array<int, 5> data { 1, 2, 3, 4, 5 };
    fillWithZero(data);
    for (int v : data) {
        std::cout << v << ' '; // 0 0 0 0 0
    }
    return 0;
}
```

**Returning a `std::array`**

You can return a `std::array` by value just like any other type. The compiler will typically apply copy elision (return value optimization), making this efficient in practice.

```cpp
#include <array>
#include <iostream>

std::array<int, 3> makeArray(int a, int b, int c) {
    return { a, b, c };
}

int main() {
    std::array<int, 3> result = makeArray(7, 8, 9);
    for (int v : result) {
        std::cout << v << ' '; // 7 8 9
    }
    return 0;
}
```

The return type must spell out the full `std::array<T, N>` — the size is part of the type and must match between declaration and return statement.

## Common mistakes

**Mistake 1 — expecting a by-value parameter to modify the original**

```cpp
void addOne(std::array<int, 3> arr) {  // arr is a COPY
    for (int& v : arr) { ++v; }
}
// Calling addOne(data) leaves data unchanged — the mutation happens on the copy.
```

If you want the function to change the caller's array, you must pass by reference: `void addOne(std::array<int, 3>& arr)`.

**Mistake 2 — size mismatch between caller and function parameter**

```cpp
std::array<int, 4> bigArr { 1, 2, 3, 4 };
void print3(const std::array<int, 3>& arr);
print3(bigArr); // compile error: std::array<int,4> and std::array<int,3> are different types
```

The size N is baked into the type. A function that expects `std::array<int, 3>` cannot accept a `std::array<int, 4>`. If you need size-independent functions, you will learn about function templates in chapter 11.

**Mistake 3 — returning a reference to a local array**

```cpp
std::array<int, 3>& getBad() {
    std::array<int, 3> local { 1, 2, 3 };
    return local; // DANGLING REFERENCE — local is destroyed when function returns
}
```

A local `std::array` lives on the stack and is destroyed when the function returns. Returning a reference to it leaves the caller with a dangling reference — reading through it is undefined behavior. Return by value instead; the compiler eliminates the copy in most cases.

## When to use this

Pass a `std::array` by `const` reference when the function only reads the data — this avoids copying potentially large arrays. Pass by non-const reference when the function modifies the array in place. Pass by value only when you intentionally want the function to work on its own copy without affecting the original. Return `std::array` by value from factory functions or transformations; the compiler handles the efficiency via copy elision. For larger or variable-size collections that you want to pass around cheaply, `std::vector` with its move semantics offers better options.
