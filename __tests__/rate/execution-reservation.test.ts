import { describe, it, expect, beforeEach } from "vitest";
import { reserveExecution } from "@/lib/rate/execution-reservation";
import type { AppSupabaseClient } from "@/lib/supabase/types";

// Fake `playground_runs` table backing the shared reservation ledger. Real
// enough to prove the ordering bug this replaces: the old routes counted
// rows in a table (`submissions`) that was only written AFTER the metered
// Judge0 call returned, so concurrent requests all read a stale count and
// all passed. This fake models a table where insert-then-count is visible
// immediately, matching real Postgres read-your-writes behavior within a
// request.
function makeFakeLedger() {
  const rows: Array<{ user_id: string; created_at: string }> = [];

  const client = {
    from: (table: string) => {
      if (table !== "playground_runs") throw new Error(`unexpected table: ${table}`);
      let filterUserId: string | undefined;
      let filterSince: string | undefined;
      const chain = {
        select: () => chain,
        eq: (_col: string, value: string) => {
          filterUserId = value;
          return chain;
        },
        gte: (_col: string, value: string) => {
          filterSince = value;
          return chain;
        },
        insert: async (row: { user_id: string }) => {
          rows.push({ user_id: row.user_id, created_at: new Date().toISOString() });
          return { data: null, error: null };
        },
        then: (resolve: (v: unknown) => unknown) => {
          const count = rows.filter(
            (r) => r.user_id === filterUserId && (!filterSince || r.created_at >= filterSince),
          ).length;
          return Promise.resolve({ count, error: null }).then(resolve);
        },
      };
      return chain;
    },
  };

  return { client: client as unknown as AppSupabaseClient, rows };
}

describe("reserveExecution", () => {
  let ledger: ReturnType<typeof makeFakeLedger>;

  beforeEach(() => {
    ledger = makeFakeLedger();
  });

  it("allows requests under the cap and records a row for each", async () => {
    const r1 = await reserveExecution(ledger.client, "user-1", 5);
    const r2 = await reserveExecution(ledger.client, "user-1", 5);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(ledger.rows.filter((r) => r.user_id === "user-1")).toHaveLength(2);
  });

  it("rejects once the cap is hit", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await reserveExecution(ledger.client, "user-1", 5);
      expect(r.allowed).toBe(true);
    }
    const sixth = await reserveExecution(ledger.client, "user-1", 5);
    expect(sixth.allowed).toBe(false);
    expect(sixth.reason).toMatch(/5 per minute/);
  });

  it("does NOT insert a reservation row when the cap is already hit", async () => {
    for (let i = 0; i < 5; i++) {
      await reserveExecution(ledger.client, "user-1", 5);
    }
    const before = ledger.rows.length;
    await reserveExecution(ledger.client, "user-1", 5);
    expect(ledger.rows.length).toBe(before);
  });

  it("reserves the slot before the caller does any expensive work, so a second concurrent call sees it", async () => {
    // Simulate two "concurrent" requests. The first reserves; because the
    // insert happens inside reserveExecution itself (before the caller ever
    // touches Judge0), the second call's count already reflects the first,
    // even though the first request's "expensive work" hasn't been awaited
    // by anything here.
    const first = await reserveExecution(ledger.client, "user-1", 1);
    expect(first.allowed).toBe(true);

    const second = await reserveExecution(ledger.client, "user-1", 1);
    expect(second.allowed).toBe(false);
  });

  it("tracks separate users independently", async () => {
    for (let i = 0; i < 5; i++) {
      await reserveExecution(ledger.client, "user-1", 5);
    }
    const otherUser = await reserveExecution(ledger.client, "user-2", 5);
    expect(otherUser.allowed).toBe(true);
  });
});
