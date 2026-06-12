# Capstone: Build a Single-Branch Bank in C++

You have just been handed the keys to First Standard Bank — a one-branch bank that lives entirely inside a single C++ process. Your job is to design the data model from scratch using structs, enums, and classes, route money through references and pointers, and surface a small command-driven UI on top. By the time you finish the five milestones you will have a working ledger that can open accounts, move money between them, replay history, and report the bank's total assets — all without a single STL container.

## What you'll build

A command-line program that reads instructions from standard input, one whitespace-separated token at a time, and prints results to standard output. The bank is a fixed-size C array of `Account` objects living inside a `Bank` class; each account holds a numeric id, a name, a balance, and a transaction log. Money is modelled as a tiny `Money` value type measured in whole cents so you never lose pennies to floating-point. A scoped `enum class TxKind` tags each transaction as a deposit, withdrawal, transfer-in, or transfer-out. Lookups go through `Bank::find`, which returns either a non-owning `Account*` or `nullptr`, and bank-wide aggregates use `std::optional<Money>` to model "no accounts yet." The program loops until it reads `quit` or hits end-of-stream.

The seven commands you will support are: `open NAME`, `balance ID`, `deposit ID CENTS`, `withdraw ID CENTS`, `transfer FROM_ID TO_ID CENTS`, `history ID`, and `summary`. Account ids start at 1 and increment for every successful `open`. All money values are entered as integer cents but printed in `$D.DD` form (always two pennies digits).

## Milestone 1: Money struct and opening accounts

**Goal:** Model money as a struct of cents, format it as `$D.DD`, and let the bank open named accounts that start at a zero balance.

**Acceptance criteria:**
- `open Alice` prints `Opened #1 Alice`.
- A second `open Bob` prints `Opened #2 Bob` — ids always increment.
- `balance 1` prints `Account #1 Alice: $0.00`.
- `balance 99` (unknown id) prints `Unknown account #99`.

**Hint:** Pick one source of truth for money — a `struct Money { long long cents; };` works well. Build a `format_money(const Money&)` helper now; every later milestone will reuse it.

## Milestone 2: Deposits, withdrawals, and insufficient funds

**Goal:** Move money in and out of an account, refusing withdrawals that would overdraw it.

**Acceptance criteria:**
- `deposit 1 12345` prints `Deposited $123.45 to #1 (balance $123.45)`.
- A later `withdraw 1 5000` prints `Withdrew $50.00 from #1 (balance $73.45)`.
- A withdrawal larger than the balance prints `Insufficient funds for #ID (balance $X.YY)` and leaves the balance unchanged.
- `deposit 42 100` against an unknown id prints `Unknown account #42` and changes nothing.

**Hint:** Withdrawal is the first operation that can fail. A `bool Account::withdraw(Money)` that returns `false` when the balance is too low keeps success and failure paths clean — and gives `transfer` something to compose with later.

## Milestone 3: Transfers between accounts

**Goal:** Move money from one account to another atomically — both halves succeed, or neither does.

**Acceptance criteria:**
- After opening Alice (#1) and Bob (#2), depositing `5000` into Alice, then `transfer 1 2 2000`, the output is `Transferred $20.00 #1 -> #2`. Balances afterwards: Alice `$30.00`, Bob `$20.00`.
- `transfer 1 2 999999` (more than Alice has) prints `Insufficient funds for #1 (balance $X.YY)` and leaves both balances untouched.
- Any transfer involving an unknown id prints `Unknown account in transfer` and changes nothing.

**Hint:** Reuse `withdraw` and `deposit` rather than touching balances directly. Look up each side with `Bank::find` first; if either pointer is `nullptr`, bail before touching either account.

## Milestone 4: Per-account transaction history

**Goal:** Every successful operation appends a typed entry to the account's history; `history ID` replays it.

**Acceptance criteria:**
- After `open Alice`, `open Bob`, `deposit 1 10000`, `withdraw 1 2500`, `transfer 1 2 1500`, the command `history 1` prints exactly:
  ```
  History for #1 Alice:
    deposit $100.00
    withdrawal $25.00
    transfer-out $15.00 (#2)
  ```
- `history 2` for Bob prints a single `transfer-in $15.00 (#1)` line under its own header.
- `history 99` (unknown id) prints `Unknown account #99`.

**Hint:** A `struct Transaction { TxKind kind; Money amount; int other_id; };` plus a fixed-size in-class array is enough — no STL needed. The `other_id` field is only meaningful for transfer kinds; ignore it when printing deposits and withdrawals.

## Milestone 5: Bank summary

**Goal:** Report how many accounts exist and what the total assets are across all of them.

**Acceptance criteria:**
- With no accounts open, `summary` prints:
  ```
  Accounts: 0
  Total assets: (no accounts)
  ```
- After opening Alice (#1), Bob (#2), depositing `10000` into Alice, `25050` into Bob, `summary` prints:
  ```
  Accounts: 2
  Total assets: $350.50
  ```
- Summary never modifies any account — running `summary` and then `balance` returns the same number as before.

**Hint:** Let `Bank::total_assets()` return `std::optional<Money>` — `std::nullopt` when there are no accounts, otherwise the sum. That gives `summary` one branch to handle and keeps the "no accounts" case out of the formatting helper.

## Stretch goals

- Add a `rename ID NEW_NAME` command that mutates the account through a returned reference.
- Add a `close ID` command that swaps the closed account with the last slot and decrements the count.
- Replace the `int other_id` field on `Transaction` with a `const Account*` back-pointer (mind the lifetime — the bank's array must not move).
- Add per-account interest accrual using a `constexpr` rate and a new `TxKind::Interest`.
- Add a friend function `print_account(std::ostream&, const Account&)` and use it from `balance`.

## Topics you'll use

- (12.4) Lvalue references to const
- (12.6) Pass by const lvalue reference
- (12.7) Introduction to pointers
- (12.8) Null pointers
- (12.10) Pass by address
- (12.15) std::optional
- (13.6) Scoped enumerations (enum classes)
- (13.7) Introduction to structs, members, and member selection
- (13.8) Struct aggregate initialization
- (13.9) Default member initialization
- (13.10) Passing and returning structs
- (14.2) Introduction to classes
- (14.3) Member functions
- (14.5) Public and private members and access specifiers
- (14.9) Introduction to constructors
- (14.10) Constructor member initializer lists
- (14.11) Default constructors and default arguments
