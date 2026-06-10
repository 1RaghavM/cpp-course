#include <iostream>

struct Character {
    int hp{ 100 };
    int mana{ 50 };
};

void printCharacter(const Character& c) {
    std::cout << "HP: " << c.hp << " Mana: " << c.mana << '\n';
}

int main() {
    Character hero{};
    Character wounded{ .hp = 75 };  // FIX: designated init; mana keeps default 50
    printCharacter(hero);
    printCharacter(wounded);
    return 0;
}
