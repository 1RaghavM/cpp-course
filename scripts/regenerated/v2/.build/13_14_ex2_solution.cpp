#include <iostream>

template <typename T>
struct Pair
{
    T first;
    T second;
};

int maxOf(const Pair<int>& p)
{
    return (p.first >= p.second) ? p.first : p.second;
}

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    Pair p{ a, b };
    std::cout << maxOf(p) << '\n';
    return 0;
}
