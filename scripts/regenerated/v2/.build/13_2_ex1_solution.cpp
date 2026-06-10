#include <iostream>

enum Suit
{
    clubs,
    diamonds,
    hearts,
    spades,
};

int main()
{
    int i {};
    std::cin >> i;

    Suit s { clubs };
    switch (i)
    {
        case 0: s = clubs;    break;
        case 1: s = diamonds; break;
        case 2: s = hearts;   break;
        case 3: s = spades;   break;
        default: s = clubs;   break;
    }

    std::cout << s << '\n';
    return 0;
}
