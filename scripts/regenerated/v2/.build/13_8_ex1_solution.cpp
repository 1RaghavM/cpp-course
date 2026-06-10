#include <iostream>
#include <string>

struct Student
{
    std::string name;
    int score;
};

int main()
{
    Student s1{ "Alice", 92 };
    Student s2{ "Bob",   78 };
    Student s3{ "Carla", 85 };

    std::cout << s1.name << ' ' << s1.score << '\n';
    std::cout << s2.name << ' ' << s2.score << '\n';
    std::cout << s3.name << ' ' << s3.score << '\n';

    return 0;
}
