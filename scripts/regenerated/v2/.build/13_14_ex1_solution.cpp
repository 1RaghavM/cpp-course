#include <iostream>

template <typename T>
struct Point
{
    T x;
    T y;
};

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    Point p{ a, b };
    std::cout << p.x << ' ' << p.y << '\n';
    return 0;
}
