#include <iostream>

template <typename T>
struct Pair
{
    T first;
    T second;
};

// TODO: implement maxOf with the exact signature below.
// The stub returns 0 so the starter compiles; replace it with the real logic.
int maxOf(const Pair<int>& p)
{
    (void)p;
    return 0;
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
