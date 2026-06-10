#include <iostream>

struct Score {
    int value{ 0 };
};

void addPoints(Score& s, int n) {  // FIX: pass by reference
    s.value += n;
}

int main() {
    Score player{};
    std::cout << "Before: " << player.value << '\n';
    addPoints(player, 10);
    std::cout << "After: " << player.value << '\n';
    return 0;
}
