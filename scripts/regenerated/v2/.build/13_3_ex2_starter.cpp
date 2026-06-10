#include <iostream>

enum Direction
{
    north,
    east,
    south,
    west,
};

int main()
{
    int n {};
    std::cin >> n;

    Direction d { static_cast<Direction>(n) };
    Direction next { static_cast<Direction>(d + 1) };
    std::cout << next << '\n';
    return 0;
}
