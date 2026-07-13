import { describe, it, expect, vi, afterEach } from "vitest";
import { putFile } from "@/lib/github/client";

afterEach(() => vi.restoreAllMocks());

describe("putFile", () => {
  it("PUTs base64 content to the Contents API and encodes path segments", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }));

    await putFile("tok", "octo/cpproad-submissions", "1.5-vars/two sum/submission-0.cpp", "int main(){}", "Solve Two Sum");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://api.github.com/repos/octo/cpproad-submissions/contents/1.5-vars/two%20sum/submission-0.cpp",
    );
    expect(init?.method).toBe("PUT");
    const body = JSON.parse(init!.body as string);
    expect(body.message).toBe("Solve Two Sum");
    expect(Buffer.from(body.content, "base64").toString("utf8")).toBe("int main(){}");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("throws on a non-ok GitHub response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(
      putFile("tok", "octo/repo", "a/b.cpp", "x", "msg"),
    ).rejects.toThrow(/500/);
  });
});
