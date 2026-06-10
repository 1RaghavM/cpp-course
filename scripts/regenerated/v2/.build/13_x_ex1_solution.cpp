#include <iostream>

enum class Category { food, tool, book };

template <typename T>
struct Tagged
{
    Category category;
    T value;
};

int main()
{
    int code{};
    int v{};
    std::cin >> code >> v;
    Tagged<int> t{ static_cast<Category>(code), v };
    switch (t.category)
    {
        case Category::food: std::cout << "food"; break;
        case Category::tool: std::cout << "tool"; break;
        case Category::book: std::cout << "book"; break;
    }
    std::cout << ": " << t.value << '\n';
    return 0;
}
