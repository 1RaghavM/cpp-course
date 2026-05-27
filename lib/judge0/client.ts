// ---------------------------------------------------------------------------
// Judge0 HTTP Client — submits C++ code and returns structured results
// ---------------------------------------------------------------------------

const MAX_SOURCE_SIZE_BYTES = 50 * 1024; // 50 KB
const HTTP_TIMEOUT_MS = 10_000; // 10 seconds

// ---- Language ID mapping (Judge0 CE) --------------------------------------

/** Maps our app-level C++ standard names to Judge0 language IDs. */
const LANGUAGE_ID_MAP: Record<CppStandard, number> = {
  'c++17': 54, // C++ (GCC 9.2.0)  — C++17
  'c++20': 76, // C++ (GCC 11.1.0) — C++20
  'c++23': 76, // best available; same compiler, we add -std=c++23 flag
} as const;

/** Default compiler flags per standard. */
const COMPILER_FLAGS: Record<CppStandard, string> = {
  'c++17': '-std=c++17 -Wall -Wextra',
  'c++20': '-std=c++2a -Wall -Wextra', // c++2a for older GCC versions
  'c++23': '-std=c++2b -Wall -Wextra', // c++2b for older GCC versions
} as const;

// ---- Public types ---------------------------------------------------------

export type CppStandard = 'c++17' | 'c++20' | 'c++23';

export interface SubmissionParams {
  sourceCode: string;
  stdin?: string;
  languageStd?: CppStandard;
  /** CPU time limit in seconds. Default 5. */
  cpuTimeLimit?: number;
  /** Memory limit in KB. Default 256 000 (≈ 250 MB). */
  memoryLimit?: number;
}

export type JudgeStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'tle'
  | 'compile_error'
  | 'runtime_error'
  | 'mle'
  | 'error';

export interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  status: JudgeStatus;
  /** Wall-clock time in milliseconds. */
  wallTimeMs: number;
}

export interface Judge0Error {
  ok: false;
  error: string;
}

export type SubmitCodeResult =
  | { ok: true; data: SubmissionResult }
  | Judge0Error;

// ---- Judge0 response shape (partial) -------------------------------------

interface Judge0StatusField {
  id: number;
  description: string;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  exit_code: number | null;
  status: Judge0StatusField;
  wall_time: string | null; // seconds as a decimal string, e.g. "0.034"
}

// ---- Helpers --------------------------------------------------------------

function base64Encode(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

function base64Decode(value: string | null): string | null {
  if (value === null || value === undefined) return null;
  return Buffer.from(value, 'base64').toString('utf-8');
}

/**
 * Maps a Judge0 status ID to our app-level {@link JudgeStatus}.
 *
 * Judge0 status IDs:
 *   1 — In Queue, 2 — Processing,
 *   3 — Accepted,
 *   4 — Wrong Answer,
 *   5 — Time Limit Exceeded,
 *   6 — Compilation Error,
 *   7 — Runtime Error (SIGSEGV),
 *   8 — Runtime Error (SIGXFSZ),
 *   9 — Runtime Error (SIGFPE),
 *   10 — Runtime Error (SIGABRT),
 *   11 — Runtime Error (NZEC — non-zero exit code),
 *   12 — Runtime Error (Other),
 *   13 — Internal Error,
 *   14 — Exec Format Error (treated as MLE / system error)
 */
function mapStatus(statusId: number): JudgeStatus {
  if (statusId === 3) return 'accepted';
  if (statusId === 4) return 'wrong_answer';
  if (statusId === 5) return 'tle';
  if (statusId === 6) return 'compile_error';
  if (statusId >= 7 && statusId <= 12) return 'runtime_error';
  if (statusId === 13) return 'error';
  if (statusId >= 14) return 'mle';
  // Status 1 (In Queue) or 2 (Processing) should not appear when using
  // wait=true, but handle gracefully.
  return 'error';
}

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// ---- Main export ----------------------------------------------------------

/**
 * Submit C++ source code to the Judge0 instance and wait for the result.
 *
 * Uses `wait=true` for synchronous execution (no polling) which is acceptable
 * for a single-user learning platform.
 */
export async function submitCode(
  params: SubmissionParams,
): Promise<SubmitCodeResult> {
  const {
    sourceCode,
    stdin,
    languageStd = 'c++20',
    cpuTimeLimit = 5,
    memoryLimit = 256_000,
  } = params;

  // ---- Pre-flight checks --------------------------------------------------

  const sourceBytes = Buffer.byteLength(sourceCode, 'utf-8');
  if (sourceBytes > MAX_SOURCE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Source code too large (${sourceBytes} bytes). Maximum allowed is ${MAX_SOURCE_SIZE_BYTES} bytes (50 KB).`,
    };
  }

  // ---- Build request body -------------------------------------------------

  const languageId = LANGUAGE_ID_MAP[languageStd];
  const compilerFlags = COMPILER_FLAGS[languageStd];

  const body: Record<string, unknown> = {
    source_code: base64Encode(sourceCode),
    language_id: languageId,
    compiler_options: compilerFlags,
    cpu_time_limit: cpuTimeLimit,
    memory_limit: memoryLimit,
  };

  if (stdin !== undefined) {
    body.stdin = base64Encode(stdin);
  }

  // ---- Send request -------------------------------------------------------

  const judge0Url = getEnvOrThrow('JUDGE0_URL');
  const authToken = getEnvOrThrow('JUDGE0_AUTH_TOKEN');

  const url = `${judge0Url}/submissions?base64_encoded=true&wait=true`;

  // Detect RapidAPI vs self-hosted based on URL
  const isRapidApi = judge0Url.includes('rapidapi.com');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isRapidApi) {
    headers['X-RapidAPI-Key'] = authToken;
    headers['X-RapidAPI-Host'] = new URL(judge0Url).host;
  } else {
    headers['X-Auth-Token'] = authToken;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return {
        ok: false,
        error: 'Judge0 request timed out after 10 seconds.',
      };
    }
    if (err instanceof TypeError) {
      // fetch throws TypeError for network failures (DNS, connection refused, etc.)
      return {
        ok: false,
        error: `Judge0 unreachable: ${(err as Error).message}`,
      };
    }
    return {
      ok: false,
      error: `Judge0 request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    return {
      ok: false,
      error: `Judge0 returned HTTP ${response.status}: ${text}`,
    };
  }

  // ---- Parse response -----------------------------------------------------

  const json = (await response.json()) as Judge0Response;

  const result: SubmissionResult = {
    stdout: base64Decode(json.stdout),
    stderr: base64Decode(json.stderr),
    compileOutput: base64Decode(json.compile_output),
    exitCode: json.exit_code,
    status: mapStatus(json.status.id),
    wallTimeMs: json.wall_time ? Math.round(parseFloat(json.wall_time) * 1000) : 0,
  };

  return { ok: true, data: result };
}
