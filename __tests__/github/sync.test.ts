import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock the three I/O dependencies of sync.ts -----------------------------
const putFile = vi.fn();
vi.mock("@/lib/github/client", () => ({ putFile: (...a: unknown[]) => putFile(...a) }));
vi.mock("@/lib/crypto/api-keys", () => ({ decryptApiKey: () => "decrypted-token" }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => ({ from: fromMock }) }));

import { buildSubmissionPath, syncSubmission } from "@/lib/github/sync";

/** Minimal chainable Supabase stub: `.single()` resolves data; awaiting resolves { count }. */
function tableStub(opts: { single?: unknown; count?: number }) {
  const stub: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "limit"]) stub[m] = () => stub;
  stub.single = () => Promise.resolve({ data: opts.single ?? null, error: null });
  stub.then = (resolve: (v: unknown) => void) => resolve({ count: opts.count ?? 0, error: null });
  return stub;
}

const CONN = {
  github_login: "octo",
  repo_full_name: "octo/cpproad-submissions",
  encrypted_token: "c",
  iv: "i",
  auth_tag: "t",
};
const EX = { title: "Two Sum", lessons: { number: "1.5", slug: "vars" } };

beforeEach(() => {
  putFile.mockReset();
  fromMock.mockReset();
  fromMock.mockImplementation((table: string) => {
    if (table === "github_connections") return tableStub({ single: CONN });
    if (table === "exercises") return tableStub({ single: EX });
    if (table === "submissions") return tableStub({ count: 1 }); // this passed submit is row #1 → index 0
    throw new Error(`unexpected table ${table}`);
  });
});

describe("buildSubmissionPath", () => {
  it("groups by lesson, slugifies the exercise title, indexes the file", () => {
    expect(buildSubmissionPath("1.5", "vars", "Two Sum!", 0)).toBe(
      "1.5-vars/two-sum/submission-0.cpp",
    );
  });
});

describe("syncSubmission", () => {
  it("PUTs the solution to the expected path", async () => {
    await syncSubmission({ userId: "u1", exerciseId: "e1", sourceCode: "int main(){}" });
    expect(putFile).toHaveBeenCalledTimes(1);
    expect(putFile).toHaveBeenCalledWith(
      "decrypted-token",
      "octo/cpproad-submissions",
      "1.5-vars/two-sum/submission-0.cpp",
      "int main(){}",
      "Solve Two Sum",
    );
  });

  it("swallows a GitHub failure (never throws)", async () => {
    putFile.mockRejectedValueOnce(new Error("GitHub putFile failed: 500"));
    await expect(
      syncSubmission({ userId: "u1", exerciseId: "e1", sourceCode: "x" }),
    ).resolves.toBeUndefined();
    expect(putFile).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the user has no connection", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "github_connections") return tableStub({ single: null });
      return tableStub({});
    });
    await syncSubmission({ userId: "u1", exerciseId: "e1", sourceCode: "x" });
    expect(putFile).not.toHaveBeenCalled();
  });
});
