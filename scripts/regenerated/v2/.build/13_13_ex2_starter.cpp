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
    Box<bool> second{ static_cast<bool>(b) };
    std::cout << first.value * second.value << '\n';
    return 0;
}
