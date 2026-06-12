import { describe, it, expect, vi, beforeEach } from "vitest";

// The route uses Supabase to enforce rate limits via .from("submissions").select(...).eq(...).gte(...)
// which awaits a `{ count }` result. Build a thenable proxy that supports the full chain.
function makeQueryChainStub(result: unknown) {
  const promise = Promise.resolve(result);
  const proxy: Record<string, unknown> = {
    select: () => proxy,
    eq: () => proxy,
    in: () => proxy,
    gte: () => proxy,
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  return proxy;
}

vi.mock("@/lib/supabase/server", () => ({
  createRouteClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from: vi.fn(() => makeQueryChainStub({ count: 0 })),
  }),
  createServerClient: () => ({}),
}));

const fetchInternalCapstoneMock = vi.fn();
const upsertAttemptMock = vi.fn();
vi.mock("@/lib/capstones/server", () => ({
  fetchInternalCapstone: (...args: unknown[]) => fetchInternalCapstoneMock(...args),
  upsertAttempt: (...args: unknown[]) => upsertAttemptMock(...args),
}));

const runMilestoneTestsMock = vi.fn();
vi.mock("@/lib/capstones/judge0", () => ({
  runMilestoneTests: (...args: unknown[]) => runMilestoneTestsMock(...args),
}));

import { POST } from "@/app/api/capstones/[slug]/run/route";

function makeReq(slug: string, body: unknown): Request {
  return new Request(`http://localhost/api/capstones/${slug}/run`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/capstones/[slug]/run", () => {
  beforeEach(() => {
    fetchInternalCapstoneMock.mockReset();
    upsertAttemptMock.mockReset();
    runMilestoneTestsMock.mockReset();
  });

  it("404s for unknown slug", async () => {
    const res = await POST(makeReq("nope", { milestone_ordinal: 1, source_code: "int main(){}" }), {
      params: { slug: "nope" },
    });
    expect(res.status).toBe(404);
  });

  it("400s when milestone_ordinal is missing or out of range", async () => {
    const res1 = await POST(makeReq("basics", { source_code: "int main(){}" }), {
      params: { slug: "basics" },
    });
    expect(res1.status).toBe(400);

    const res2 = await POST(makeReq("basics", { milestone_ordinal: 6, source_code: "int main(){}" }), {
      params: { slug: "basics" },
    });
    expect(res2.status).toBe(400);
  });

  it("400s when source_code is missing or empty", async () => {
    const res = await POST(makeReq("basics", { milestone_ordinal: 1, source_code: "" }), {
      params: { slug: "basics" },
    });
    expect(res.status).toBe(400);
  });

  it("404s when capstone is unknown to the DB", async () => {
    fetchInternalCapstoneMock.mockResolvedValue(null);
    const res = await POST(
      makeReq("basics", { milestone_ordinal: 1, source_code: "int main(){}" }),
      { params: { slug: "basics" } },
    );
    expect(res.status).toBe(404);
  });

  it("passes milestone tests to runMilestoneTests and upserts on result", async () => {
    fetchInternalCapstoneMock.mockResolvedValue({
      id: "c1",
      slug: "basics",
      stage: "basics",
      language_standard: "c++20",
      milestones: [
        {
          id: "m1",
          ordinal: 1,
          title: "M1",
          spec_anchor: "milestone-1",
          tests: [{ name: "case1", stdin: "", expected_stdout: "hi", timeout_ms: 2000 }],
        },
      ],
    });
    runMilestoneTestsMock.mockResolvedValue({
      overallStatus: "passed",
      testResults: [{ label: "case1", passed: true, expected: "hi", actual: "hi", status: "accepted" }],
    });
    const res = await POST(
      makeReq("basics", { milestone_ordinal: 1, source_code: "int main(){std::cout<<\"hi\";}" }),
      { params: { slug: "basics" } },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overall_status).toBe("passed");
    expect(json.passed).toBe(true);
    expect(upsertAttemptMock).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "m1",
      true,
      null,
    );
  });
});
