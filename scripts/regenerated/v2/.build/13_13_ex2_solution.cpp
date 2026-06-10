#include <iostream>

template <typename T>
struct Box
{
    T value;
};

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    Box<int> first{ a };
    Box<int> second{ b };
    std::cout << first.value * second.value << '\n';
    return 0;
}
