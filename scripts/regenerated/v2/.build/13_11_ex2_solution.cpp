#include <iostream>

struct Resolution {
    int width{ 1920 };
    int height{ 1080 };
};

void printResolution(const Resolution& r) {
    std::cout << "Width: " << r.width << " Height: " << r.height << '\n';  // FIX: correct field order
}

int main() {
    const Resolution screen{};
    printResolution(screen);
    return 0;
}
