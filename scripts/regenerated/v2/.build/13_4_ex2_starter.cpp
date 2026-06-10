#include <iostream>
#include <string>
#include <string_view>

enum Status
{
    ok,
    warn,
    fail,
    unknownStatus,
};

Status statusFromName(std::string_view name)
{
    // TODO: return ok, warn, fail, or unknownStatus based on name
    (void)name;
    return unknownStatus;
}

int main()
{
    std::string word {};
    std::cin >> word;

    Status s { statusFromName(word) };
    std::cout << s << '\n';
    return 0;
}
