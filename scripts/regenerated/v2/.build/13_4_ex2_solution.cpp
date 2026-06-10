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
    if (name == "ok")   return ok;
    if (name == "warn") return warn;
    if (name == "fail") return fail;
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
