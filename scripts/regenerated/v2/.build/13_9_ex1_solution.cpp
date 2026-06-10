#include <iostream>
#include <iomanip>
#include <string>

struct TempReading {
    std::string location{ "unknown" };
    float celsius{ -999.0f };
    bool valid{ false };
};

void printReading(const TempReading& r) {
    std::cout << std::fixed << std::setprecision(1);
    std::cout << r.location << ": " << r.celsius << " C "
              << (r.valid ? "valid" : "invalid") << '\n';
}

int main() {
    TempReading t1{};
    TempReading t2{ .location = "Lab", .celsius = 23.5f, .valid = true };
    printReading(t1);
    printReading(t2);
    return 0;
}
