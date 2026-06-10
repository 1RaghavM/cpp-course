#include <iostream>
#include <string>

struct Player {
    std::string name{ "unknown" };
    int score{ 0 };
};

void applyBonus(Player* p, int bonus) {
    if (p != nullptr)
        p->score += bonus;
}

int main() {
    Player alice{ .name = "Alice", .score = 100 };
    std::cout << "Before: " << alice.name << ' ' << alice.score << '\n';
    applyBonus(&alice, 25);
    std::cout << "After: " << alice.name << ' ' << alice.score << '\n';
    return 0;
}
