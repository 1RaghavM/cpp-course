#include <iostream>
#include <algorithm>

int main()
{
    int a{};
    int b{};
    int c{};
    std::cin >> a >> b >> c;
    std::cout << std::max({ a, b, c }) << '\n';
    return 0;
}
