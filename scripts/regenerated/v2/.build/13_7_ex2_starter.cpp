#include <iostream>
#include <string>

struct Player
{
    std::string name;
    int score;
};

void addPoints(Player p, int points)
{
    p.score += points;
}

int main()
{
    Player alice;
    alice.name  = "Alice";
    alice.score = 100;
    std::cout << alice.name << ": " << alice.score << '\n';
    addPoints(alice, 50);
    std::cout << alice.name << ": " << alice.score << '\n';
    return 0;
}
