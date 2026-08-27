'use client';

import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { extractBackendMsg } from '@/modules/hrmTimesheet/utils/backendMessage';
import { HrmWorkforceService } from '../services/hrmWorkforceService';
import { reportSignature, useHrmWorkforceStore } from '../stores/hrmWorkforceStore';
import type { FinalizeResult, FleetDeviceView } from '../types/domain.types';
import type { OfficeNetworkSaveRequest } from '../types/api.types';
import type { AttendanceQuery, FleetFilter, ReportQuery } from '../types/ui.types';

/**
 * Turns a textarea of fingerprints into the de-duplicated array the save request carries — pure,
 * exported and unit-tested in `tests/unit/workforce-fingerprint.spec.ts`.
 *
 * The Office Networks form lets an admin paste gateway MACs, BSSIDs or egress IPs however they have
 * them to hand — comma-separated from a spreadsheet cell, one-per-line from a config dump, or a
 * mix — and each of the three textareas becomes one `string[]` on the wire. Splitting on commas and
 * newlines, trimming, and dropping blanks turns any of those shapes into the same list; a trailing
 * newline or a doubled separator therefore adds no empty entry. De-duplication is first-seen order
 * so the list a person reads back matches the order they typed, and a value pasted twice (the same
 * MAC copied from two rows) collapses to one rather than being saved as a phantom second device.
 */
export function parseFingerprintList(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (text ?? '').split(/[\n,]/)) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * The Fleet tab's client-side filter — pure, exported, and unit-tested in
 * `tests/unit/workforce-filter.spec.ts`.
 *
 * <b>Why client-side.</b> The fleet list is one site's enrolled machines: a few hundred rows at
 * most, already fetched. Round-tripping a search box to a backend that has no search parameter
 * would add latency and a spinner to a filter that is a substring test.
 *
 * <b>What `search` looks at.</b> Hostname, serial and the attributed employee code — the three
 * identities by which somebody actually hunts for a machine ("Senthil's laptop", "PF5GJT06",
 * "the one called wf-it-host-1"). `attributedEmployeeId` is nullable and null is the interesting
 * value (a machine whose activity reaches nobody's attendance), so it is filtered *over*, never
 * filtered *out*: an unattributed row stays findable by its own hostname and serial.
 *
 * An empty — or whitespace-only — search means no search. A blank box must show the whole fleet,
 * not an empty table.
 */
export function filterFleet(rows: FleetDeviceView[], filter: FleetFilter): FleetDeviceView[] {
  const needle = (filter.search ?? '').trim().toLowerCase();
  const liveness = filter.liveness ?? [];

  return (rows ?? []).filter((row) => {
    // Empty selection means "every liveness", not "no liveness" — the two read identically in a
    // multi-select that has just been cleared, and only one of them is a usable screen.
    if (liveness.length > 0 && !liveness.includes(row.liveness)) return false;
    if (!needle) return true;
    return [row.hostname, row.serialNumber, row.attributedEmployeeId].some(
      (field) => !!field && field.toLowerCase().includes(needle),
    );
  });
}

/**
 * The signed-in user, for the `userId` every workforce request carries.
 *
 * The backend's `WorkforceActorResolver` prefers the gateway-set `X-User-ID` header and falls back
 * to the body's `userId` — but this deployment's gateway does not inject that header, so without a
 * body actor every call authorises as an unidentified caller who, by design, holds no grants and
 * sees nothing. Same cookie precedence as `hrmTicket`/`hrmUserGuide`, which is the module-local
 * idiom here; kept local rather than imported from `hrmTicket` so the workforce bundle does not
 * pull in the entire ticket service and store for two lines of cookie reading.
 */
export function useCurrentActor(): string {
  const { userId, rl_user_id, userEmail } = parseCookies();
  return userId || rl_user_id || userEmail || 'system';
}

/**
 * Every network call the workforce screen makes, so the components stay presentational.
 *
 * <b>Errors surface twice, on purpose.</b> `message.error` for the person who is looking at the
 * screen right now, and `store.error` for the tab that has to explain why its table is empty a
 * moment later. An empty fleet and a failed fleet load render identically otherwise, and they call
 * for opposite responses.
 *
 * <b>The 200-with-`errorCode` envelope is already handled — by the shared axios interceptor.</b>
 * `src/services/api.ts` rejects any `/hrm-service/` response whose body carries `errorCode` (or
 * `message_details.msg_type === 'E'`) before it ever reaches the service, so the envelope error and
 * the HTTP error arrive down the same path: the `catch` below. Adding a second `errorCode` check in
 * the service or here would be dead code guarding a case that can no longer arrive. This is the
 * documented resolution of Task 2's carried concern.
 *
 * <b>On failure the slot is cleared.</b> Leaving the previous rows on screen under a fresh error
 * toast is how a stale fleet gets read as the current one.
 */
/**
 * Per-loader issue counters, module-scoped so they outlive the component that started a load.
 *
 * They exist for one job: a superseded run must not stamp a "loaded for" signature. Two report
 * requests can resolve in either order, and a slow older run finishing last would otherwise mark
 * the slot as holding an answer to ITS query — after which a remount compares the bar against the
 * wrong signature and skips the reload the screen actually needs. The counters are read only around
 * the signature stamp; the rows themselves are still written by whichever run resolves last, and
 * the panels' own run token repairs that case (see `UtilizationPanel`).
 */
let utilizationSeq = 0;
let healthSeq = 0;

export function useHrmWorkforceData() {
  const site = getOrganizationId();
  const userId = useCurrentActor();

  /** Shared failure path: the backend's own sentence wins over any wording invented here. */
  const fail = useCallback((error: unknown, fallback: string) => {
    const text = extractBackendMsg(error, fallback);
    useHrmWorkforceStore.getState().setError(text);
    message.error(text);
  }, []);

  // ── Fleet ───────────────────────────────────────────────────────────

  const refreshFleet = useCallback(async () => {
    const { setFleet, setFleetLoading, setError } = useHrmWorkforceStore.getState();
    setFleetLoading(true);
    setError(null);
    try {
      setFleet(await HrmWorkforceService.listFleet(site, userId));
    } catch (error) {
      fail(error, 'Failed to load the device fleet');
      setFleet([]);
    } finally {
      setFleetLoading(false);
    }
  }, [site, userId, fail]);

  // ── Attendance ──────────────────────────────────────────────────────

  /**
   * Derived employee-days for `q`, or for the range already in the store when `q` is omitted.
   * A `q` that is passed is also written back, so the query bar and the table it explains can
   * never disagree about which window is on screen.
   */
  const loadAttendance = useCallback(
    async (q?: AttendanceQuery) => {
      const store = useHrmWorkforceStore.getState();
      if (q) store.setAttendanceQuery(q);
      const query = q ?? store.attendanceQuery;

      store.setAttendanceLoading(true);
      store.setError(null);
      try {
        const rows = await HrmWorkforceService.listAttendance({
          site,
          userId,
          from: query.from,
          to: query.to,
          // An empty select must not become `employeeId: ""` — the backend would read that as a
          // filter on the employee whose code is the empty string and answer with nothing.
          employeeId: query.employeeId || undefined,
        });
        useHrmWorkforceStore.getState().setAttendance(rows);
      } catch (error) {
        fail(error, 'Failed to load attendance');
        useHrmWorkforceStore.getState().setAttendance([]);
      } finally {
        useHrmWorkforceStore.getState().setAttendanceLoading(false);
      }
    },
    [site, userId, fail],
  );

  /**
   * Re-derives one site-day now, then reloads the attendance range so the operator sees the rows
   * the run just wrote rather than the ones from before it.
   *
   * The counts are reported verbatim. `employeesWritten: 0` alongside `devicesRead > 0` and
   * `unattributedDevices > 0` is the asset-register-drift diagnosis, and a cheerful "Day
   * finalized" would bury the one number that names the problem.
   */
  const finalize = useCallback(
    async (date: string) => {
      const store = useHrmWorkforceStore.getState();
      store.setAttendanceLoading(true);
      store.setError(null);

      let result: FinalizeResult | undefined;
      let failure: string | null = null;
      try {
        result = await HrmWorkforceService.finalizeDay(site, date, userId);
        // A finalize that answers with no body is a failure, not an empty result — `finalizeDay`
        // returns `undefined` there rather than a zero-filled object, because zeros would render
        // as "0 devices read", which is a real and different finding. Never dereferenced unchecked.
        if (!result) {
          failure = `Finalize for ${date} returned no result — the day may not have been re-derived`;
        }
      } catch (error) {
        failure = extractBackendMsg(error, 'Failed to finalize the day');
      }

      // Reload before reporting, and regardless of the outcome: a finalize that failed part-way
      // through may still have written rows, and showing the pre-run table would misreport what is
      // stored. Reporting afterwards also keeps the verdict — `loadAttendance` clears `error` on
      // entry, so an error set before it would be wiped by the very refresh it describes.
      await loadAttendance();

      if (failure) {
        useHrmWorkforceStore.getState().setError(failure);
        message.error(failure);
        return undefined;
      }
      if (result!.skippedNoCalendar) {
        message.warning(`${date} was skipped: the site has no working calendar for that day`);
      } else {
        message.success(
          `${date}: ${result!.devicesRead} device(s) read, ${result!.employeesWritten} employee-day(s) written` +
            (result!.unattributedDevices > 0 ? `, ${result!.unattributedDevices} unattributed` : ''),
        );
      }
      return result;
    },
    [site, userId, loadAttendance],
  );

  // ── Reports ─────────────────────────────────────────────────────────

  const loadUtilization = useCallback(
    async (q?: ReportQuery) => {
      const store = useHrmWorkforceStore.getState();
      if (q) store.setReportQuery(q);
      const query = q ?? store.reportQuery;

      const seq = ++utilizationSeq;
      store.setReportLoading(true);
      store.setError(null);
      try {
        const rows = await HrmWorkforceService.utilization({
          site,
          userId,
          from: query.from,
          to: query.to,
          employeeId: query.employeeId || undefined,
        });
        useHrmWorkforceStore.getState().setUtilization(rows);
        // Only the newest issue stamps the slot. An older run landing late would otherwise claim
        // the slot answers ITS query, and the next remount would trust that and skip its reload.
        if (seq === utilizationSeq) {
          useHrmWorkforceStore.getState().setUtilizationLoadedFor(reportSignature(query, 'utilization'));
        }
      } catch (error) {
        fail(error, 'Failed to load employee utilization');
        useHrmWorkforceStore.getState().setUtilization([]);
        // A failed load holds no answer to anything — clearing the signature is what makes the next
        // mount retry instead of trusting an empty slot.
        if (seq === utilizationSeq) useHrmWorkforceStore.getState().setUtilizationLoadedFor(null);
      } finally {
        useHrmWorkforceStore.getState().setReportLoading(false);
      }
    },
    [site, userId, fail],
  );

  const loadHealth = useCallback(
    async (q?: ReportQuery) => {
      const store = useHrmWorkforceStore.getState();
      if (q) store.setReportQuery(q);
      const query = q ?? store.reportQuery;

      const seq = ++healthSeq;
      store.setReportLoading(true);
      store.setError(null);
      try {
        const rows = await HrmWorkforceService.fleetHealth({
          site,
          userId,
          from: query.from,
          to: query.to,
          serialNumber: query.serialNumber || undefined,
        });
        useHrmWorkforceStore.getState().setFleetHealth(rows);
        if (seq === healthSeq) {
          useHrmWorkforceStore.getState().setFleetHealthLoadedFor(reportSignature(query, 'health'));
        }
      } catch (error) {
        fail(error, 'Failed to load fleet health');
        useHrmWorkforceStore.getState().setFleetHealth([]);
        if (seq === healthSeq) useHrmWorkforceStore.getState().setFleetHealthLoadedFor(null);
      } finally {
        useHrmWorkforceStore.getState().setReportLoading(false);
      }
    },
    [site, userId, fail],
  );

  /**
   * Every device issue at the site, open and resolved alike.
   *
   * No status filter and no date range are sent, matching the backend's own posture: an open issue
   * is open whenever it was detected, and a window would hide the long-standing failure most worth
   * seeing. The screen narrows the list it already has.
   */
  const loadIssues = useCallback(async () => {
    const store = useHrmWorkforceStore.getState();
    store.setReportLoading(true);
    store.setError(null);
    try {
      const rows = await HrmWorkforceService.issues(site, undefined, userId);
      useHrmWorkforceStore.getState().setIssues(rows);
    } catch (error) {
      fail(error, 'Failed to load device issues');
      useHrmWorkforceStore.getState().setIssues([]);
    } finally {
      useHrmWorkforceStore.getState().setReportLoading(false);
    }
  }, [site, userId, fail]);

  // ── Office Networks ─────────────────────────────────────────────────

  /** The site's active office-network fingerprints. Clears the slot on failure, like the others. */
  const loadOfficeNetworks = useCallback(async () => {
    const store = useHrmWorkforceStore.getState();
    store.setOfficeNetworksLoading(true);
    store.setError(null);
    try {
      store.setOfficeNetworks(await HrmWorkforceService.listOfficeNetworks(site, userId));
    } catch (error) {
      fail(error, 'Failed to load office networks');
      useHrmWorkforceStore.getState().setOfficeNetworks([]);
    } finally {
      useHrmWorkforceStore.getState().setOfficeNetworksLoading(false);
    }
  }, [site, userId, fail]);

  /**
   * Creates or updates one fingerprint, then reloads the list so the table shows the saved row
   * rather than the pre-save state. `site`/`userId` are stamped here so callers pass only the form.
   */
  const saveOfficeNetwork = useCallback(
    async (req: Omit<OfficeNetworkSaveRequest, 'site' | 'userId'>): Promise<boolean> => {
      const store = useHrmWorkforceStore.getState();
      store.setOfficeNetworksLoading(true);
      store.setError(null);
      let saved = false;
      try {
        await HrmWorkforceService.saveOfficeNetwork({ ...req, site, userId });
        saved = true;
        message.success('Office network saved');
        // The reload is best-effort: if the list call fails it stamps the list error, but the
        // save already landed — reporting that as a save failure would invite a duplicate
        // re-submit, so success is gated on the save call alone (the returned boolean).
        await loadOfficeNetworks();
      } catch (error) {
        if (!saved) fail(error, 'Failed to save the office network');
      } finally {
        useHrmWorkforceStore.getState().setOfficeNetworksLoading(false);
      }
      return saved;
    },
    [site, userId, fail, loadOfficeNetworks],
  );

  /** Soft-deletes one fingerprint by id, then reloads the list. */
  const deactivateOfficeNetwork = useCallback(
    async (id: string) => {
      const store = useHrmWorkforceStore.getState();
      store.setOfficeNetworksLoading(true);
      store.setError(null);
      try {
        await HrmWorkforceService.deactivateOfficeNetwork(site, id, userId);
        message.success('Office network deactivated');
        await loadOfficeNetworks();
      } catch (error) {
        fail(error, 'Failed to deactivate the office network');
      } finally {
        useHrmWorkforceStore.getState().setOfficeNetworksLoading(false);
      }
    },
    [site, userId, fail, loadOfficeNetworks],
  );

  return {
    refreshFleet,
    loadAttendance,
    finalize,
    loadUtilization,
    loadHealth,
    loadIssues,
    loadOfficeNetworks,
    saveOfficeNetwork,
    deactivateOfficeNetwork,
  };
}
