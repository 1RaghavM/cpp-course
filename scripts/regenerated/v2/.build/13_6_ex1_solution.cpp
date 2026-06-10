#include <iostream>

enum class TrafficLight { red, yellow, green };

std::ostream& operator<<(std::ostream& out, TrafficLight t)
{
    switch (t)
    {
        case TrafficLight::red:    out << "red";    break;
        case TrafficLight::yellow: out << "yellow"; break;
        case TrafficLight::green:  out << "green";  break;
    }
    return out;
}

int main()
{
    std::cout << TrafficLight::red    << '\n';
    std::cout << TrafficLight::yellow << '\n';
    std::cout << TrafficLight::green  << '\n';
    return 0;
}
