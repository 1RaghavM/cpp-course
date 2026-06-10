#include <iostream>

template <typename T>
struct Pair
{
    T first;
    T second;
};

int main()
{
    Pair<int> p{};
    std::cin >> p.first >> p.second;
    std::cout << p.first + p.second << '\n';
    return 0;
}
