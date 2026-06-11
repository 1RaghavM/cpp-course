## The idea

At some point you will write two versions of the same algorithm and wonder which one is faster. Or you will notice a section of your program feels slow and want to measure exactly how much time it takes. C++ gives you a portable, high-resolution clock in the `<chrono>` header. You take a time point before the code you want to measure, run the code, take another time point after, and subtract to get the elapsed duration.

This is called instrumentation timing or wall-clock measurement. It is not the same as algorithmic complexity analysis (O notation), which counts operations abstractly. Timing measures what actually happens on real hardware — including cache effects, memory allocation overhead, and compiler optimisations — which often differs from the theoretical prediction for small inputs.

## How it works

### Taking a time point

`std::chrono::steady_clock::now()` returns the current time as a `time_point`. Use `steady_clock` rather than `system_clock` for measuring elapsed time: `steady_clock` is guaranteed to never go backward (it is not affected by the user adjusting the system clock), making it reliable for benchmarking.

```cpp
#include <iostream>
#include <chrono>

int main()
{
    auto start = std::chrono::steady_clock::now();

    // code to measure goes here
    long long sum = 0;
    for (int i = 0; i < 1'000'000; ++i)
        sum += i;

    auto end = std::chrono::steady_clock::now();
    std::cout << "Sum: " << sum << '\n';

    return 0;
}
```

The type of `start` and `end` is `std::chrono::steady_clock::time_point`. Using `auto` avoids writing out that long type name.

### Computing elapsed time

Subtracting two time points gives a `duration`. You then cast it to a specific unit using `std::chrono::duration_cast`:

```cpp
#include <iostream>
#include <chrono>

int main()
{
    auto start = std::chrono::steady_clock::now();

    volatile long long sum = 0;
    for (int i = 0; i < 10'000'000; ++i)
        sum += i;

    auto end = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    std::cout << "Elapsed: " << elapsed.count() << " ms\n";

    return 0;
}
```

`elapsed.count()` returns the raw integer number of milliseconds. Common duration types are `std::chrono::milliseconds`, `std::chrono::microseconds`, and `std::chrono::nanoseconds`. Pick the unit that gives readable numbers for the code you are measuring: a function that runs in 300 microseconds is better reported in microseconds than in milliseconds (where it would print 0).

### Comparing two implementations

The typical pattern is to time each approach separately and print both:

```cpp
#include <iostream>
#include <chrono>
#include <vector>
#include <algorithm>

int main()
{
    std::vector<int> data(50'000);
    for (int i = 0; i < 50'000; ++i)
        data[i] = 50'000 - i;  // reverse order

    auto t1 = std::chrono::steady_clock::now();
    // selection sort (O(n^2))
    for (int i = 0; i < static_cast<int>(data.size()) - 1; ++i)
    {
        int minIdx = i;
        for (int j = i + 1; j < static_cast<int>(data.size()); ++j)
            if (data[j] < data[minIdx]) minIdx = j;
        std::swap(data[i], data[minIdx]);
    }
    auto t2 = std::chrono::steady_clock::now();

    std::cout << "Selection sort: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count()
              << " ms\n";

    return 0;
}
```

By comparing the millisecond counts you see the practical performance difference between approaches, not just the theoretical one.

## Common mistakes

### 1. Using `system_clock` instead of `steady_clock`

`std::chrono::system_clock` measures wall-clock calendar time. If the user changes the system time, or if NTP adjusts the clock, the measurement can go negative or jump. `steady_clock` is monotonic — it only goes forward — making it the right choice for elapsed-time measurement.

### 2. Forgetting to call `.count()` to get a number

```cpp
auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
std::cout << elapsed << '\n';       // compile error in C++17 and earlier
std::cout << elapsed.count() << '\n';  // correct
```

`elapsed` is a duration object, not a plain integer. You must call `.count()` to extract the raw integer value.

### 3. Measuring too small a workload and getting 0

If the code being measured takes under a millisecond, `duration_cast<milliseconds>` truncates to 0. Always choose a duration unit small enough to capture the actual time. Use `microseconds` for quick functions, or run the code in a loop many times and divide to get an average.

## When to use this

Use `<chrono>` timing when you want to compare two algorithms empirically, when a user reports that your program is slow and you need to find the bottleneck, or when a code review asks whether a proposed optimisation actually helps. For informal comparisons during development, `steady_clock` with `milliseconds` or `microseconds` is sufficient. Production performance work eventually calls for a dedicated profiler, but the `<chrono>` pattern taught here is a solid first step and requires no external tools.

One practical guideline: always print both the result of the computation *and* the elapsed time. If you only print the time, an aggressive optimiser may detect that the result is never used and eliminate the loop entirely, giving you an unrealistically small measurement. Printing `sum` or some derived value forces the compiler to actually perform the work. The `volatile` qualifier in the second code example above achieves the same effect for the loop variable, but printing the result is cleaner and more idiomatic.

A second guideline: warm up before measuring. On the very first call to a function, the CPU may not have the relevant code or data in its instruction and data caches. Running the code once before starting the timer avoids counting that cache-cold overhead in your measurement, giving a more representative picture of steady-state performance.
