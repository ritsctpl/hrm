'use client';

import React, { useState, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  DatePicker,
  Input,
  Segmented,
  Upload,
  Spin,
  Space,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import dayjs from 'dayjs';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { SalaryRevisionRow } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CompensationPreview from './CompensationPreview';
import styles from '../../styles/SalaryRevision.module.css';
import compensationStyles from '../../styles/Compensation.module.css';

const SalaryRevisionTable: React.FC = () => {
  const {
    revisionMode,
    revisionRows,
    revisionLoading,
    selectedRevisionIds,
    setRevisionMode,
    setRevisionRows,
    setSelectedRevisionIds,
    submitBulkRevision,
    previewCompensation,
    runPreview,
    selectedEmployeeId,
    setSelectedEmployeeId,
    loadEmployeeCompensation,
    currentCompensation,
    submitCompensationForApproval,
  } = useHrmCompensationStore();

  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState<string>('');
  const [indivIncrementPct, setIndivIncrementPct] = useState<number>(0);
  const [indivEffectiveFrom, setIndivEffectiveFrom] = useState<string>('');
  const [indivRemarks, setIndivRemarks] = useState<string>('');
  const [submittingIndiv, setSubmittingIndiv] = useState(false);

  const handleIncrementChange = useCallback(
    (employeeId: string, newPct: number) => {
      const updated = revisionRows.map((r) => {
        if (r.employeeId !== employeeId) return r;
        const newBasic = Math.round(r.currentBasic * (1 + newPct / 100));
        const ratio = r.currentGross > 0 ? r.currentGross / r.currentBasic : 1;
        const newGross = Math.round(newBasic * ratio);
        return { ...r, incrementPercent: newPct, newBasic, newGross };
      });
      setRevisionRows(updated);
    },
    [revisionRows, setRevisionRows],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedRevisionIds(revisionRows.map((r) => r.employeeId));
  }, [revisionRows, setSelectedRevisionIds]);

  const handleSubmitIndiv = useCallback(async () => {
    if (!currentCompensation?.handle) return;
    setSubmittingIndiv(true);
    try {
      await submitCompensationForApproval(currentCompensation.handle);
    } finally {
      setSubmittingIndiv(false);
    }
  }, [currentCompensation, submitCompensationForApproval]);

  const bulkColumns: ColumnsType<SalaryRevisionRow> = [
    {
      title: 'Emp ID',
      dataIndex: 'employeeId',
      width: 90,
    },
    {
      title: 'Name',
      dataIndex: 'employeeName',
      ellipsis: true,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      ellipsis: true,
      width: 110,
    },
    {
      title: 'Curr Basic',
      dataIndex: 'currentBasic',
      width: 110,
      align: 'right',
      render: (v: number) => formatINRPlain(v),
    },
    {
      title: 'Incr %',
      dataIndex: 'incrementPercent',
      width: 90,
      render: (val: number, record) => (
        <input
          type="number"
          min={0}
          max={100}
          value={val}
          onChange={(e) => handleIncrementChange(record.employeeId, parseFloat(e.target.value) || 0)}
          style={{ width: 60, padding: '2px 4px', border: '1px solid #d9d9d9', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'New Basic',
      dataIndex: 'newBasic',
      width: 110,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: '#389e0d' }}>{formatINRPlain(v)}</span>
      ),
    },
    {
      title: 'New Gross',
      dataIndex: 'newGross',
      width: 120,
      align: 'right',
      render: (v: number) => formatINRPlain(v),
    },
  ];

  const selectedRows = revisionRows.filter((r) => selectedRevisionIds.includes(r.employeeId));
  const totalNewBasic = selectedRows.reduce((s, r) => s + r.newBasic, 0);
  const totalNewGross = selectedRows.reduce((s, r) => s + r.newGross, 0);

  return (
    <div className={styles.revisionPage}>
      <div className={styles.segmentedControl}>
        <Segmented
          options={[
            { label: 'Individual Revision', value: 'individual' },
            { label: 'Bulk Upload', value: 'bulk' },
          ]}
          value={revisionMode}
          onChange={(v) => setRevisionMode(v as 'individual' | 'bulk')}
        />
      </div>

      {/* Individual Revision */}
      {revisionMode === 'individual' && (
        <Card size="small" className={styles.indivCard}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>Employee</div>
            <input
              type="text"
              placeholder="Enter employee ID"
              value={selectedEmployeeId ?? ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              onBlur={() => {
                if (selectedEmployeeId) {
                  loadEmployeeCompensation(selectedEmployeeId);
                }
              }}
              style={{
                width: '100%',
                padding: '4px 8px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 13,
              }}
            />
          </div>

          {currentCompensation && (
            <div className={styles.currentInfo}>
              <div className={styles.currentInfoRow}>
                <div className={styles.currentInfoItem}>
                  <span className={styles.currentInfoLabel}>Current Basic</span>
                  <span className={styles.currentInfoValue}>
                    {formatINRPlain(
                      (currentCompensation.components ?? []).find((c) => c.componentCode === 'BASIC')
                        ?.derivedAmount ?? 0,
                    )}
                  </span>
                </div>
                <div className={styles.currentInfoItem}>
                  <span className={styles.currentInfoLabel}>Current Gross</span>
                  <span className={styles.currentInfoValue}>
                    {formatINRPlain(currentCompensation.grossEarnings)}
                  </span>
                </div>
                <div className={styles.currentInfoItem}>
                  <span className={styles.currentInfoLabel}>As of</span>
                  <span className={styles.currentInfoValue}>
                    {currentCompensation.effectiveFrom}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>Increment %</div>
              <input
                type="number"
                min={0}
                max={100}
                value={indivIncrementPct}
                onChange={(e) => setIndivIncrementPct(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>Effective From</div>
              <DatePicker
                value={indivEffectiveFrom ? dayjs(indivEffectiveFrom) : null}
                onChange={(d) => setIndivEffectiveFrom(d ? d.format('YYYY-MM-DD') : '')}
                style={{ width: '100%' }}
                format="DD-MMM-YYYY"
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>Remarks</div>
            <Input.TextArea
              rows={2}
              value={indivRemarks}
              onChange={(e) => setIndivRemarks(e.target.value)}
              placeholder="Reason for revision"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Button
              onClick={() => {
                if (!selectedEmployeeId || !currentCompensation) return;
                runPreview({
                  site: '',
                  employeeId: selectedEmployeeId,
                  effectiveFrom: indivEffectiveFrom,
                  structureCode: currentCompensation.structureCode,
                  components: (currentCompensation.components ?? []).map((c) => ({
                    componentCode: c.componentCode,
                    calculationMethod: c.calculationMethod,
                    amount: c.calculationMethod === 'FIXED'
                      ? Math.round((c.derivedAmount ?? 0) * (1 + indivIncrementPct / 100))
                      : c.amount,
                    percentage: c.percentage,
                  })),
                  remarks: indivRemarks,
                  createdBy: '',
                });
              }}
              disabled={!currentCompensation}
            >
              Preview
            </Button>
            <Button
              type="primary"
              loading={submittingIndiv}
              onClick={handleSubmitIndiv}
              disabled={!currentCompensation?.handle || currentCompensation.status !== 'DRAFT'}
            >
              Submit for Approval
            </Button>
          </div>

          {previewCompensation && (
            <CompensationPreview data={previewCompensation} />
          )}
        </Card>
      )}

      {/* Bulk Upload */}
      {revisionMode === 'bulk' && (
        <Card size="small" className={styles.bulkCard}>
          <div className={styles.bulkToolbar}>
            <Button
              icon={<DownloadIcon style={{ fontSize: 14 }} />}
              size="small"
              onClick={() => {
                // Trigger template download
                const link = document.createElement('a');
                link.href = '/templates/salary-revision-template.xlsx';
                link.download = 'salary-revision-template.xlsx';
                link.click();
              }}
            >
              Download Template
            </Button>
            <Upload
              accept=".xlsx"
              showUploadList={false}
              beforeUpload={() => false}
            >
              <Button icon={<UploadIcon style={{ fontSize: 14 }} />} size="small">
                Upload .xlsx
              </Button>
            </Upload>
            <DatePicker
              value={bulkEffectiveFrom ? dayjs(bulkEffectiveFrom) : null}
              onChange={(d) => setBulkEffectiveFrom(d ? d.format('YYYY-MM-DD') : '')}
              placeholder="Effective Date"
              format="DD-MMM-YYYY"
              size="small"
            />
            <Button size="small" type="primary" disabled={revisionRows.length === 0}>
              Process
            </Button>
          </div>

          {revisionLoading ? (
            <div className={compensationStyles.loadingContainer}>
              <Spin />
            </div>
          ) : revisionRows.length === 0 ? (
            <div className={compensationStyles.emptyContainer}>
              <Typography.Text type="secondary">
                Upload an Excel file or search for employees to begin a revision.
              </Typography.Text>
            </div>
          ) : (
            <>
              <Table
                dataSource={revisionRows}
                rowKey="employeeId"
                columns={bulkColumns}
                size="small"
                pagination={false}
                rowSelection={{
                  selectedRowKeys: selectedRevisionIds,
                  onChange: (keys) => setSelectedRevisionIds(keys as string[]),
                }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5}>
                        <div className={styles.footerRow}>
                          <span className={styles.footerStat}>
                            Selected: <span className={styles.footerStatValue}>{selectedRows.length}</span>
                          </span>
                          <span className={styles.footerStat}>
                            Total New Basic:
                            <span className={styles.footerStatValue}>{formatINRPlain(totalNewBasic)}</span>
                          </span>
                          <span className={styles.footerStat}>
                            Total New Gross:
                            <span className={styles.footerStatValue}>{formatINRPlain(totalNewGross)}</span>
                          </span>
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />

              <div className={styles.tableActions}>
                <Space>
                  <Button size="small" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button
                    size="small"
                    disabled={selectedRevisionIds.length === 0}
                    onClick={() => {
                      // Preview selected — show first selected employee
                    }}
                  >
                    Preview Selected
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    loading={revisionLoading}
                    disabled={selectedRevisionIds.length === 0}
                    onClick={submitBulkRevision}
                  >
                    Submit All for Approval
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default SalaryRevisionTable;
