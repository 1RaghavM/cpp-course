#include <iostream>

struct Rect
{
    int width;
    int height;
};

// TODO: Complete this function.
// Return a Rect initialized with w and h using aggregate initialization.
Rect makeRect(int w, int h)
{
    return {}; // replace this
}

int main()
{
    int w{}, h{};
    std::cin >> w >> h;
    Rect r{ makeRect(w, h) };
    std::cout << "width=" << r.width
              << " height=" << r.height
              << " area=" << r.width * r.height << '\n';
    return 0;
}
