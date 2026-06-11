## The idea

The streams you have used so far read and write sequentially: each operation moves forward, one character at a time, and you can never revisit earlier bytes. *Random access* breaks that restriction. Every stream has an internal *position marker* — like a cursor in a text editor — and you can move that cursor anywhere in the stream before your next read or write. This makes it possible to read a record from the middle of a file, overwrite a specific field without rewriting the entire file, or jump back to re-read a section.

For input streams the marker is called the *get pointer*; for output streams it is called the *put pointer*. The functions that move and query these pointers are `seekg`/`tellg` (get) and `seekp`/`tellp` (put).

## How it works

**`tellg` and `tellp` — querying the current position**

`stream.tellg()` returns the current get-pointer position as a `std::streampos` value. `stream.tellp()` does the same for the put pointer. `std::streampos` can be stored and passed back to `seekg`/`seekp`.

```cpp
#include <sstream>
#include <iostream>

int main() {
    std::istringstream iss("hello world");
    std::string word;
    iss >> word;                             // reads "hello"
    std::streampos pos = iss.tellg();        // remember position (after "hello ")
    iss >> word;                             // reads "world"
    std::cout << word << "\n";               // world
    iss.seekg(pos);                          // jump back
    iss >> word;                             // reads "world" again
    std::cout << word << "\n";               // world
}
```

**`seekg` and `seekp` — moving the position**

Both functions have two forms:
- `seekg(pos)` — absolute: move to position `pos`.
- `seekg(offset, direction)` — relative: move `offset` bytes from `direction`, which is one of:
  - `std::ios::beg` — from the beginning of the stream.
  - `std::ios::cur` — from the current position.
  - `std::ios::end` — from the end of the stream (offset is usually negative).

```cpp
#include <sstream>
#include <iostream>

int main() {
    std::stringstream ss("ABCDE");
    ss.seekg(2, std::ios::beg);   // move to position 2 (0-indexed)
    char c;
    ss.get(c);
    std::cout << c << "\n";       // C

    ss.seekg(-1, std::ios::end);  // one before the end
    ss.get(c);
    std::cout << c << "\n";       // E
}
```

**Overwriting in place with a `std::stringstream`**

Because `std::stringstream` supports both `seekg`/`seekp`, you can read a position, then seek the put pointer to overwrite specific bytes:

```cpp
#include <sstream>
#include <iostream>

int main() {
    std::stringstream ss("hello world");
    ss.seekp(6, std::ios::beg);   // move write cursor to position 6
    ss << "C++  ";                // overwrite "world" with "C++  "
    std::cout << ss.str() << "\n"; // hello C++  
}
```

**File streams and random access**

The same `seekg`/`seekp`/`tellg`/`tellp` calls work on `std::fstream`. A common pattern is to read a record's position with `tellg`, jump back to it with `seekp`, then overwrite just that record — useful for updating a field in a binary or fixed-width text file without rewriting the whole file.

## Common mistakes

**Mistake 1 — Using `seekg`/`seekp` on `std::cin` or `std::cout`**

Console streams are not seekable. Calling `std::cin.seekg(0)` compiles but always fails silently (it sets `failbit`). Random access only works on streams backed by a seekable source: files and string streams. Always check the return value of `seekg` or `tellg` (a negative `std::streampos` signals failure).

**Mistake 2 — Seeking past EOF without clearing the EOF flag first**

```cpp
std::istringstream iss("abc");
std::string s;
iss >> s;                  // reads "abc", hits EOF, sets eofbit
iss.seekg(0);              // seek fails silently — eofbit is still set
iss >> s;                  // s is still "abc" from before; no new read
```

After reading to EOF, call `iss.clear()` before seeking to reset `eofbit`, then `seekg` succeeds.

**Mistake 3 — Confusing the get pointer and put pointer on `std::stringstream`**

`std::stringstream` maintains two independent pointers. Writing to the stream moves the *put* pointer. Reading moves the *get* pointer. After a sequence of writes, the get pointer may still be at position 0, meaning you can read back what you wrote without seeking. But if you then seek and write again, the put pointer moves while the get pointer stays put. Mixing reads and writes without explicit seeks leads to confusing behaviour; always seek explicitly when switching between reading and writing.

## When to use this

Random access is most useful when you work with fixed-width binary or text records: you can calculate the byte offset of record N as `N * record_size` and jump straight to it with `seekg`. For variable-width records, store positions with `tellg` as you scan, then jump back to them later. In tests and simulations, `std::stringstream` with `seekg`/`seekp` lets you simulate file I/O without a real file, which is why the exercises in this lesson use string streams.
