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
    IntPair<int> p{ a, b };
    std::cout << "first=" << p.first << " second=" << p.second << '\n';
    return 0;
}
