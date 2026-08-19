// Capture widget — types & caps. Minimal extract of the capture slice of the
// Manufacturing app's ticket_app/types/ticketTypes.ts (UF-12). HRM has no
// ticket_app module, so the widget carries its own copy of exactly the pieces it
// needs: the bundle shape, the hard caps, and the three helpers.

export interface CaptureConsoleError {
  message: string;
  ts?: string;
}

export interface CaptureFailedCall {
  url: string;
  method?: string;
  status?: number | string;
  requestBody?: string;
  responseBody?: string;
  ts?: string;
}

export interface CaptureBreadcrumb {
  selector: string;
  ts?: string;
  /** 'click' | 'route' — the widget records both; the viewer shows whatever arrives. */
  type?: string;
  text?: string;
  url?: string;
}

/** v2 — every request made while armed, not just the ones that failed. */
export interface CaptureNetworkEntry {
  url: string;
  method?: string;
  status?: number | string;
  /** Round-trip milliseconds, rounded. */
  durMs?: number;
  ts?: string;
  reqBody?: string;
  respBody?: string;
}

export interface CaptureRouteChange {
  url: string;
  ts?: string;
}

/**
 * Bundle schema. v2 adds `route`/`routeChanges`/`network` and the version marker;
 * every v1 field is still populated, so an older parser and the v1 branch of the
 * viewer keep working unchanged.
 */
export interface CaptureBundle {
  bundleVersion?: number;
  /** Where recording started. */
  route?: string;
  routeChanges?: CaptureRouteChange[];
  network?: CaptureNetworkEntry[];
  consoleErrors: CaptureConsoleError[];
  /** v1 compatibility — derived from `network`, never recorded separately. */
  failedCalls: CaptureFailedCall[];
  breadcrumbs: CaptureBreadcrumb[];
  meta?: Record<string, any>;
}

export const CAPTURE_BUNDLE_VERSION = 2;

/** Rolling window of network entries kept in the bundle. */
export const CAPTURE_MAX_NETWORK = 100;

/** A network entry counts as failed at 4xx/5xx or a transport error. */
export const isFailedNetworkEntry = (e: CaptureNetworkEntry): boolean => {
  const n = Number(e.status);
  return !Number.isFinite(n) || n === 0 || n >= 400;
};

/** Hard caps (design 07 §7) — enforced by the recorder's ring buffers. */
export const CAPTURE_MAX_EVENTS = 500;
export const CAPTURE_MAX_BYTES = 1024 * 1024;
/** Recording stops on its own after this long, armed or not. */
export const CAPTURE_AUTO_STOP_MS = 10 * 60 * 1000;

export const captureBundleSize = (b: CaptureBundle): number =>
  (b.consoleErrors?.length || 0)
  + (b.failedCalls?.length || 0)
  + (b.breadcrumbs?.length || 0)
  + (b.network?.length || 0)
  + (b.routeChanges?.length || 0);

export const isCaptureBundleEmpty = (b: CaptureBundle): boolean => captureBundleSize(b) === 0;
