'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Select,
  DatePicker,
  Input,
  Button,
  Card,
  Descriptions,
  Spin,
  Typography,
  Divider,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { HrmCompensationService } from '../../services/compensationService';
import type { CompensationComponent, EmployeeCompensationResponse } from '../../types/domain.types';
import type { EmployeeCompensationRequest } from '../../types/api.types';
import { parseCookies } from 'nookies';
import EarningsGrid from './EarningsGrid';
import DeductionsGrid from './DeductionsGrid';
import CompensationSummaryBar from '../molecules/CompensationSummaryBar';
import RevisionHistoryTimeline from '../molecules/RevisionHistoryTimeline';
import CompensationStatusTag from '../atoms/CompensationStatusTag';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';

const EmployeeCompensationForm: React.FC = () => {
  const {
    selectedEmployeeId,
    setSelectedEmployeeId,
    currentCompensation,
    compensationHistory,
    previewCompensation,
    assignmentLoading,
    salaryStructures,
    loadEmployeeCompensation,
    fetchCompensationHistory,
    runPreview,
    saveCompensationDraft,
    submitCompensationForApproval,
  } = useHrmCompensationStore();

  const [structureCode, setStructureCode] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [earningComponents, setEarningComponents] = useState<CompensationComponent[]>([]);
  const [deductionComponents, setDeductionComponents] = useState<CompensationComponent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Sync from current compensation when employee selected
  useEffect(() => {
    if (currentCompensation) {
      setStructureCode(currentCompensation.structureCode);
      setEffectiveFrom(currentCompensation.effectiveFrom);
      setRemarks(currentCompensation.remarks ?? '');
      setEarningComponents(
        (currentCompensation.components ?? []).filter((c) => c.componentType === 'EARNING'),
      );
      setDeductionComponents(
        (currentCompensation.components ?? []).filter((c) => c.componentType === 'DEDUCTION'),
      );
    } else if (!selectedEmployeeId) {
      setStructureCode('');
      setEffectiveFrom('');
      setRemarks('');
      setEarningComponents([]);
      setDeductionComponents([]);
    }
  }, [currentCompensation, selectedEmployeeId]);

  const handleStructureChange = useCallback(
    async (code: string) => {
      setStructureCode(code);
      // Load structure and build component rows from defaults
      try {
        const cookies = parseCookies();
        const site = cookies.site ?? '';
        const structure = await HrmCompensationService.getSalaryStructure(site, code);
        // We only have SalaryStructureComponents — build CompensationComponent stubs for the grid
        const earnings: CompensationComponent[] = structure.components
          .map((sc, idx) => ({
            componentCode: sc.componentCode,
            componentName: sc.componentCode, // name not in structure; will be resolved server-side
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
      } catch {
        // structure load failed — keep existing components
      }
    },
    [],
  );

  const buildRequest = useCallback((): EmployeeCompensationRequest => {
    const cookies = parseCookies();
    return {
      site: cookies.site ?? '',
      employeeId: selectedEmployeeId ?? '',
      effectiveFrom,
      structureCode,
      components: earningComponents.map((c) => ({
        componentCode: c.componentCode,
        calculationMethod: c.calculationMethod,
        amount: c.amount,
        percentage: c.percentage,
        formula: c.formula,
      })),
      remarks,
      createdBy: cookies.rl_user_id ?? '',
    };
  }, [selectedEmployeeId, effectiveFrom, structureCode, earningComponents, remarks]);

  const handlePreview = useCallback(async () => {
    await runPreview(buildRequest());
  }, [buildRequest, runPreview]);

  const handleSaveDraft = useCallback(async () => {
    setSavingDraft(true);
    try {
      await saveCompensationDraft(buildRequest());
      if (selectedEmployeeId) {
        await loadEmployeeCompensation(selectedEmployeeId);
      }
    } finally {
      setSavingDraft(false);
    }
  }, [buildRequest, saveCompensationDraft, loadEmployeeCompensation, selectedEmployeeId]);

  const handleSubmit = useCallback(async () => {
    if (!currentCompensation?.handle) return;
    setSubmitting(true);
    try {
      await submitCompensationForApproval(currentCompensation.handle);
    } finally {
      setSubmitting(false);
    }
  }, [currentCompensation, submitCompensationForApproval]);

  const structureOptions = salaryStructures.map((s) => ({
    value: s.structureCode,
    label: `${s.structureCode} — ${s.structureName}`,
  }));

  const activeSummary: EmployeeCompensationResponse | undefined =
    previewCompensation ?? currentCompensation ?? undefined;

  if (!selectedEmployeeId) {
    return (
      <div className={styles.fullPanel}>
        <div className={styles.emptyContainer}>
          <Typography.Text type="secondary">
            Search for an employee to view or assign compensation.
          </Typography.Text>
        </div>
      </div>
    );
  }

  if (assignmentLoading) {
    return (
      <div className={styles.fullPanel}>
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fullPanel}>
      {/* Employee header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Select
              showSearch
              placeholder="Search employee by ID or Name"
              value={selectedEmployeeId}
              onChange={(v) => {
                setSelectedEmployeeId(v);
                loadEmployeeCompensation(v);
                fetchCompensationHistory(v);
              }}
              style={{ width: '100%' }}
              optionFilterProp="label"
            />
          </div>
          {currentCompensation && (
            <>
              <CompensationStatusTag status={currentCompensation.status} />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Rev #{currentCompensation.revisionNumber}
              </Typography.Text>
            </>
          )}
        </div>
        {currentCompensation && (
          <Descriptions size="small" style={{ marginTop: 10 }} column={3}>
            <Descriptions.Item label="Department">
              {currentCompensation.department}
            </Descriptions.Item>
            <Descriptions.Item label="Designation">
              {currentCompensation.designation}
            </Descriptions.Item>
            <Descriptions.Item label="Effective From">
              {currentCompensation.effectiveFrom}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      {/* Structure + Effective Date */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 280 }}>
            <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>
              Salary Structure <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Select
              options={structureOptions}
              value={structureCode || undefined}
              onChange={handleStructureChange}
              placeholder="Select salary structure"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>
              Effective From <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <DatePicker
              value={effectiveFrom ? dayjs(effectiveFrom) : null}
              onChange={(d) => setEffectiveFrom(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: '100%' }}
              format="DD-MMM-YYYY"
            />
          </div>
        </div>
      </Card>

      {/* Earnings */}
      {earningComponents.length > 0 && (
        <Card
          size="small"
          title={<span style={{ color: '#389e0d' }}>Earnings</span>}
          style={{ marginBottom: 12 }}
        >
          <EarningsGrid
            components={earningComponents}
            onChange={setEarningComponents}
          />
        </Card>
      )}

      {/* Deductions */}
      {deductionComponents.length > 0 && (
        <Card
          size="small"
          title={<span style={{ color: '#cf1322' }}>Deductions (Statutory — read-only)</span>}
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
        <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>Remarks</div>
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
          <Button onClick={handlePreview} disabled={!structureCode}>
            Preview
          </Button>
          <Can I={currentCompensation ? 'edit' : 'add'}>
            <Button loading={savingDraft} onClick={handleSaveDraft} disabled={!structureCode}>
              Save as Draft
            </Button>
          </Can>
          <Can I="edit">
            <Button
              type="primary"
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
    </div>
  );
};

export default EmployeeCompensationForm;
