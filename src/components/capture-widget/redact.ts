// Capture widget — body sanitising. Kept separate from the recorder so the rules
// can be reasoned about and unit-driven without patching any globals.
//
// The order matters and is not arbitrary: REDACT FIRST, TRUNCATE SECOND. Truncating
// first can slice a JSON body mid-token, which makes it unparseable — and an
// unparseable body skips redaction entirely, so a secret would survive in the tail
// of a truncated string. Doing it the other way round cannot leak.

/**
 * Keys whose VALUES never travel, at any depth.
 *
 * Extended beyond the TB8 brief after a live capture showed it was not enough:
 * `/manufacturing/api/config` answers 200 with
 * `"NEXT_PUBLIC_ENCRYPTION_KEY":"fcde2b2e…"`, and now that v2 records SUCCESSFUL
 * responses that value was landing verbatim in a stored, reporter-visible bundle.
 * `ENCRYPTION_KEY` matched neither `apikey` nor `secret`. The `…_KEY` family is
 * enumerated rather than matching a bare `key`, which would redact harmless
 * things like `sortKey` and make bundles worse at their job.
 */
export const SENSITIVE_KEY_RE =
  /pass(word)?|token|secret|authorization|credential|signature|cookie|session[-_]?id|api[-_]?key|encrypt(ion)?[-_]?key|private[-_]?key|access[-_]?key|public[-_]?key/i;

export const REDACTED = '•••';   // •••

export const REQ_BODY_LIMIT = 1024;   // 1 KB
export const RESP_BODY_LIMIT = 2048;  // 2 KB — JSON responses, which are evidence
/**
 * Non-JSON responses (TB8b): a failed navigation-ish GET returns a whole HTML
 * error page, and 2 KB of Next boilerplate identifies the failure no better than
 * its first line does. Structured bodies keep the full budget; prose and markup
 * get enough to recognise, not to archive.
 */
export const NON_JSON_RESP_LIMIT = 256;

/** Deep-redact sensitive values in a parsed JSON structure. */
export const redactValue = (value: any, depth = 0): any => {
  if (depth > 12 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redactValue(v, depth + 1));
  if (typeof value !== 'object') return value;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY_RE.test(k) ? REDACTED : redactValue(v, depth + 1);
  }
  return out;
};

const asString = (body: unknown): string => {
  if (body == null) return '';
  if (typeof body === 'string') return body;
  // FormData/Blob/ArrayBuffer etc. — describe, never serialize. A file's bytes are
  // not evidence and could carry anything.
  if (typeof FormData !== 'undefined' && body instanceof FormData) return '[form-data]';
  if (typeof Blob !== 'undefined' && body instanceof Blob) return '[blob]';
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return '[binary]';
  try { return JSON.stringify(body); } catch { return String(body); }
};

const truncate = (s: string, limit: number): string =>
  s.length > limit ? `${s.slice(0, limit)}… [truncated ${s.length - limit} chars]` : s;

/**
 * Redact then truncate. Non-JSON bodies are truncated as-is (there is no
 * structure to redact), which is why the sensitive-key rule is documented to the
 * user as applying to system requests rather than to arbitrary text.
 */
export const sanitizeBody = (body: unknown, limit: number): string => {
  const raw = asString(body);
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return truncate(JSON.stringify(redactValue(JSON.parse(trimmed))), limit);
    } catch {
      /* not valid JSON after all — fall through to a plain truncate */
    }
  }
  return truncate(raw, limit);
};

export const sanitizeRequestBody = (body: unknown): string => sanitizeBody(body, REQ_BODY_LIMIT);

/**
 * Responses get a two-tier budget: JSON is the diagnostic payload and keeps 2 KB,
 * everything else (HTML error pages, plain text) is capped hard. `sanitizeBody`
 * already picks the JSON path only when the body actually parses, so passing the
 * generous limit for a non-JSON body would silently over-keep — hence the probe
 * before choosing the limit.
 */
export const sanitizeResponseBody = (body: unknown): string => {
  const raw = typeof body === 'string' ? body.trim() : '';
  const looksJson = raw.startsWith('{') || raw.startsWith('[');
  if (looksJson) {
    try {
      JSON.parse(raw);
      return sanitizeBody(body, RESP_BODY_LIMIT);
    } catch {
      /* claims to be JSON but is not — treat as prose */
    }
  }
  // Non-string bodies (objects we serialize ourselves) are structured, so they
  // keep the JSON budget; raw text and markup do not.
  if (typeof body !== 'string') return sanitizeBody(body, RESP_BODY_LIMIT);
  return sanitizeBody(body, NON_JSON_RESP_LIMIT);
};

// ─── Asset noise ──────────────────────────────────────────────────────────
const ASSET_EXT_RE = /\.(js|mjs|cjs|css|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|mp4|webm|wasm)(\?|$)/i;
// `__next…` needs the prefix form, not an exact segment: Next's dev overlay calls
// `/__nextjs_original-stack-frames`, which our own console patch TRIGGERS. Left
// unfiltered it lands in every bundle captured on a dev server, carrying a large
// body full of `webpack-internal:///./src/...` paths — internal source structure
// inside a reporter-visible artefact, and enough volume to crowd the ring buffer.
const ASSET_PATH_RE = /(^|\/)(_next|__next[\w-]*|static|assets|fonts|favicon)(\/|$)/i;

/**
 * Is this request worth recording? A page load fires hundreds of chunk and font
 * requests that tell you nothing about the incident and would blow the ring
 * buffer before the interesting call arrives.
 */
export const isRecordableRequest = (url: string): boolean => {
  if (!url) return false;
  let path = url;
  try {
    path = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost').pathname;
  } catch {
    /* relative or malformed — test the raw string */
  }
  if (ASSET_PATH_RE.test(path)) return false;
  if (ASSET_EXT_RE.test(path)) return false;
  return true;
};
