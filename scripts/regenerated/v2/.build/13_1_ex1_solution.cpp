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
    int d {};
    std::cin >> d;

    Direction chosen { north };
    switch (d)
    {
        case 0: chosen = north; break;
        case 1: chosen = east;  break;
        case 2: chosen = south; break;
        case 3: chosen = west;  break;
        default: chosen = north; break;
    }

    std::cout << chosen << '\n';
    return 0;
}
