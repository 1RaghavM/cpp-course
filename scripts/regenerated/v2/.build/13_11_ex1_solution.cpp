#include <iostream>
#include <string>

struct Color {
    int r{ 0 };
    int g{ 0 };
    int b{ 0 };
};

struct Tile {
    std::string name{ "unknown" };
    int x{ 0 };
    int y{ 0 };
    Color color{};
    bool passable{ true };
};

void printTile(const Tile& t) {
    std::cout << t.name << " tile at (" << t.x << ',' << t.y << ") "
              << "color=(" << t.color.r << ',' << t.color.g << ',' << t.color.b << ") "
              << "passable=" << (t.passable ? "true" : "false") << '\n';
}

int main() {
    Tile grass{ .name = "Grass", .x = 3, .y = 5,
                .color = { 0, 128, 0 }, .passable = true };
    Tile water{ .name = "Water", .x = 7, .y = 2,
                .color = { 0, 0, 255 }, .passable = false };
    printTile(grass);
    printTile(water);
    return 0;
}
