#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

Point delta(const Point& a, const Point& b) {
    return Point{ b.x - a.x, b.y - a.y };
}

int main() {
    Point p1{ 2, 4 };
    Point p2{ 7, 7 };
    Point d{ delta(p1, p2) };
    std::cout << "dx=" << d.x << " dy=" << d.y << '\n';
    return 0;
}
