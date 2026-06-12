# Capstone: Guess the Number

You'll build a command-line guessing game in a single C++ file. The player picks a difficulty, the program rolls a hidden target, and the player narrows in with too-high / too-low feedback until they land on it. You'll harden the input loop against typos, support replaying as many rounds as the player wants, and finish with a stats screen — using only features from the first part of the curriculum.

## What you'll build

A single-file program that runs an interactive guessing session. On launch it prints a welcome banner, asks for a random seed (so games are reproducible while you test), and enters a play loop. Each round asks the player to pick a difficulty (1 = easy / 1–50, 2 = medium / 1–100, 3 = hard / 1–500), rolls a hidden target in that range, and reads guesses until the player gets it. Every wrong guess prints `Too low.` or `Too high.` and counts toward the round's attempt total. Invalid input — non-numeric text, an out-of-range difficulty, an out-of-range guess — is rejected with a friendly message and the prompt is re-shown; the program never crashes. After each round it asks whether to play again; anything other than `y`/`Y` ends the session. On exit it prints a stats block — games played, best attempt count, average attempts to two decimals — followed by `Thanks for playing!`.

You'll use a tiny linear-congruential generator (LCG) seeded by the player's chosen seed so the same seed always produces the same target sequence, which keeps the game reproducible across runs. The whole program stays in one `.cpp` file with named functions for each concern: rolling targets, mapping difficulty to a range, reading and validating input, and playing a round.

## Milestone 1: Welcome and difficulty setup

**Goal:** Print the welcome banner, read a seed from the player, then prompt for a difficulty (1/2/3) and announce the chosen range.

**Acceptance criteria:** Prints `Welcome to Guess the Number!`, then reads an integer seed (prompt: `Enter a seed: `) and an integer difficulty (prompt: `Choose difficulty (1=easy, 2=medium, 3=hard): `). On a valid difficulty, prints `Difficulty <name>: guess a number between 1 and <hi>.` where `<name>` is `easy`/`medium`/`hard` and `<hi>` is `50`/`100`/`500`.

**Hint:** Two small functions — one that maps `1/2/3` to an upper bound and one that maps it to a name — keep the round prompt clean.

## Milestone 2: Guessing loop with feedback

**Goal:** After the difficulty banner, repeatedly prompt for a guess and respond with `Too low.`, `Too high.`, or the win line.

**Acceptance criteria:** Prompt is `Your guess: ` (no newline). On a guess less than the target print `Too low.` and re-prompt; on a guess greater than the target print `Too high.` and re-prompt; on the correct guess print `Correct! You got it in N attempts.` where `N` counts every guess including the winning one.

**Hint:** A `while (true)` loop with an attempts counter and a final `return` on the winning branch is enough — no break needed.

## Milestone 3: Input validation and recovery

**Goal:** Recover from non-numeric input on any integer prompt, and reject out-of-range difficulty or guess values without crashing.

**Acceptance criteria:** On a non-numeric token where an integer is expected, prints `Please enter a whole number: ` and re-reads. On a difficulty outside `1..3` or a guess outside `1..<hi>`, prints `Out of range. Pick between <lo> and <hi>.` and re-prompts with the original label. End-of-input mid-game exits cleanly.

**Hint:** When `cin >> x` fails, call `cin.clear()` then `cin.ignore(10000, '\n')` to discard the bad line. Two overloads of the prompt — with and without a range — keep main clean.

## Milestone 4: Replay loop

**Goal:** After each round, ask whether to play again and start a fresh round when the answer is `y` or `Y`.

**Acceptance criteria:** After the win line, prints `Play again? (y/n): ` and reads one character. On `y`/`Y` it loops back to the difficulty prompt and rolls a new target from the same LCG state. Any other character ends the session and proceeds to stats.

**Hint:** Keep the LCG state alive across rounds — don't reseed between rounds, just keep calling `nextRandom()`.

## Milestone 5: Session stats

**Goal:** On exit, print a session summary covering games played, best round, and average attempts.

**Acceptance criteria:** After the play loop ends, prints (on separate lines, after a blank line): `Final stats`, `Games played: N`, `Best round: B attempts`, `Average attempts: A.AA`, `Thanks for playing!`. `B` is the smallest attempt count across rounds; `A.AA` is the mean formatted to exactly two decimals, rounded (e.g. `1.33` for 4 attempts across 3 games).

**Hint:** Track `games`, `totalAttempts`, `bestAttempts` in `main`. For the two-decimal average, compute `(total*100 + games/2) / games` as an integer (rounded `times-100` value), then print the whole and fractional pieces directly — no floating-point formatting needed.

## Stretch goals

- Add a fourth `extreme` difficulty (1–1000) through the same overload set.
- Show a nudge every fifth wrong guess ("Try splitting the range.").
- Track and report the worst round alongside the best.
- Let the player type `quit` mid-round to abandon it and jump to stats.
- Swap the LCG for `<random>` once you've read 8.13–8.14 — keep determinism via the same seed prompt.

## Topics you'll use

- (1.5) Introduction to iostream: cout, cin, and endl
- (2.1) Introduction to functions
- (2.7) Forward declarations and definitions
- (4.4) Signed integers
- (4.10) Introduction to if statements
- (4.12) Introduction to type conversion and static_cast
- (5.1) Constant variables (named constants)
- (5.6) Constexpr variables
- (5.7) Introduction to std::string
- (6.2) Arithmetic operators
- (7.4) Introduction to global variables
- (8.5) Switch statement basics
- (8.8) Introduction to loops and while statements
- (8.10) For statements
- (8.11) Break and continue
- (8.12) Halts (exiting your program early)
- (9.5) std::cin and handling invalid input
- (10.6) Explicit type conversion (casting) and static_cast
- (11.1) Introduction to function overloading
- (11.5) Default arguments
