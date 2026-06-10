#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

int sumCoords(const Point* p) {
    if (p == nullptr)
        return 0;
    return p->x + p->y;
}

int main() {
    Point pt{ 6, 9 };
    std::cout << "Sum: " << sumCoords(&pt) << '\n';
    std::cout << "Sum: " << sumCoords(nullptr) << '\n';
    return 0;
}
