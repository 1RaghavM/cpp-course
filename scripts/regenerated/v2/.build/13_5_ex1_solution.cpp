#include <iostream>

enum Planet { mercury, venus, earth, mars };

std::ostream& operator<<(std::ostream& out, Planet p)
{
    switch (p)
    {
        case mercury: out << "Mercury"; break;
        case venus:   out << "Venus";   break;
        case earth:   out << "Earth";   break;
        case mars:    out << "Mars";    break;
    }
    return out;
}

int main()
{
    std::cout << mercury << '\n';
    std::cout << venus   << '\n';
    std::cout << earth   << '\n';
    std::cout << mars    << '\n';
    return 0;
}
