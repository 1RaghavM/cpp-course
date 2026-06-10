#include <iostream>

struct Resolution {
    int width{ 1920 };
    int height{ 1080 };
};

void printResolution(const Resolution& r) {
    std::cout << "Width: " << r.height << " Height: " << r.width << '\n';  // BUG: fields swapped
}

int main() {
    const Resolution screen{};
    printResolution(screen);
    return 0;
}
