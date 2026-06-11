## The idea

Code::Blocks is an open-source, cross-platform IDE that bundles the MinGW-w64 GCC toolchain on Windows and uses the system GCC/Clang on Linux and macOS. Adding a third-party library follows the same three-step logic you saw with Visual Studio: tell the compiler where headers live, tell the linker where the library file lives, and tell the linker which library file to use. The difference is the UI: you work through Code::Blocks' **Project Build Options** dialog rather than Visual Studio's Property Pages.

Static libraries on MinGW end in `.a` (matching Unix convention). Import libraries for DLLs also end in `.a` under MinGW (e.g., `libSDL2.a` for the import lib), unlike the `.lib` extension used by MSVC. The naming and flag conventions follow GCC: a file named `libfoo.a` is referenced with `-lfoo`, not by full filename.

## How it works

**Navigating Build Options**

Right-click the project in the Management panel → **Build options...**. This opens a dialog with two top-level nodes: a configuration node (Debug or Release) and the project node above it. Settings made on the project node apply to all configurations; settings on a configuration node override for that build type. For library paths it is usually best to set them at the project level.

**Step 1 — Add the include path**

In **Build options → Search directories → Compiler** tab, click **Add** and enter the path to the library's header folder, for example:

```
$(#SFML)/include
```

Code::Blocks supports **global variables** (accessed via the `$(#name)` syntax) set in **Settings → Global variables**. Defining `SFML` as `/usr/local` or `C:\libs\SFML` lets every project on the machine reference SFML without hardcoded paths.

**Step 2 — Add the library search path**

In **Build options → Search directories → Linker** tab, add the path containing the `.a` files, for example:

```
$(#SFML)/lib
```

**Step 3 — Add the library name(s)**

In **Build options → Linker settings → Link libraries**, click **Add** and enter the library names *without* the `lib` prefix and without the `.a` extension:

```
sfml-graphics
sfml-window
sfml-system
```

Code::Blocks translates each entry to a `-l` flag passed to the linker. The order matters with GCC's linker for the same left-to-right resolution reason described in the previous lesson; list dependencies before their dependents (SFML's graphics module depends on window and system, so list graphics first).

```cpp
// After configuration, an SFML program compiles:
#include <SFML/Graphics.hpp>
int main() {
    sf::RenderWindow window(sf::VideoMode(800, 600), "Hello SFML");
    while (window.isOpen()) {
        sf::Event event;
        while (window.pollEvent(event))
            if (event.type == sf::Event::Closed) window.close();
        window.display();
    }
}
```

**Using pkg-config on Linux**

On Linux, many libraries support `pkg-config`. Code::Blocks can integrate pkg-config output automatically by adding a custom build variable in **Other compiler options**:

```
`pkg-config --cflags sfml-graphics`
```

and in **Other linker options**:

```
`pkg-config --libs sfml-graphics`
```

The backtick expansion runs the command at build time and inserts its output.

## Common mistakes

**Mistake 1: The `lib` prefix and the `.a` extension in the library name field**

A learner types `libsfml-graphics.a` or `libsfml-graphics` in the **Link libraries** list. Both are wrong. Code::Blocks prepends `lib` and appends `.a` automatically when it generates the `-l` flag. You only supply the stem: `sfml-graphics`. Entering the full filename produces linker errors like `cannot find -llibsfml-graphics.a`.

**Mistake 2: Configuring only one build type**

When the settings dialog is open, it is easy to select the **Debug** sub-node instead of the project root. All changes apply only to Debug builds. A Release build then fails with missing-include or undefined-reference errors. Check the dialog's left panel to ensure you are editing the project-level node, or explicitly repeat the configuration for each build type.

**Mistake 3: DLL not on the PATH at runtime on Windows**

On Linux, shared objects in the configured library path are automatically embedded into the binary's RPATH or found via `ldconfig`. On Windows with MinGW, DLLs are not automatically copied to the output directory. Running the built `.exe` from inside Code::Blocks may work if the library's `bin/` folder is on `PATH`, but running the `.exe` standalone will fail. The fix is the same as for Visual Studio: add a post-build step that copies the DLL(s) to the output folder, or add the DLL directory to the system `PATH`.

## When to use this

Follow these steps for any Code::Blocks project that requires a pre-compiled library — game frameworks (SFML, SDL2), math libraries, compression codecs, and so on. If the library ships a CMake build, consider generating a Code::Blocks project via CMake (`cmake -G "CodeBlocks - Unix Makefiles"`) instead of configuring build options manually; CMake will set all three settings automatically from the library's exported targets. Manual Build Options configuration is most useful for small libraries that do not support CMake or for quick one-off setups.
