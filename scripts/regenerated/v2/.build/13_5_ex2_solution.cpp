#include <iostream>
#include <string>

enum Direction { north, south, east, west };

std::ostream& operator<<(std::ostream& out, Direction d)
{
    switch (d)
    {
        case north: out << "North"; break;
        case south: out << "South"; break;
        case east:  out << "East";  break;
        case west:  out << "West";  break;
    }
    return out;
}

std::istream& operator>>(std::istream& in, Direction& d)
{
    std::string token;
    in >> token;
    if (token == "north")      d = north;
    else if (token == "south") d = south;
    else if (token == "east")  d = east;
    else                       d = west;
    return in;
}

int main()
{
    Direction d{ west };
    std::cin >> d;
    std::cout << d << '\n';
    return 0;
}
