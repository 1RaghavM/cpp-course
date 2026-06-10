#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

// TODO: Complete this function.
// Return p->x + p->y if p is not null, otherwise return 0.
int sumCoords(const Point* p) {
    // your code here
}

int main() {
    Point pt{ 6, 9 };
    std::cout << "Sum: " << sumCoords(&pt) << '\n';
    std::cout << "Sum: " << sumCoords(nullptr) << '\n';
    return 0;
}
