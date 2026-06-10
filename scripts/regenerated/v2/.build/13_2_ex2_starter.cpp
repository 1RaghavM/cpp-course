#include <iostream>

enum Day
{
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
};

Day nextDay(Day d)
{
    // TODO: return the day after d, wrapping sunday back to monday
    return d;
}

int main()
{
    int n {};
    std::cin >> n;

    Day today { monday };
    switch (n)
    {
        case 0: today = monday;    break;
        case 1: today = tuesday;   break;
        case 2: today = wednesday; break;
        case 3: today = thursday;  break;
        case 4: today = friday;    break;
        case 5: today = saturday;  break;
        case 6: today = sunday;    break;
        default: today = monday;   break;
    }

    Day tomorrow { nextDay(today) };
    std::cout << tomorrow << '\n';
    return 0;
}
