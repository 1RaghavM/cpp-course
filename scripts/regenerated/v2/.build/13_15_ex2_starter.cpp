#include <iostream>

template <typename T, typename U>
struct Pair
{
    T first;
    U second;
};

template <typename U>
using IntPair = Pair<int, U>;

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    IntPair<double> p{ a, static_cast<double>(b) + 0.5 };
    std::cout << p.first + p.second << '\n';
    return 0;
}
