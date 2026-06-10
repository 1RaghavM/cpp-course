#include <iostream>

enum Difficulty
{
    easy,
    medium,
    hard,
};

int main()
{
    int n {};
    std::cin >> n;

    Difficulty d { static_cast<Difficulty>(n) };
    std::cout << d + 1 << '\n';
    return 0;
}
