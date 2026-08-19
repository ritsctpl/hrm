// Capture widget — the recorder. Design 07 §7 (UF-12).
//
// While ARMED this patches four global surfaces and records what goes wrong:
// console.error/warn, window.onerror + unhandledrejection, failed fetch/XHR, and
// click/route breadcrumbs. Everything lands in ring buffers with hard caps, and
// `stop()` restores every patch it made.
//
// PRIVACY IS THE DESIGN CONSTRAINT, not a feature:
//   · request/response bodies are truncated hard, and only for FAILED calls
//   · headers are never recorded at all — that is the only way to guarantee an
//     Authorization or Cookie header cannot leak into a ticket
//   · recording happens ONLY between arm() and stop(); there is no passive mode
//   · the user sees a pulsing chip the whole time and inspects the bundle before
//     anything is sent
//
// Written framework-free so it can be unit-driven without a browser harness.
import {
  CAPTURE_AUTO_STOP_MS, CAPTURE_BUNDLE_VERSION, CAPTURE_MAX_BYTES, CAPTURE_MAX_EVENTS,
  CAPTURE_MAX_NETWORK, isFailedNetworkEntry,
} from './captureTypes';
import type {
  CaptureBreadcrumb, CaptureBundle, CaptureConsoleError, CaptureFailedCall,
  CaptureNetworkEntry, CaptureRouteChange,
} from './captureTypes';
import {
  isRecordableRequest, sanitizeRequestBody, sanitizeResponseBody,
} from './redact';

/** Bodies are evidence, not archives — enough to identify the failure, no more. */
const BODY_LIMIT = 2000;
const MESSAGE_LIMIT = 2000;

const now = (): string => new Date().toISOString();

/** Monotonic where available — wall-clock deltas can go backwards over an NTP step. */
const perfNow = (): number =>
  (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();

const truncate = (v: unknown, limit = BODY_LIMIT): string => {
  if (v == null) return '';
  let s: string;
  if (typeof v === 'string') s = v;
  else {
    try { s = JSON.stringify(v); } catch { s = String(v); }
  }
  return s.length > limit ? `${s.slice(0, limit)}… [truncated ${s.length - limit} chars]` : s;
};

/** Fixed-size ring: the LAST n events are the ones that explain a failure. */
class Ring<T> {
  protected items: T[] = [];

  constructor(protected readonly cap: number) {}

  push(item: T) {
    this.items.push(item);
    if (this.items.length > this.cap) this.evict();
  }

  protected evict() { this.items.shift(); }

  all(): T[] { return this.items.slice(); }

  get length(): number { return this.items.length; }

  clear() { this.items = []; }
}

/**
 * Network ring that sheds SUCCESSES before failures.
 *
 * A plain ring drops the oldest entry regardless of what it is, so a burst of
 * routine polling can push the one 500 that explains the incident out of the
 * bundle. Failures are the point of the recording, so they are evicted only when
 * nothing else is left to drop.
 */
class NetworkRing extends Ring<CaptureNetworkEntry> {
  protected evict() {
    const oldestSuccess = this.items.findIndex((e) => !isFailedNetworkEntry(e));
    this.items.splice(oldestSuccess >= 0 ? oldestSuccess : 0, 1);
  }
}

/**
 * A readable CSS-ish path for a clicked element. Deliberately shallow and
 * attribute-light: enough for an engineer to find the control, without scraping
 * the page's text content into the bundle.
 */
export const describeElement = (el: Element | null): string => {
  if (!el) return 'unknown';
  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && depth < 4) {
    let part = node.tagName ? node.tagName.toLowerCase() : 'node';
    const id = node.getAttribute?.('id');
    const testid = node.getAttribute?.('data-testid');
    if (testid) part += `[data-testid="${testid}"]`;
    else if (id) part += `#${id}`;
    else {
      const cls = (node.getAttribute?.('class') || '')
        .split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      if (cls) part += `.${cls}`;
    }
    parts.unshift(part);
    node = node.parentElement;
    depth += 1;
  }
  return parts.join(' > ');
};

export interface RecorderState {
  armed: boolean;
  counts: {
    consoleErrors: number;
    /** Failed requests only — the headline number on the chip. */
    failedCalls: number;
    breadcrumbs: number;
    /** v2: every recorded request, successful or not. */
    network: number;
    /** v2: screens visited while armed. */
    routeChanges: number;
  };
  /** Serialized size so far — the chip warns before the cap bites. */
  bytes: number;
  startedAt?: string;
}

export interface RecorderOptions {
  /** Called on every change so the chip can show live counts. */
  onChange?: (state: RecorderState) => void;
  /** Fired when the 10-minute limit stops recording on its own. */
  onAutoStop?: () => void;
}

export class CaptureRecorder {
  private consoleErrors = new Ring<CaptureConsoleError>(CAPTURE_MAX_EVENTS);
  private breadcrumbs = new Ring<CaptureBreadcrumb>(CAPTURE_MAX_EVENTS);
  /** v2 — ALL requests. `failedCalls` is derived from this at bundle time. */
  private network = new NetworkRing(CAPTURE_MAX_NETWORK);
  private routeChanges = new Ring<CaptureRouteChange>(CAPTURE_MAX_EVENTS);

  private armed = false;
  private startedAt?: string;
  private startRoute?: string;
  private autoStopTimer: ReturnType<typeof setTimeout> | null = null;

  // v2 history patches
  private origPushState?: History['pushState'];
  private origReplaceState?: History['replaceState'];
  private onPopStateHandler?: () => void;

  // Saved originals — stop() must leave the page exactly as it found it.
  private origConsoleError?: typeof console.error;
  private origConsoleWarn?: typeof console.warn;
  private origFetch?: typeof window.fetch;
  private origXhrOpen?: any;
  private origXhrSend?: any;
  private onErrorHandler?: (e: ErrorEvent) => void;
  private onRejectionHandler?: (e: PromiseRejectionEvent) => void;
  private onClickHandler?: (e: MouseEvent) => void;

  constructor(private readonly opts: RecorderOptions = {}) {}

  get isArmed(): boolean { return this.armed; }

  state(): RecorderState {
    return {
      armed: this.armed,
      counts: {
        consoleErrors: this.consoleErrors.length,
        failedCalls: this.network.all().filter(isFailedNetworkEntry).length,
        breadcrumbs: this.breadcrumbs.length,
        network: this.network.length,
        routeChanges: this.routeChanges.length,
      },
      bytes: this.bytes(),
      startedAt: this.startedAt,
    };
  }

  private bytes(): number {
    try { return JSON.stringify(this.bundle()).length; } catch { return 0; }
  }

  private changed() { this.opts.onChange?.(this.state()); }

  private pushNetwork(entry: CaptureNetworkEntry) {
    this.network.push(entry);
    this.changed();
  }

  /** Stop recording new events once the serialized bundle reaches the cap. */
  private atCap(): boolean { return this.bytes() >= CAPTURE_MAX_BYTES; }

  // ── Arm ─────────────────────────────────────────────────────────────────
  arm() {
    if (this.armed || typeof window === 'undefined') return;
    this.armed = true;
    this.startedAt = now();
    this.startRoute = window.location?.pathname + (window.location?.search || '');
    this.consoleErrors.clear();
    this.breadcrumbs.clear();
    this.network.clear();
    this.routeChanges.clear();

    // console.error / console.warn
    this.origConsoleError = console.error;
    this.origConsoleWarn = console.warn;
    const record = (args: any[]) => {
      if (this.atCap()) return;
      this.consoleErrors.push({
        message: truncate(args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : a))
          .map((a) => (typeof a === 'string' ? a : truncate(a, 400)))
          .join(' '), MESSAGE_LIMIT),
        ts: now(),
      });
      this.changed();
    };
    console.error = (...args: any[]) => { record(args); this.origConsoleError?.apply(console, args); };
    console.warn = (...args: any[]) => { record(args); this.origConsoleWarn?.apply(console, args); };

    // Uncaught errors + unhandled rejections
    this.onErrorHandler = (e: ErrorEvent) => {
      if (this.atCap()) return;
      this.consoleErrors.push({
        message: truncate(`Uncaught ${e.message}${e.filename ? ` (${e.filename}:${e.lineno})` : ''}`, MESSAGE_LIMIT),
        ts: now(),
      });
      this.changed();
    };
    this.onRejectionHandler = (e: PromiseRejectionEvent) => {
      if (this.atCap()) return;
      const r: any = e.reason;
      this.consoleErrors.push({
        message: truncate(`Unhandled rejection: ${r instanceof Error ? `${r.name}: ${r.message}` : truncate(r, 400)}`, MESSAGE_LIMIT),
        ts: now(),
      });
      this.changed();
    };
    window.addEventListener('error', this.onErrorHandler);
    window.addEventListener('unhandledrejection', this.onRejectionHandler);

    // fetch — v2 records EVERY recordable request, success and failure alike, so
    // the timeline shows what the screen actually did. Headers are still never
    // touched; bodies are redacted then truncated by `redact.ts`.
    this.origFetch = window.fetch?.bind(window);
    if (this.origFetch) {
      const orig = this.origFetch;
      window.fetch = async (input: any, init?: any) => {
        const url = typeof input === 'string' ? input : (input?.url ?? String(input));
        const method = (init?.method || input?.method || 'GET').toUpperCase();
        const record = isRecordableRequest(url);
        const t0 = perfNow();
        try {
          const res = await orig(input, init);
          if (record && !this.atCap()) {
            let respBody = '';
            try { respBody = sanitizeResponseBody(await res.clone().text()); } catch { /* opaque/streamed */ }
            this.pushNetwork({
              url: truncate(url, 500), method, status: res.status,
              durMs: Math.round(perfNow() - t0), ts: now(),
              reqBody: sanitizeRequestBody(init?.body), respBody,
            });
          }
          return res;
        } catch (err: any) {
          if (record && !this.atCap()) {
            this.pushNetwork({
              url: truncate(url, 500), method, status: 'network-error',
              durMs: Math.round(perfNow() - t0), ts: now(),
              reqBody: sanitizeRequestBody(init?.body),
              respBody: sanitizeResponseBody(err?.message ?? String(err)),
            });
          }
          throw err;
        }
      };
    }

    // XHR — same rules, same exclusions.
    const XHR = window.XMLHttpRequest;
    if (XHR?.prototype) {
      this.origXhrOpen = XHR.prototype.open;
      this.origXhrSend = XHR.prototype.send;
      const self = this;
      XHR.prototype.open = function (this: any, method: string, url: string, ...rest: any[]) {
        this.__ctCapture = { method: String(method || 'GET').toUpperCase(), url: String(url || '') };
        return self.origXhrOpen.call(this, method, url, ...rest);
      };
      XHR.prototype.send = function (this: any, bodyArg?: any) {
        const meta = this.__ctCapture;
        if (meta) meta.t0 = perfNow();
        this.addEventListener('loadend', () => {
          if (!meta || self.atCap()) return;
          if (!isRecordableRequest(meta.url)) return;
          let respBody = '';
          try {
            respBody = sanitizeResponseBody(typeof this.responseText === 'string' ? this.responseText : '');
          } catch { /* responseType blocks responseText */ }
          self.pushNetwork({
            url: truncate(meta.url, 500), method: meta.method,
            status: this.status === 0 ? 'network-error' : this.status,
            durMs: Math.round(perfNow() - (meta.t0 ?? perfNow())), ts: now(),
            reqBody: sanitizeRequestBody(bodyArg), respBody,
          });
        });
        return self.origXhrSend.call(this, bodyArg);
      };
    }

    // Route changes — Next.js navigates via history, so patch push/replace and
    // listen for back/forward. Restored in stop() like every other patch.
    this.origPushState = window.history.pushState;
    this.origReplaceState = window.history.replaceState;
    const noteRoute = () => {
      if (this.atCap()) return;
      const url = window.location?.pathname + (window.location?.search || '');
      const last = this.routeChanges.all().slice(-1)[0];
      if (last?.url === url) return;      // replaceState fires for same-URL updates
      this.routeChanges.push({ url, ts: now() });
      this.changed();
    };
    const self2 = this;
    window.history.pushState = function (this: History, ...args: any[]) {
      const r = self2.origPushState!.apply(this, args as any);
      noteRoute();
      return r;
    } as History['pushState'];
    window.history.replaceState = function (this: History, ...args: any[]) {
      const r = self2.origReplaceState!.apply(this, args as any);
      noteRoute();
      return r;
    } as History['replaceState'];
    this.onPopStateHandler = () => noteRoute();
    window.addEventListener('popstate', this.onPopStateHandler);

    // Click breadcrumbs (+ the route we were on when it happened).
    this.onClickHandler = (e: MouseEvent) => {
      if (this.atCap()) return;
      this.breadcrumbs.push({
        selector: describeElement(e.target as Element),
        type: 'click',
        url: window.location?.pathname,
        ts: now(),
      });
      this.changed();
    };
    window.addEventListener('click', this.onClickHandler, true);

    // Nobody should be recorded indefinitely because they forgot to press stop.
    this.autoStopTimer = setTimeout(() => {
      if (!this.armed) return;
      this.stop();
      this.opts.onAutoStop?.();
    }, CAPTURE_AUTO_STOP_MS);

    this.changed();
  }

  // ── Stop: restore everything ────────────────────────────────────────────
  stop(): CaptureBundle {
    if (!this.armed) return this.bundle();
    this.armed = false;

    if (this.autoStopTimer) { clearTimeout(this.autoStopTimer); this.autoStopTimer = null; }
    if (this.origConsoleError) console.error = this.origConsoleError;
    if (this.origConsoleWarn) console.warn = this.origConsoleWarn;
    if (this.origFetch) window.fetch = this.origFetch;
    const XHR = window.XMLHttpRequest;
    if (XHR?.prototype && this.origXhrOpen) {
      XHR.prototype.open = this.origXhrOpen;
      XHR.prototype.send = this.origXhrSend;
    }
    if (this.origPushState) window.history.pushState = this.origPushState;
    if (this.origReplaceState) window.history.replaceState = this.origReplaceState;
    if (this.onErrorHandler) window.removeEventListener('error', this.onErrorHandler);
    if (this.onRejectionHandler) window.removeEventListener('unhandledrejection', this.onRejectionHandler);
    if (this.onClickHandler) window.removeEventListener('click', this.onClickHandler, true);
    if (this.onPopStateHandler) window.removeEventListener('popstate', this.onPopStateHandler);

    this.origConsoleError = undefined;
    this.origConsoleWarn = undefined;
    this.origFetch = undefined;
    this.origXhrOpen = undefined;
    this.origXhrSend = undefined;
    this.origPushState = undefined;
    this.origReplaceState = undefined;
    this.onErrorHandler = undefined;
    this.onRejectionHandler = undefined;
    this.onClickHandler = undefined;
    this.onPopStateHandler = undefined;

    this.changed();
    return this.bundle();
  }

  bundle(): CaptureBundle {
    const network = this.network.all();
    return {
      bundleVersion: CAPTURE_BUNDLE_VERSION,
      route: this.startRoute,
      routeChanges: this.routeChanges.all(),
      network,
      consoleErrors: this.consoleErrors.all(),
      // v1 compatibility: DERIVED, never recorded twice. An older parser reads
      // exactly the failures it always did; the v2 detail lives in `network`.
      failedCalls: network.filter(isFailedNetworkEntry).map((e): CaptureFailedCall => ({
        url: e.url, method: e.method, status: e.status,
        requestBody: e.reqBody, responseBody: e.respBody, ts: e.ts,
      })),
      breadcrumbs: this.breadcrumbs.all(),
      meta: {
        url: typeof window !== 'undefined' ? window.location?.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        startedAt: this.startedAt,
        stoppedAt: now(),
      },
    };
  }

  reset() {
    this.consoleErrors.clear();
    this.breadcrumbs.clear();
    this.network.clear();
    this.routeChanges.clear();
    this.startedAt = undefined;
    this.startRoute = undefined;
    this.changed();
  }
}

export default CaptureRecorder;
