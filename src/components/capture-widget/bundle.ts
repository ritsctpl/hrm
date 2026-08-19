// Capture widget — bundle assembly, caps, context inference and submission.
//
// Kept separate from the recorder so the size/shape rules can be reasoned about
// (and tested) without patching any globals.
import { captureIngest } from './captureService';
import {
  CAPTURE_MAX_BYTES, CAPTURE_MAX_EVENTS, CAPTURE_MAX_NETWORK, isFailedNetworkEntry,
} from './captureTypes';
import type { CaptureBundle, CaptureNetworkEntry } from './captureTypes';

/**
 * App + screen from the URL. Manufacturing routes are
 * `/manufacturing/rits/<module>_app`, so the segment before `/rits/` is the app
 * and the trailing segment (minus `_app`) is the screen. Falls back to the raw
 * path rather than guessing — a wrong module is worse than a missing one,
 * because the analysis seeds its investigation from it.
 */
export const contextFromPath = (pathname?: string): { appId?: string; screenModule?: string } => {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location?.pathname : '') ?? '';
  const segments = path.split('/').filter(Boolean);
  const ritsAt = segments.indexOf('rits');
  if (ritsAt === -1) {
    return { appId: segments[0] || undefined, screenModule: undefined };
  }
  const appId = ritsAt > 0 ? segments[ritsAt - 1] : undefined;
  const raw = segments[ritsAt + 1];
  const screenModule = raw ? raw.replace(/_app$/, '') : undefined;
  return { appId, screenModule };
};

/**
 * Enforce the caps a second time at submit, independently of the ring buffers.
 * The rings bound COUNT; this bounds SERIALIZED SIZE, which is what the server
 * actually rejects. Trimming drops the OLDEST events — the ones nearest the
 * failure are the ones worth keeping.
 */
export const capBundle = (bundle: CaptureBundle): CaptureBundle => {
  const trimmed: CaptureBundle = {
    bundleVersion: bundle.bundleVersion,
    route: bundle.route,
    routeChanges: (bundle.routeChanges || []).slice(-CAPTURE_MAX_EVENTS),
    network: (bundle.network || []).slice(-CAPTURE_MAX_NETWORK),
    consoleErrors: (bundle.consoleErrors || []).slice(-CAPTURE_MAX_EVENTS),
    failedCalls: (bundle.failedCalls || []).slice(-CAPTURE_MAX_EVENTS),
    breadcrumbs: (bundle.breadcrumbs || []).slice(-CAPTURE_MAX_EVENTS),
    meta: bundle.meta,
  };

  const size = () => JSON.stringify(trimmed).length;
  const failed = (e: CaptureNetworkEntry) => isFailedNetworkEntry(e);

  // Shed order (TB8): successful response bodies → request bodies → breadcrumbs →
  // oldest successful entries. FAILED calls keep their detail longest, because
  // they are the reason the recording exists.
  if (size() > CAPTURE_MAX_BYTES) {
    trimmed.network = (trimmed.network || []).map((e) =>
      (failed(e) ? e : { ...e, respBody: undefined }));
  }
  if (size() > CAPTURE_MAX_BYTES) {
    trimmed.network = (trimmed.network || []).map((e) =>
      (failed(e) ? e : { ...e, reqBody: undefined }));
  }
  while (size() > CAPTURE_MAX_BYTES && (trimmed.breadcrumbs?.length || 0) > 20) {
    trimmed.breadcrumbs = trimmed.breadcrumbs.slice(Math.ceil(trimmed.breadcrumbs.length / 2));
  }
  // Drop successful entries oldest-first, never touching failures while any
  // success remains.
  while (size() > CAPTURE_MAX_BYTES && (trimmed.network || []).some((e) => !failed(e))) {
    const idx = (trimmed.network || []).findIndex((e) => !failed(e));
    trimmed.network = (trimmed.network || []).filter((_, i) => i !== idx);
  }
  // Only now start on the failures' bodies, then the oldest console errors.
  if (size() > CAPTURE_MAX_BYTES) {
    trimmed.network = (trimmed.network || []).map((e) => ({ ...e, respBody: undefined }));
    trimmed.failedCalls = (trimmed.failedCalls || []).map((c) => ({
      ...c, requestBody: undefined, responseBody: undefined,
    }));
  }
  while (size() > CAPTURE_MAX_BYTES && trimmed.consoleErrors.length > 10) {
    trimmed.consoleErrors = trimmed.consoleErrors.slice(Math.ceil(trimmed.consoleErrors.length / 2));
  }

  // `failedCalls` mirrors `network` — re-derive so the two cannot disagree after
  // whatever shedding just happened.
  trimmed.failedCalls = (trimmed.network || []).filter(failed).map((e) => ({
    url: e.url, method: e.method, status: e.status,
    requestBody: e.reqBody, responseBody: e.respBody, ts: e.ts,
  }));

  return trimmed;
};

export interface SubmitCaptureArgs {
  bundle: CaptureBundle;
  description?: string;
  reporterEmail?: string;
  pathname?: string;
  type?: 'PROBLEM' | 'CHANGE_REQUEST';
}

/**
 * POST the bundle as a draft ticket. Returns the created ticket id so the widget
 * can hand the user straight to the conversation — analysis has already started
 * by the time they arrive.
 */
export const submitCapture = async (args: SubmitCaptureArgs): Promise<string | null> => {
  const { appId, screenModule } = contextFromPath(args.pathname);
  const res = await captureIngest({
    description: args.description,
    appId,
    screenModule,
    reporterEmail: args.reporterEmail,
    type: args.type,
    bundle: capBundle(args.bundle),
  });
  if (res?.errorCode) throw new Error(res.message || 'Could not create the ticket');
  const ticket = res?.ticket ?? res?.response?.ticket ?? res?.response ?? res;
  return ticket?.id ?? null;
};
