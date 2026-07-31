'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal, Form, Select, DatePicker, Input, Button, Space, Checkbox,
  Alert, Typography, Spin, Tag, Upload, List, message,
} from 'antd';
import { PaperClipOutlined, PrinterOutlined, DeleteOutlined } from '@ant-design/icons';
import { getOrganizationId } from '@/utils/cookieUtils';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { useHrmAssetData } from '../../hooks/useHrmAssetData';
import { useCanDirectAssign } from '../../hooks/useCanDirectAssign';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import {
  ASSIGNMENT_REASONS,
  ASSIGNMENT_ATTACHMENT_ACCEPT,
  ASSIGNMENT_ATTACHMENT_MAX_FILES,
  NON_ASSIGNABLE_EMPLOYMENT_STATUSES,
  WARN_EMPLOYMENT_STATUSES,
} from '../../utils/assetConstants';
import { buildDirectAssignRules, validateAssignmentAttachment } from '../../utils/assetValidations';
import { mapAssignError } from '../../utils/assignErrorMap';
import type { AssignErrorInfo } from '../../utils/assignErrorMap';
import { getDirectAssignBlockReason, formatDate, formatCurrency } from '../../utils/assetHelpers';
import { printHandoverSlip, findSerialNumber } from '../../utils/handoverSlip';
import { runWithConcurrency, downloadBulkAssignReport } from '../../utils/bulkAssign';
import type { BulkAssignResult } from '../../utils/bulkAssign';
import type { AssetResponse, AssetListResponse } from '../../types/api.types';

interface EmployeeChoice {
  value: string;
  label: string;
  fullName: string;
  department?: string;
  location?: string;
  designation?: string;
  joiningDate?: string;
  employmentStatus?: string;
  lastWorkingDay?: string;
}

/**
 * One asset's outcome, carrying the mapper's routing hints so the single-asset
 * path can put the message on the right control while the bulk path only needs
 * the text.
 */
type AssignAttempt = BulkAssignResult & Pick<AssignErrorInfo, 'field' | 'refreshAsset'>;

/** What the last completed run produced, for the success state's actions. */
interface RunOutcome {
  results: AssignAttempt[];
  employeeId: string;
  employeeName?: string;
  assignmentDate: string;
}

/**
 * Direct assignment: an authorised user hands an in-store asset straight to an
 * employee. Deliberately bypasses the asset-request approval chain — the
 * request-driven path lives in AllocationPanel and is unaffected.
 *
 * Opens in one of three modes (see AssignModalContext):
 *   asset    — asset locked, employee searchable    (from the asset list/detail)
 *   employee — employee locked, asset searchable    (from an employee record)
 *   bulk     — fixed asset set, one employee for all (from the list toolbar)
 *
 * Gated on the `asset_direct_assign` ADD grant, which the service re-checks on
 * every call — a 403 here is handled as a disagreement between the two, not as
 * an ordinary form error.
 */
interface AssignAssetModalProps {
  /**
   * Fired after each successful assignment. Lets a host outside the asset
   * module (e.g. the employee record's Assets tab) refresh its own view —
   * the modal only knows how to refresh asset-module state.
   */
  onAssigned?: (assetId: string, employeeId: string) => void;
}

export default function AssignAssetModal({ onAssigned }: AssignAssetModalProps = {}) {
  const {
    assignModalContext: ctx,
    closeAssignModal,
    updateAssetInList,
    clearBulkAssignSelection,
    setActiveDetailTab,
    setSelectedAsset,
    assets,
  } = useHrmAssetStore();
  const data = useHrmAssetData();
  const canDirectAssign = useCanDirectAssign();
  const identity = useEmployeeIdentity();
  const clearSectionCache = useHrmRbacStore((s) => s.clearSectionCache);

  /**
   * Who the service will treat as the actor.
   *
   * This must be the RBAC user id, NOT the employee code: the service resolves
   * the direct-assign grant with `rbacService.getEffectivePermissions(site,
   * assignedBy)` (AssetRegisterServiceImpl#requireDirectAssignPermission), and
   * role assignments are keyed by login id — `rits_hrm_admin`,
   * `someone@ritsconsulting.com` — not by `R20002`. Sending the employee code
   * would fail the check with 403 for a user who genuinely holds the grant.
   *
   * It is also the same id this screen used to decide whether to render the
   * button at all, so the client and the service now agree by construction
   * rather than by coincidence.
   *
   * The employee code is kept only as a fallback for deployments where the two
   * happen to be the same value.
   */
  const rbacUserId = useHrmRbacStore((s) => s.userId);
  const actorId = rbacUserId || identity.employeeCode;
  const [form] = Form.useForm();

  const [employees, setEmployees] = useState<EmployeeChoice[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [inStoreAssets, setInStoreAssets] = useState<AssetListResponse[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // The asset as the SERVER sees it right now. The list row backing the entry
  // point can be minutes stale, so nothing is submitted until this resolves.
  const [liveAsset, setLiveAsset] = useState<AssetResponse | null>(null);
  const [checkingAsset, setCheckingAsset] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  // Bulk mode: the working set, which the user can prune before submitting.
  const [bulkAssetIds, setBulkAssetIds] = useState<string[]>([]);

  const [holdings, setHoldings] = useState<AssetListResponse[] | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [handoverConfirmed, setHandoverConfirmed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  // One key per modal opening, reused across retries of the same attempt so a
  // replayed write can be recognised as a replay (see HrmAssetService).
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const open = ctx !== null;
  const mode = ctx?.kind;
  const lockedEmployeeId = ctx?.kind === 'employee' ? ctx.employeeId : undefined;
  const isBulk = mode === 'bulk';
  const assetLocked = mode === 'asset';

  const lockedAssetId = ctx?.kind === 'asset' ? ctx.assetId : undefined;

  // Bulk rows are read off the already-loaded list rather than re-fetched: the
  // service re-validates each asset and reports per-asset failures, which is
  // exactly the staleness handling bulk mode is built around.
  const bulkRows = useMemo(
    () => bulkAssetIds.map((id) => ({
      assetId: id,
      row: assets.find((a) => a.assetId === id),
    })),
    [bulkAssetIds, assets],
  );

  const employee = useMemo(
    () => employees.find((e) => e.value === selectedEmployeeId),
    [employees, selectedEmployeeId],
  );

  const rules = useMemo(
    () => buildDirectAssignRules({
      purchaseDate: liveAsset?.purchaseDate,
      joiningDate: employee?.joiningDate,
    }),
    [liveAsset?.purchaseDate, employee?.joiningDate],
  );

  const resetTransient = useCallback(() => {
    setLiveAsset(null);
    setBlockReason(null);
    setSubmitError(null);
    setHoldings(null);
    setSelectedEmployeeId(undefined);
    setAttachments([]);
    setHandoverConfirmed(false);
    setDirty(false);
  }, []);

  // Fresh idempotency key each time the modal opens, per screen.md §8.4.
  useEffect(() => {
    if (open) setIdempotencyKey(uuidv4());
  }, [open]);

  // Seed the bulk working set from the context, and keep the locked-employee
  // selection in sync so the warning/validation code has one place to read.
  useEffect(() => {
    if (ctx?.kind === 'bulk') setBulkAssetIds(ctx.assetIds);
  }, [ctx]);

  useEffect(() => {
    if (lockedEmployeeId) setSelectedEmployeeId(lockedEmployeeId);
  }, [lockedEmployeeId]);

  // ── Load the searchable side's options ───────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    let cancelled = false;
    setLoadingEmployees(true);
    // Employee-locked mode still needs the row — joining date, lifecycle stage
    // and department drive R-14 and the pre-submit warnings — so it fetches the
    // single matching record instead of the whole directory.
    const request = lockedEmployeeId
      ? HrmEmployeeService.searchByKeyword(organizationId, lockedEmployeeId)
      : HrmEmployeeService.fetchDirectory({ organizationId, page: 0, size: 1000 });
    request
      .then((res) => {
        if (cancelled) return;
        setEmployees(
          (res.employees || [])
            // Employees who cannot legally hold an asset are left out of the
            // picker rather than rejected at submit time. employmentStatus is
            // not in the directory projection yet, so absent reads as "fine" —
            // the service still blocks the hand-over with ASSET_010.
            //
            // The locked-employee lookup is exempt: that employee was chosen
            // elsewhere, and silently dropping the row would strip the context
            // this form needs without telling anyone why.
            .filter((emp) => !!lockedEmployeeId || (
              emp.isActive !== false
              && (emp.status ?? 'ACTIVE') === 'ACTIVE'
              && !NON_ASSIGNABLE_EMPLOYMENT_STATUSES.includes((emp.employmentStatus ?? '').toUpperCase())
            ))
            .map((emp) => ({
              // The asset backend stores the bare employeeCode as the holder id.
              value: emp.employeeCode,
              label: emp.fullName ? `${emp.employeeCode} - ${emp.fullName}` : emp.employeeCode,
              fullName: emp.fullName ?? emp.employeeCode,
              department: emp.department,
              location: emp.location,
              designation: emp.designation,
              joiningDate: emp.joiningDate,
              employmentStatus: emp.employmentStatus,
              lastWorkingDay: emp.lastWorkingDay,
            })),
        );
      })
      .catch(() => {
        if (!cancelled && !lockedEmployeeId) message.error('Failed to load employee list');
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployees(false);
      });
    return () => { cancelled = true; };
  }, [open, lockedEmployeeId]);

  useEffect(() => {
    if (!open || mode !== 'employee') return;
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    let cancelled = false;
    setLoadingAssets(true);
    // No server-side asset text search exists, so the picker pulls the in-store
    // set and filters client-side. Revisit if inventories get large.
    HrmAssetService.getAssetsByStatus(organizationId, 'IN_STORE')
      .then((assets) => { if (!cancelled) setInStoreAssets(assets || []); })
      .catch(() => { if (!cancelled) message.error('Failed to load available assets'); })
      .finally(() => { if (!cancelled) setLoadingAssets(false); });
    return () => { cancelled = true; };
  }, [open, mode]);

  // ── Freshness: re-read the asset before trusting its status ──────────────

  const verifyAsset = useCallback(async (assetId: string) => {
    const organizationId = getOrganizationId();
    setCheckingAsset(true);
    setBlockReason(null);
    try {
      const asset = await HrmAssetService.getAsset(organizationId, assetId);
      setLiveAsset(asset);
      setBlockReason(getDirectAssignBlockReason(asset));
    } catch {
      setLiveAsset(null);
      setBlockReason('Could not confirm this asset’s current status. Refresh and try again.');
    } finally {
      setCheckingAsset(false);
    }
  }, []);

  useEffect(() => {
    if (open && lockedAssetId) verifyAsset(lockedAssetId);
  }, [open, lockedAssetId, verifyAsset]);

  // ── Employee holdings — shown BEFORE submitting, not after ───────────────

  const loadHoldings = useCallback(async (employeeId: string) => {
    const organizationId = getOrganizationId();
    setHoldings(null);
    try {
      const held = await HrmAssetService.getAssetsByEmployee(organizationId, employeeId);
      setHoldings(held || []);
    } catch {
      // Non-critical context; never block the assignment on it.
      setHoldings(null);
    }
  }, []);

  useEffect(() => {
    if (open && selectedEmployeeId) loadHoldings(selectedEmployeeId);
  }, [open, selectedEmployeeId, loadHoldings]);

  const holdingsNote = useMemo(() => {
    if (!holdings) return null;
    if (!holdings.length) return 'Currently holds no assets.';
    const summary = `Currently holds ${holdings.length} asset${holdings.length === 1 ? '' : 's'}`;
    const category = liveAsset?.categoryCode;
    const sameCategory = category
      ? holdings.filter((a) => a.categoryCode === category).length
      : 0;
    return sameCategory > 0 && liveAsset
      ? `${summary}, including ${sameCategory} in ${liveAsset.categoryName || liveAsset.categoryCode}.`
      : `${summary}.`;
  }, [holdings, liveAsset]);

  /**
   * Conditions that are allowed but worth a second look. Presented in a confirm
   * dialog before the call goes out (screen.md §7.2, §8.1) — a warning is not a
   * block, because sometimes the direct assignment is precisely the intent.
   */
  const collectWarnings = useCallback((): string[] => {
    const warnings: string[] = [];
    const status = (employee?.employmentStatus ?? '').toUpperCase();
    if (WARN_EMPLOYMENT_STATUSES.includes(status)) {
      warnings.push(
        employee?.lastWorkingDay
          ? `Employee is serving notice (last working day ${formatDate(employee.lastWorkingDay)}).`
          : 'Employee is serving notice.',
      );
    }
    // Duplicate-category holding. The category schema carries no per-employee
    // cap, so this can only ever warn — it cannot claim a limit was exceeded.
    const targetCategories = (isBulk
      ? bulkRows.map((r) => r.row?.categoryCode)
      : [liveAsset?.categoryCode]
    ).filter((code, i, all): code is string => !!code && all.indexOf(code) === i);
    targetCategories.forEach((category) => {
      const held = (holdings ?? []).filter((a) => a.categoryCode === category);
      if (held.length > 0) {
        const name = held[0].categoryName || category;
        warnings.push(
          `Employee already holds ${held.length} ${name} asset${held.length === 1 ? '' : 's'}.`,
        );
      }
    });
    return warnings;
  }, [employee, isBulk, bulkRows, liveAsset, holdings]);

  // ── Close / discard ──────────────────────────────────────────────────────

  const doClose = useCallback(() => {
    form.resetFields();
    resetTransient();
    setOutcome(null);
    setBulkAssetIds([]);
    // The ticks in the list refer to a selection that has now been acted on.
    // Only touched for a bulk run — a single row action must leave a selection
    // the user built up for a different submission alone.
    if (isBulk) clearBulkAssignSelection();
    closeAssignModal();
  }, [form, resetTransient, isBulk, clearBulkAssignSelection, closeAssignModal]);

  const requestClose = useCallback(() => {
    if (!dirty || submitting || outcome) { doClose(); return; }
    Modal.confirm({
      title: 'Discard this assignment?',
      content: 'The details you entered will be lost.',
      okText: 'Discard',
      okButtonProps: { danger: true },
      cancelText: 'Keep editing',
      onOk: doClose,
    });
  }, [dirty, submitting, outcome, doClose]);

  // ── Submit ───────────────────────────────────────────────────────────────

  /** Uploads the handover paperwork against the asset it belongs to. */
  const uploadAttachments = async (assetId: string) => {
    if (!attachments.length) return;
    const organizationId = getOrganizationId();
    for (const file of attachments) {
      try {
        await HrmAssetService.uploadAttachment(
          organizationId, assetId, file, identity.employeeCode || actorId,
        );
      } catch {
        // The hand-over itself already succeeded; say what did not so the user
        // can re-attach from the Attachments tab rather than re-assigning.
        message.warning(`Assigned, but "${file.name}" could not be attached to ${assetId}.`);
      }
    }
  };

  const performSubmit = async (values: any) => {
    const organizationId = getOrganizationId();
    const employeeId = selectedEmployeeId!;
    const employeeName = employee?.fullName
      ?? (ctx?.kind === 'employee' ? ctx.employeeName : undefined)
      ?? '';

    // Both are first-class fields on the service. The reason is validated
    // server-side against the same seven codes this form offers (ASSET_011),
    // and OTHER additionally demands 10+ characters of remarks (ASSET_012) —
    // the same rule R-10 applies here, so a valid form is a valid request.
    const assignmentReason: string | undefined = values.assignmentReason;
    const remarks = (values.remarks ?? '').trim() || undefined;

    const allocationDate = dayjs(values.allocationDate).format('YYYY-MM-DD');
    const expectedReturnDate = values.expectedReturnDate
      ? dayjs(values.expectedReturnDate).format('YYYY-MM-DD')
      : undefined;

    const targetAssetIds = isBulk
      ? bulkAssetIds
      : [assetLocked ? lockedAssetId! : values.assetId];

    let denied = false;

    const assignOne = async (assetId: string): Promise<AssignAttempt> => {
      const assetName = isBulk
        ? bulkRows.find((r) => r.assetId === assetId)?.row?.assetName
        : liveAsset?.assetName;
      try {
        const updated = await HrmAssetService.assignAsset(
          {
            organizationId,
            assetId,
            employeeId,
            employeeName,
            // No allocationRequestId — this is the no-approval direct hand-out.
            allocationDate,
            expectedReturnDate,
            assignmentReason,
            remarks,
            // The RBAC user id — the service authorises on this value.
            assignedBy: actorId,
          },
          // Per-asset so a bulk retry replays each item independently.
          `${idempotencyKey}:${assetId}`,
        );

        // Take the new state from the response rather than assuming it.
        updateAssetInList(assetId, {
          status: updated?.status ?? 'WORKING',
          currentHolderEmployeeId: updated?.currentHolderEmployeeId ?? employeeId,
          currentHolderName: updated?.currentHolderName ?? employeeName,
        } as any);
        await uploadAttachments(assetId);
        onAssigned?.(assetId, employeeId);
        return { assetId, assetName, ok: true, message: 'Assigned' };
      } catch (err: any) {
        const info = mapAssignError(err, { assetId, employeeId });
        if (info.denied) denied = true;
        return {
          assetId,
          assetName,
          ok: false,
          message: info.message,
          field: info.field,
          refreshAsset: info.refreshAsset,
        };
      }
    };

    const results = isBulk
      ? await runWithConcurrency(targetAssetIds, (assetId) => assignOne(assetId))
      : [await assignOne(targetAssetIds[0])];

    // A 403 means the UI and the service disagreed about what this user may
    // do — the control should never have been rendered. Drop the cached
    // permissions so the next read is authoritative, and get out of the way.
    if (denied) {
      console.error('[asset-direct-assign] PERMISSION_DENIED', { employeeId, targetAssetIds });
      clearSectionCache();
      const info = results.find((r) => !r.ok);
      doClose();
      Modal.error({
        title: 'Permission denied',
        content: info?.message
          ?? 'You do not have permission to assign assets directly. Contact your HRM administrator.',
      });
      return;
    }

    const succeeded = results.filter((r) => r.ok);

    // The assets just moved IN_STORE → WORKING, so refresh the dashboard
    // tiles. In asset mode also re-read the asset itself, which repopulates
    // Custody History so the new row appears without a tab switch. In
    // employee/bulk mode the asset detail panel isn't necessarily on screen and
    // reloading it would clobber the custody history of whatever is selected.
    if (succeeded.length > 0) {
      data.loadDashboard();
      if (assetLocked) data.loadAssetDetail(lockedAssetId!);
      if (isBulk) data.loadAssets();
      // Keep the employee-mode picker honest: what just went out is no longer
      // in store.
      setInStoreAssets((prev) => prev.filter((a) => !succeeded.some((s) => s.assetId === a.assetId)));
    }

    // Single-asset failure keeps the form open so the user can fix it in place;
    // bulk always shows the summary, because partial success is the norm.
    if (!isBulk && succeeded.length === 0) {
      const failure = results[0];
      // Errors the user can fix on a control belong on that control; the rest
      // go to the summary banner. Either way the filled form is left intact.
      if (failure.field) {
        form.setFields([{ name: failure.field, errors: [failure.message] }]);
      } else {
        setSubmitError(failure.message);
      }
      if (failure.refreshAsset) {
        await verifyAsset(targetAssetIds[0]);
        data.loadAssets();
      }
      return;
    }

    if (isBulk) {
      const failed = results.filter((r) => !r.ok).map((r) => r.assetId);
      setBulkAssetIds(failed);
    }
    setOutcome({ results, employeeId, employeeName, assignmentDate: allocationDate });
    if (succeeded.length > 0 && !isBulk) {
      message.success(`Asset ${succeeded[0].assetId} assigned to ${employeeName || employeeId} (${employeeId}).`);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return; // guards the double-click; real idempotency needs BE-8
    // Only a missing actor blocks. Deliberately NOT gated on
    // `identity.isReady`: that waits for an employee RECORD, and an admin login
    // like `rits_hrm_admin` may not have one at all — the old guard made the
    // form permanently unusable for exactly the accounts meant to use it, while
    // claiming the profile was "still loading".
    if (!actorId) {
      message.error('Could not identify your account — sign out and back in, then try again.');
      return;
    }
    if (isBulk && bulkAssetIds.length === 0) {
      setSubmitError('Add at least one asset to assign.');
      return;
    }

    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // field errors already rendered
    }

    const run = async () => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await performSubmit(values);
      } finally {
        setSubmitting(false);
      }
    };

    const warnings = collectWarnings();
    if (warnings.length === 0) { await run(); return; }

    Modal.confirm({
      title: 'Confirm before assigning',
      content: (
        <ul style={{ paddingLeft: 18, margin: 0 }} role="note">
          {warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      ),
      okText: 'Assign anyway',
      cancelText: 'Review',
      onOk: run,
    });
  };

  /** Reopen the form for whatever is left, keeping employee/date/reason. */
  const assignAnother = () => {
    setOutcome(null);
    setSubmitError(null);
    setHandoverConfirmed(false);
    if (!isBulk) {
      form.setFieldValue('assetId', undefined);
      setLiveAsset(null);
    }
    if (selectedEmployeeId) loadHoldings(selectedEmployeeId);
  };

  const viewCustody = () => {
    if (liveAsset) setSelectedAsset(liveAsset as any);
    setActiveDetailTab('custody');
    doClose();
  };

  const printSlip = () => {
    const asset = liveAsset;
    if (!asset || !outcome) return;
    const values = form.getFieldsValue();
    const ok = printHandoverSlip({
      asset,
      employeeId: outcome.employeeId,
      employeeName: outcome.employeeName,
      fromDate: outcome.assignmentDate,
      expectedReturnDate: values.expectedReturnDate
        ? dayjs(values.expectedReturnDate).format('YYYY-MM-DD')
        : undefined,
      assignmentReason: values.assignmentReason,
      remarks: values.remarks,
      assignedBy: identity.fullName || actorId,
    });
    if (!ok) message.error('Allow pop-ups for this site to print the handover slip.');
  };

  // Rendered only from gated entry points, but re-checked here so a stale
  // context can never leave the form reachable.
  if (!open || !canDirectAssign) return null;

  const employeeLocked = !!lockedEmployeeId;
  const submitDisabled =
    !handoverConfirmed ||
    checkingAsset ||
    (!isBulk && !!blockReason) ||
    (isBulk && bulkAssetIds.length === 0);

  const succeededCount = outcome?.results.filter((r) => r.ok).length ?? 0;
  const failedCount = (outcome?.results.length ?? 0) - succeededCount;

  // ── Success / summary state ──────────────────────────────────────────────

  if (outcome) {
    return (
      <Modal
        open
        title={isBulk ? 'Bulk assignment complete' : 'Asset assigned'}
        onCancel={doClose}
        width={560}
        footer={[
          <Space key="result-footer">
            {isBulk && (
              <Button
                onClick={() => downloadBulkAssignReport(outcome.results, outcome)}
              >
                Download report
              </Button>
            )}
            {isBulk && failedCount > 0 && (
              <Button onClick={assignAnother}>Retry failed</Button>
            )}
            {!isBulk && (
              <Button icon={<PrinterOutlined />} onClick={printSlip} disabled={!liveAsset}>
                Print handover slip
              </Button>
            )}
            {!isBulk && assetLocked && <Button onClick={viewCustody}>View custody</Button>}
            {!isBulk && !assetLocked && (
              <Button onClick={assignAnother}>Assign another asset</Button>
            )}
            <Button type="primary" onClick={doClose}>Done</Button>
          </Space>,
        ]}
      >
        <Alert
          type={failedCount === 0 ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
          message={
            isBulk
              ? `${succeededCount} of ${outcome.results.length} succeeded`
              : `Assigned to ${outcome.employeeName || outcome.employeeId} (${outcome.employeeId}).`
          }
          description={
            failedCount > 0
              ? 'The failures below were not assigned. Nothing was rolled back for the ones that succeeded.'
              : undefined
          }
        />
        <List
          size="small"
          dataSource={outcome.results}
          renderItem={(r) => (
            <List.Item>
              <Space align="start">
                <Tag color={r.ok ? 'green' : 'red'} style={{ marginInlineEnd: 0 }}>
                  {r.ok ? 'Assigned' : 'Failed'}
                </Tag>
                <div>
                  <Typography.Text strong style={{ fontSize: 12 }}>{r.assetId}</Typography.Text>
                  {r.assetName && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}> — {r.assetName}</Typography.Text>
                  )}
                  {!r.ok && (
                    <div>
                      <Typography.Text type="danger" style={{ fontSize: 12 }}>{r.message}</Typography.Text>
                    </div>
                  )}
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Modal>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────

  const serialNumber = findSerialNumber(liveAsset?.attributes);

  return (
    <Modal
      open
      title={isBulk ? `Assign ${bulkAssetIds.length} Assets Directly` : 'Assign Asset Directly'}
      onCancel={requestClose}
      maskClosable={!dirty}
      destroyOnHidden
      width={560}
      footer={[
        <Space key="assign-footer">
          <Button onClick={requestClose} disabled={submitting}>Cancel</Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={submitDisabled}
            onClick={handleSubmit}
            title={!handoverConfirmed ? 'Confirm physical handover to continue.' : undefined}
          >
            {submitting ? 'Assigning…' : isBulk ? `Assign ${bulkAssetIds.length} Assets` : 'Assign Asset'}
          </Button>
        </Space>,
      ]}
    >
      <Alert
        type="warning"
        showIcon
        role="note"
        style={{ marginBottom: 16 }}
        message="Direct assignment bypasses the request and approval workflow."
        description="This action takes effect immediately and is recorded against your user ID."
      />

      {blockReason && !isBulk && (
        <Alert
          type="error"
          showIcon
          role="alert"
          style={{ marginBottom: 16 }}
          message="This asset cannot be assigned"
          description={blockReason}
        />
      )}

      {submitError && (
        <Alert
          type="error"
          showIcon
          role="alert"
          closable
          onClose={() => setSubmitError(null)}
          style={{ marginBottom: 16 }}
          message={submitError}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setDirty(true)}
      >
        {/* ── Asset ── */}
        {isBulk ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ASSETS ({bulkAssetIds.length})
            </Typography.Text>
            <List
              size="small"
              bordered
              style={{ marginTop: 4, maxHeight: 180, overflowY: 'auto' }}
              dataSource={bulkRows}
              locale={{ emptyText: 'No assets left — add some from the list.' }}
              renderItem={({ assetId, row }) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label={`Remove ${assetId}`}
                      onClick={() => setBulkAssetIds((prev) => prev.filter((id) => id !== assetId))}
                    />,
                  ]}
                >
                  <Typography.Text style={{ fontSize: 12 }}>
                    <strong>{assetId}</strong>
                    {row?.assetName ? ` — ${row.assetName}` : ''}
                    {row?.categoryName ? ` · ${row.categoryName}` : ''}
                  </Typography.Text>
                </List.Item>
              )}
            />
          </div>
        ) : assetLocked ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>ASSET</Typography.Text>
            <div style={{ fontWeight: 500 }}>
              {checkingAsset ? <Spin size="small" /> : (
                <>
                  {liveAsset?.assetName ?? lockedAssetId}{' '}
                  <Typography.Text type="secondary">({lockedAssetId})</Typography.Text>
                </>
              )}
            </div>
            {liveAsset && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {liveAsset.categoryName} · {liveAsset.status}
                {liveAsset.location ? ` · ${liveAsset.location}` : ''}
                {serialNumber ? ` · Serial: ${serialNumber}` : ''}
                {liveAsset.presentValueINR != null
                  ? ` · Present value: ${formatCurrency(liveAsset.presentValueINR)}`
                  : ''}
              </Typography.Text>
            )}
          </div>
        ) : (
          <Form.Item label="Asset" name="assetId" rules={rules.assetId}>
            <Select
              showSearch
              autoFocus
              loading={loadingAssets}
              placeholder="Search by asset ID or name"
              optionFilterProp="label"
              onChange={(assetId: string) => {
                setSubmitError(null);
                if (assetId) verifyAsset(assetId);
              }}
              options={inStoreAssets.map((a) => ({
                value: a.assetId,
                label: `${a.assetId} — ${a.assetName} · ${a.categoryName}${a.location ? ` · ${a.location}` : ''}`,
              }))}
            />
          </Form.Item>
        )}

        {/* ── Employee ── */}
        {employeeLocked ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>EMPLOYEE</Typography.Text>
            <div style={{ fontWeight: 500 }}>
              {ctx?.kind === 'employee' && (ctx.employeeName || employee?.fullName)
                ? `${ctx.employeeId} — ${ctx.employeeName || employee?.fullName}`
                : lockedEmployeeId}
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {[employee?.department, employee?.location, employee?.designation]
                .filter(Boolean)
                .join(' · ')}
              {holdingsNote ? `${employee ? ' · ' : ''}${holdingsNote}` : ''}
            </Typography.Text>
          </div>
        ) : (
          <Form.Item
            label="Assign To"
            name="employeeId"
            rules={rules.employeeId}
            extra={
              employee ? (
                <>
                  {[employee.department, employee.location, employee.designation]
                    .filter(Boolean)
                    .join(' · ')}
                  {holdingsNote ? ` · ${holdingsNote}` : ''}
                </>
              ) : undefined
            }
          >
            <Select
              showSearch
              // First editable field whenever the employee isn't already fixed.
              autoFocus
              loading={loadingEmployees}
              placeholder="Search employee by code or name"
              options={employees}
              optionFilterProp="label"
              onChange={(employeeId: string) => {
                setSelectedEmployeeId(employeeId);
                // The joining-date rule (R-14) depends on who was picked.
                form.validateFields(['allocationDate']).catch(() => {});
              }}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Assignment Date"
          name="allocationDate"
          initialValue={dayjs()}
          dependencies={['employeeId']}
          rules={rules.allocationDate}
        >
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>

        <Form.Item
          label="Expected Return Date"
          name="expectedReturnDate"
          dependencies={['allocationDate']}
          rules={rules.expectedReturnDate}
        >
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>

        <Form.Item label="Reason" name="assignmentReason" rules={rules.assignmentReason}>
          <Select
            placeholder="Why is this being assigned?"
            options={ASSIGNMENT_REASONS.map((r) => ({ value: r.value, label: r.label }))}
            onChange={() => form.validateFields(['remarks']).catch(() => {})}
          />
        </Form.Item>

        <Form.Item label="Remarks" name="remarks" dependencies={['assignmentReason']} rules={rules.remarks}>
          <Input.TextArea rows={2} placeholder="Assignment remarks" maxLength={500} showCount />
        </Form.Item>
      </Form>

      {/* Handover paperwork, filed against the asset itself. Single-asset only:
          the same signed slip does not belong on 25 different assets. */}
      {!isBulk && (
        <div style={{ marginBottom: 12 }}>
          <Upload
            accept={ASSIGNMENT_ATTACHMENT_ACCEPT}
            multiple
            fileList={attachments.map((f, i) => ({
              uid: `${i}-${f.name}`, name: f.name, status: 'done' as const,
            }))}
            beforeUpload={(file) => {
              const reason = validateAssignmentAttachment(file, attachments.length);
              if (reason) message.error(reason);
              else {
                setAttachments((prev) => [...prev, file as unknown as File]);
                setDirty(true);
              }
              // We upload after the assignment lands, not now.
              return false;
            }}
            onRemove={(file) => {
              setAttachments((prev) => prev.filter((_, i) => `${i}-${prev[i].name}` !== file.uid));
              return true;
            }}
          >
            <Button size="small" icon={<PaperClipOutlined />} disabled={attachments.length >= ASSIGNMENT_ATTACHMENT_MAX_FILES}>
              Attach handover slip
            </Button>
          </Upload>
        </div>
      )}

      <Checkbox
        checked={handoverConfirmed}
        onChange={(e) => setHandoverConfirmed(e.target.checked)}
        style={{ marginTop: 4 }}
      >
        {isBulk
          ? 'I confirm these assets have been physically handed over to the employee.'
          : 'I confirm this asset has been physically handed over to the employee.'}
      </Checkbox>
      {/* Deliberate speed bump on an approval-free action. It is a client-side
          gate only — the backend has no handoverConfirmed field to record
          (ticket BE-2), so it is not part of the audit trail yet. */}
    </Modal>
  );
}
