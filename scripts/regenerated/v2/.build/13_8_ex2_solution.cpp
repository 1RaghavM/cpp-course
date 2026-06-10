#include <iostream>

struct Rect
{
    int width;
    int height;
};

Rect makeRect(int w, int h)
{
    return { w, h };
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
