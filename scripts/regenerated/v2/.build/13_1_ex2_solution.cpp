#include <iostream>

enum Status
{
    ok,
    warn,
    fail,
};

int main()
{
    int n {};
    std::cin >> n;

    Status s { ok };
    switch (n)
    {
        case 0: s = ok;   break;
        case 1: s = warn; break;
        case 2: s = fail; break;
        default: s = ok;  break;
    }

    std::cout << s << '\n';
    return 0;
}
