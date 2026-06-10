#include <iostream>

template <typename T, typename U>
struct Pair
{
    T first;
    U second;
};

template <typename T>
using SameTypePair = Pair<T, T>;

// TODO: implement sumPair with the exact signature below.
// The stub returns 0 so the starter compiles; replace it with the real logic.
int sumPair(const SameTypePair<int>& p)
{
    (void)p;
    return 0;
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
