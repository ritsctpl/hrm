'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  InputNumber,
  Select,
  DatePicker,
  Input,
  Button,
  Card,
  Descriptions,
  Spin,
  Tag,
  Typography,
  Divider,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { HrmCompensationService } from '../../services/compensationService';
import { HrmEmployeeService } from '../../../hrmEmployee/services/hrmEmployeeService';
import { useGradeOptions } from '../../hooks/useGradeOptions';
import type { CompensationComponent, CtcReconciliation, EmployeeCompensationResponse } from '../../types/domain.types';
import type {
  CompensationComponentRequest,
  EmployeeCompensationRequest,
  UpdateEmployeeCompensationRequest,
} from '../../types/api.types';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import EarningsGrid from './EarningsGrid';
import DeductionsGrid from './DeductionsGrid';
import CompensationSummaryBar from '../molecules/CompensationSummaryBar';
import RevisionHistoryTimeline from '../molecules/RevisionHistoryTimeline';
import CompensationStatusTag from '../atoms/CompensationStatusTag';
import EmployeeLookupSelect, { type EmployeeOption } from '../molecules/EmployeeLookupSelect';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 'var(--hrm-font-size-xs)',
  color: 'var(--hrm-text-secondary)',
  marginBottom: 4,
};
const REQ_MARK = <span style={{ color: 'var(--hrm-warning)' }}>*</span>;

const EmployeeCompensationForm: React.FC = () => {
  const {
    selectedEmployeeId,
    setSelectedEmployeeId,
    currentCompensation,
    compensationHistory,
    previewCompensation,
    assignmentLoading,
    salaryStructures,
    fetchSalaryStructures,
    loadEmployeeCompensation,
    fetchCompensationHistory,
    runPreview,
    saveCompensationDraft,
    updateEmployeeCompensation,
    submitCompensationForApproval,
  } = useHrmCompensationStore();

  const { gradeOptions, gradeOptionsLoading } = useGradeOptions();

  // ── Employee search state ──────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<EmployeeOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * The grade structure's component DEFINITIONS (code + method + percentage/amount). Stable across
   * CTC changes — the backend re-derives each amount from the CTC. Kept in a ref (not state) so an
   * applied recompute can't feed the next recompute and loop. The backend rejects an empty component
   * list ("At least one component is required"), so every compute/save sends this set.
   */
  const baseComponentsRef = useRef<CompensationComponentRequest[]>([]);
  const toRequest = (c: CompensationComponent): CompensationComponentRequest => ({
    componentCode: c.componentCode,
    calculationMethod: c.calculationMethod,
    amount: c.amount,
    percentage: c.percentage,
    formula: c.formula,
  });

  // ── Assignment state ───────────────────────────────────────────────────────
  const [structureCode, setStructureCode] = useState<string>('');
  const [annualCTC, setAnnualCTC] = useState<number | null>(null);
  const [roundingAdjustment] = useState<number>(0);
  const [reconciliation, setReconciliation] = useState<CtcReconciliation | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [earningComponents, setEarningComponents] = useState<CompensationComponent[]>([]);
  const [deductionComponents, setDeductionComponents] = useState<CompensationComponent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  // Structures back the grade→structure resolution for a brand-new assignment.
  useEffect(() => {
    if (salaryStructures.length === 0) fetchSalaryStructures();
  }, [salaryStructures.length, fetchSalaryStructures]);

  // ── Employee search (server-driven over id / name / email) ──────────────────
  const runSearch = useCallback(async (keyword: string) => {
    const kw = keyword.trim();
    if (!kw) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Directory keyword matches id / name / email server-side. Grade is NOT a
      // directory param, so we fetch a generous page (dev set ≈ 92 employees) and
      // filter by grade CLIENT-SIDE below. be: EmployeeSearchRequest has no grade field.
      const res = await HrmEmployeeService.fetchDirectory({
        organizationId: getOrganizationId(),
        keyword: kw,
        page: 0,
        size: 100,
      });
      const rows = Array.isArray(res?.employees) ? res.employees : [];
      setSearchResults(
        rows.map((r) => ({
          employeeId: r.employeeCode || r.handle,
          employeeName: r.fullName,
          email: r.workEmail,
          grade: r.grade,
          department: r.department,
          designation: r.designation,
        })),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = useCallback(
    (keyword: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => runSearch(keyword), 350);
    },
    [runSearch],
  );

  // Grade filter is applied client-side over the fetched result set (see runSearch).
  const filteredOptions = gradeFilter
    ? searchResults.filter((o) => o.grade === gradeFilter)
    : searchResults;

  const applyBreakdown = useCallback((components: CompensationComponent[]) => {
    setEarningComponents(components.filter((c) => c.componentType === 'EARNING'));
    setDeductionComponents(components.filter((c) => c.componentType === 'DEDUCTION'));
  }, []);

  // Read-only breakdown for an employee who already has an active compensation.
  const loadSalaryBreakdown = useCallback(
    async (empId: string) => {
      try {
        const bd = await HrmCompensationService.getSalaryBreakdown(getOrganizationId(), empId);
        if (bd?.components?.length) {
          applyBreakdown(bd.components);
          if (bd.annualCTC) setAnnualCTC(bd.annualCTC);
        }
      } catch {
        // No breakdown available yet — fall back to whatever the active comp carried.
      }
    },
    [applyBreakdown],
  );

  // Build read-only component rows from a grade's structure defaults (brand-new assignment).
  const loadStructureComponents = useCallback(async (code: string) => {
    try {
      const structure = await HrmCompensationService.getSalaryStructure(getOrganizationId(), code);
      const earnings: CompensationComponent[] = structure.components.map((sc, idx) => ({
        componentCode: sc.componentCode,
        componentName: sc.componentCode,
        componentType: 'EARNING' as const,
        calculationMethod: sc.calculationMethod,
        amount: sc.defaultAmount,
        percentage: sc.defaultPercentage,
        formula: sc.formula,
        derivedAmount: sc.defaultAmount ?? 0,
        taxable: true,
        displayOrder: sc.displayOrder ?? idx + 1,
      }));
      setEarningComponents(earnings);
      setDeductionComponents([]);
      baseComponentsRef.current = earnings.map(toRequest);
    } catch {
      setEarningComponents([]);
      setDeductionComponents([]);
      baseComponentsRef.current = [];
    }
  }, []);

  const handleEmployeeSelect = useCallback(
    (employeeId: string, option: EmployeeOption) => {
      setSelectedEmployee(option);
      setSelectedEmployeeId(employeeId);
      setAnnualCTC(null);
      setReconciliation(null);
      loadEmployeeCompensation(employeeId);
      fetchCompensationHistory(employeeId);
    },
    [setSelectedEmployeeId, loadEmployeeCompensation, fetchCompensationHistory],
  );

  // Sync assignment fields once the active compensation (or its absence) is known.
  useEffect(() => {
    if (!selectedEmployeeId) {
      setStructureCode('');
      setEffectiveFrom('');
      setRemarks('');
      setEarningComponents([]);
      setDeductionComponents([]);
      setAnnualCTC(null);
      return;
    }
    if (currentCompensation) {
      // Existing employee: grade's structure is already applied — show it read-only.
      setStructureCode(currentCompensation.structureCode);
      setEffectiveFrom(currentCompensation.effectiveFrom);
      setRemarks(currentCompensation.remarks ?? '');
      if (currentCompensation.annualCTC) setAnnualCTC(currentCompensation.annualCTC);
      applyBreakdown(currentCompensation.components ?? []);
      baseComponentsRef.current = (currentCompensation.components ?? [])
        .filter((c) => c.componentType === 'EARNING')
        .map(toRequest);
      loadSalaryBreakdown(currentCompensation.employeeId);
    } else {
      // Brand-new assignment: resolve the structure from the employee's grade.
      const grade = selectedEmployee?.grade;
      const structure = salaryStructures.find((s) => s.applicableGrade === grade);
      if (structure) {
        setStructureCode(structure.structureCode);
        loadStructureComponents(structure.structureCode);
      } else {
        setStructureCode('');
        setEarningComponents([]);
        setDeductionComponents([]);
      }
      setEffectiveFrom('');
      setRemarks('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompensation, selectedEmployeeId, selectedEmployee, salaryStructures]);

  // A CTC-driven recompute returns the full derived split — render it read-only.
  useEffect(() => {
    if (previewCompensation?.components?.length) {
      applyBreakdown(previewCompensation.components);
    }
  }, [previewCompensation, applyBreakdown]);

  /**
   * The compute request is CTC-driven: components are derived server-side from the CTC +
   * the grade's structure, so we send an empty component list. Kept free of earningComponents
   * so an applied recompute can't feed back into the next recompute. be-spec §4.2.
   */
  const buildComputeRequest = useCallback((): EmployeeCompensationRequest => {
    const cookies = parseCookies();
    return {
      organizationId: getOrganizationId(),
      employeeId: selectedEmployeeId ?? '',
      effectiveFrom: effectiveFrom || dayjs().format('YYYY-MM-DD'),
      structureCode,
      annualCTC,
      roundingAdjustment,
      // Structure's stable component set — the backend re-derives each amount from the CTC.
      components: baseComponentsRef.current,
      remarks,
      createdBy: cookies.rl_user_id ?? '',
    };
  }, [selectedEmployeeId, effectiveFrom, structureCode, annualCTC, roundingAdjustment, remarks]);

  /**
   * The screen's centrepiece: does the split add back to the CTC? Debounced because it fires on
   * every keystroke in the CTC field. Runs on ANNUAL values server-side — never monthly x 12.
   */
  useEffect(() => {
    if (!annualCTC || !structureCode || baseComponentsRef.current.length === 0) {
      setReconciliation(null);
      return;
    }
    const timer = setTimeout(() => {
      HrmCompensationService.validateCtcReconciliation(buildComputeRequest())
        .then(setReconciliation)
        .catch(() => setReconciliation(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [annualCTC, structureCode, roundingAdjustment, buildComputeRequest]);

  // Debounced read-only breakdown recompute whenever the CTC changes.
  useEffect(() => {
    if (!annualCTC || !structureCode || baseComponentsRef.current.length === 0) return;
    const timer = setTimeout(() => {
      runPreview(buildComputeRequest());
    }, 450);
    return () => clearTimeout(timer);
  }, [annualCTC, structureCode, roundingAdjustment, runPreview, buildComputeRequest]);

  const handleRecalculate = useCallback(async () => {
    if (!annualCTC || !structureCode) return;
    setRecomputing(true);
    try {
      await runPreview(buildComputeRequest());
    } finally {
      setRecomputing(false);
    }
  }, [annualCTC, structureCode, runPreview, buildComputeRequest]);

  const handleSave = useCallback(async () => {
    if (!selectedEmployeeId) return;
    const cookies = parseCookies();
    const createdBy = cookies.rl_user_id ?? '';
    setSaving(true);
    try {
      if (currentCompensation?.handle) {
        // Employee already has an active comp → override at the employee level as a new revision.
        const payload: UpdateEmployeeCompensationRequest = {
          organizationId: getOrganizationId(),
          handle: currentCompensation.handle,
          employeeId: selectedEmployeeId,
          effectiveFrom: effectiveFrom || undefined,
          // The update endpoint carries no CTC field, so the override is expressed as the
          // CTC-derived amounts already shown read-only in the breakdown.
          components: earningComponents.map((c) => ({
            componentCode: c.componentCode,
            calculationMethod: c.calculationMethod,
            amount: c.derivedAmount ?? c.amount,
            percentage: c.percentage,
            formula: c.formula,
          })),
          remarks,
          createdBy,
        };
        await updateEmployeeCompensation(payload);
      } else {
        // Brand-new assignment → create.
        const payload: EmployeeCompensationRequest = {
          ...buildComputeRequest(),
          components: earningComponents.map((c) => ({
            componentCode: c.componentCode,
            calculationMethod: c.calculationMethod,
            amount: c.amount,
            percentage: c.percentage,
            formula: c.formula,
          })),
        };
        await saveCompensationDraft(payload);
      }
      await loadEmployeeCompensation(selectedEmployeeId);
      await fetchCompensationHistory(selectedEmployeeId);
    } finally {
      setSaving(false);
    }
  }, [
    selectedEmployeeId, currentCompensation, effectiveFrom, earningComponents, remarks,
    buildComputeRequest, updateEmployeeCompensation, saveCompensationDraft,
    loadEmployeeCompensation, fetchCompensationHistory,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!currentCompensation?.handle) return;
    setSubmitting(true);
    try {
      await submitCompensationForApproval(currentCompensation.handle);
    } finally {
      setSubmitting(false);
    }
  }, [currentCompensation, submitCompensationForApproval]);

  const resolvedStructure = salaryStructures.find((s) => s.structureCode === structureCode);
  const activeSummary: EmployeeCompensationResponse | undefined =
    previewCompensation ?? currentCompensation ?? undefined;

  // ── Search bar (always visible) ──────────────────────────────────────────────
  const searchBar = (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 2, minWidth: 280 }}>
          <div style={LABEL_STYLE}>Employee</div>
          <EmployeeLookupSelect
            value={selectedEmployeeId ?? undefined}
            options={filteredOptions}
            loading={searching}
            onSearch={handleSearch}
            onChange={handleEmployeeSelect}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={LABEL_STYLE}>Filter by grade</div>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Any grade"
            value={gradeFilter}
            loading={gradeOptionsLoading}
            options={gradeOptions}
            onChange={(v) => setGradeFilter(v)}
            style={{ width: '100%' }}
          />
        </div>
        {selectedEmployee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {currentCompensation && <CompensationStatusTag status={currentCompensation.status} />}
            {currentCompensation && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Rev #{currentCompensation.revisionNumber}
              </Typography.Text>
            )}
            {!currentCompensation && selectedEmployeeId && !assignmentLoading && (
              <Tag color="blue">New assignment</Tag>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className={styles.fullPanel}>
      {searchBar}

      {!selectedEmployeeId ? (
        <div className={styles.emptyContainer}>
          <Typography.Text type="secondary">
            Search for an employee by ID, name or email to view or assign compensation.
          </Typography.Text>
        </div>
      ) : assignmentLoading ? (
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      ) : (
        <>
          {/* Employee header */}
          {selectedEmployee && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions size="small" column={3}>
                <Descriptions.Item label="Employee">
                  {selectedEmployee.employeeName} ({selectedEmployee.employeeId})
                </Descriptions.Item>
                <Descriptions.Item label="Email">{selectedEmployee.email ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Grade">{selectedEmployee.grade ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Department">
                  {currentCompensation?.department ?? selectedEmployee.department ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Designation">
                  {currentCompensation?.designation ?? selectedEmployee.designation ?? '—'}
                </Descriptions.Item>
                {currentCompensation && (
                  <Descriptions.Item label="Effective From">
                    {currentCompensation.effectiveFrom}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {/* Structure (read-only, applied from grade) + CTC (the sole input) + Effective date */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 280 }}>
                <div style={LABEL_STYLE}>Salary Structure (from grade)</div>
                <div
                  style={{
                    padding: '6px 11px',
                    border: '1px solid var(--hrm-border)',
                    borderRadius: 'var(--hrm-radius-sm)',
                    background: 'var(--hrm-bg-secondary)',
                    color: 'var(--hrm-text-primary)',
                    minHeight: 32,
                  }}
                >
                  {resolvedStructure
                    ? `${resolvedStructure.structureCode} — ${resolvedStructure.structureName}`
                    : structureCode || 'No structure resolved for this grade'}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={LABEL_STYLE}>Annual CTC {REQ_MARK}</div>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    value={annualCTC ?? undefined}
                    onChange={(v) => setAnnualCTC(typeof v === 'number' ? v : null)}
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="3100000"
                    formatter={(v) => (v ? Number(v).toLocaleString('en-IN') : '')}
                    parser={(v) => Number((v ?? '').replace(/,/g, ''))}
                  />
                  <Button onClick={handleRecalculate} loading={recomputing} disabled={!annualCTC || !structureCode}>
                    Recalculate
                  </Button>
                </Space.Compact>
                <div style={{ fontSize: 11, color: 'var(--hrm-text-tertiary)', marginTop: 2 }}>
                  The only editable value — the breakdown below is derived from it.
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={LABEL_STYLE}>Effective From {REQ_MARK}</div>
                <DatePicker
                  value={effectiveFrom ? dayjs(effectiveFrom) : null}
                  onChange={(d) => setEffectiveFrom(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: '100%' }}
                  format="DD-MMM-YYYY"
                />
              </div>
            </div>
          </Card>

          {/* Reconciliation — the question this screen exists to answer. be-spec §7.1. */}
          {annualCTC ? (
            reconciliation ? (
              <Alert
                type={reconciliation.balanced ? 'success' : 'error'}
                showIcon
                style={{ marginBottom: 16 }}
                message={
                  reconciliation.balanced
                    ? `Components total ₹${Number(reconciliation.componentTotal ?? 0).toLocaleString('en-IN')}`
                      + ` = CTC ₹${Number(reconciliation.annualCTC ?? 0).toLocaleString('en-IN')}`
                      + (roundingAdjustment ? ` + adjustment ₹${roundingAdjustment}` : '')
                    : `Components total ₹${Number(reconciliation.componentTotal ?? 0).toLocaleString('en-IN')},`
                      + ` which is ₹${Math.abs(Number(reconciliation.difference ?? 0)).toLocaleString('en-IN')}`
                      + ` ${Number(reconciliation.difference ?? 0) < 0 ? 'short of' : 'over'}`
                      + ` CTC ₹${Number(reconciliation.annualCTC ?? 0).toLocaleString('en-IN')}.`
                      + ' Add a Balance component to the structure, or correct the percentages.'
                }
              />
            ) : null
          ) : (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Enter the annual CTC to see the split."
            />
          )}

          {/* Earnings — read-only, derived from the CTC */}
          {earningComponents.length > 0 && (
            <Card
              size="small"
              title={<span style={{ color: 'var(--hrm-success)' }}>Earnings (derived — read-only)</span>}
              style={{ marginBottom: 12 }}
            >
              <EarningsGrid components={earningComponents} onChange={setEarningComponents} disabled />
            </Card>
          )}

          {/* Deductions */}
          {deductionComponents.length > 0 && (
            <Card
              size="small"
              title={<span style={{ color: 'var(--hrm-warning)' }}>Deductions (Statutory — read-only)</span>}
              style={{ marginBottom: 12 }}
            >
              <DeductionsGrid components={deductionComponents} />
            </Card>
          )}

          {/* Summary */}
          {activeSummary && (
            <Card size="small" title="Summary" style={{ marginBottom: 12 }}>
              <CompensationSummaryBar data={activeSummary} />
            </Card>
          )}

          {/* Remarks */}
          <div style={{ marginBottom: 16 }}>
            <div style={LABEL_STYLE}>Remarks</div>
            <Input.TextArea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Annual increment effective April 2025"
            />
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <Space>
              <Button onClick={handleRecalculate} loading={recomputing} disabled={!annualCTC || !structureCode}>
                Preview
              </Button>
              <Can I={currentCompensation ? 'edit' : 'add'}>
                <Button
                  type="primary"
                  loading={saving}
                  onClick={handleSave}
                  disabled={!structureCode || !annualCTC}
                >
                  {currentCompensation ? 'Save Override' : 'Assign Compensation'}
                </Button>
              </Can>
              <Can I="edit">
                <Button
                  loading={submitting}
                  onClick={handleSubmit}
                  disabled={!currentCompensation?.handle || currentCompensation.status !== 'DRAFT'}
                >
                  Submit for Approval
                </Button>
              </Can>
            </Space>
          </div>

          {/* Revision History */}
          {compensationHistory.length > 0 && (
            <>
              <Divider style={{ margin: '20px 0 12px' }} />
              <div className={styles.sectionDivider}>Revision History</div>
              <RevisionHistoryTimeline history={compensationHistory} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeCompensationForm;
