const GITHUB_API = "https://api.github.com";

function ghFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/** Keep the "/" separators but percent-encode each path segment. */
function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** Exchange an OAuth `code` for a (non-expiring) user access token. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`GitHub token exchange failed: ${data.error ?? "no access_token"}`);
  }
  return data.access_token;
}

/** Return the authenticated user's GitHub login. */
export async function getGithubLogin(token: string): Promise<string> {
  const res = await ghFetch(token, "/user");
  if (!res.ok) throw new Error(`GitHub /user failed: ${res.status}`);
  const data = (await res.json()) as { login: string };
  return data.login;
}

/** Ensure `<login>/<repo>` exists (public, auto-initialized). Returns its full name. */
export async function ensureRepo(token: string, login: string, repo: string): Promise<string> {
  const check = await ghFetch(token, `/repos/${login}/${repo}`);
  if (check.ok) return `${login}/${repo}`;
  if (check.status !== 404) throw new Error(`GitHub repo check failed: ${check.status}`);

  const create = await ghFetch(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repo,
      private: false,
      auto_init: true,
      description: "My cpproad C++ solutions",
    }),
  });
  if (!create.ok) throw new Error(`GitHub repo create failed: ${create.status}`);
  return `${login}/${repo}`;
}

/** Create/overwrite a file via the Contents API — one call creates one commit. */
export async function putFile(
  token: string,
  repoFullName: string,
  path: string,
  content: string,
  message: string,
): Promise<void> {
  const res = await ghFetch(token, `/repos/${repoFullName}/contents/${encodePath(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
    }),
  });
  if (!res.ok) throw new Error(`GitHub putFile failed: ${res.status}`);
}
