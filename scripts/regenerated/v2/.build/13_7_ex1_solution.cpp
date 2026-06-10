#include <iostream>
#include <string>

struct Circle
{
    int radius;
    std::string color;
};

void printCircle(Circle c)
{
    std::cout << "radius=" << c.radius << " color=" << c.color << '\n';
}

int main()
{
    Circle c1;
    c1.radius = 5;
    c1.color  = "blue";
    printCircle(c1);

    Circle c2;
    c2.radius = 12;
    c2.color  = "red";
    printCircle(c2);

    return 0;
}
