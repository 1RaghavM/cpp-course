#include <iostream>
#include <string_view>

enum Color
{
    red,
    green,
    blue,
};

std::string_view colorName(Color c)
{
    switch (c)
    {
        case red:   return "red";
        case green: return "green";
        case blue:  return "blue";
    }
    return "unknown";
}

int main()
{
    int n {};
    std::cin >> n;

    Color c { static_cast<Color>(n) };
    std::cout << colorName(c) << '\n';
    return 0;
}
