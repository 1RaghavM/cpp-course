#include <iostream>

template <typename T, typename U>
struct Pair
{
    T first;
    U second;
};

template <typename T>
using SameTypePair = Pair<T, T>;

int sumPair(const SameTypePair<int>& p)
{
    return p.first + p.second;
}

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    SameTypePair<int> p{ a, b };
    std::cout << sumPair(p) << '\n';
    return 0;
}
