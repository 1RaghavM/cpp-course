#include <iostream>
#include <string>

enum class Suit { clubs, diamonds, hearts, spades };

std::ostream& operator<<(std::ostream& out, Suit s)
{
    switch (s)
    {
        case Suit::clubs:    out << "Clubs";    break;
        case Suit::diamonds: out << "Diamonds"; break;
        case Suit::hearts:   out << "Hearts";   break;
        case Suit::spades:   out << "Spades";   break;
    }
    return out;
}

std::string describeSuit(Suit s)
{
    switch (s)
    {
        case Suit::clubs:    return "low suit";
        case Suit::diamonds: return "low suit";
        case Suit::hearts:   return "high suit";
        case Suit::spades:   return "high suit";
    }
    return "unknown";
}

int main()
{
    std::cout << Suit::clubs    << ": " << describeSuit(Suit::clubs)    << '\n';
    std::cout << Suit::diamonds << ": " << describeSuit(Suit::diamonds) << '\n';
    std::cout << Suit::hearts   << ": " << describeSuit(Suit::hearts)   << '\n';
    std::cout << Suit::spades   << ": " << describeSuit(Suit::spades)   << '\n';
    return 0;
}
