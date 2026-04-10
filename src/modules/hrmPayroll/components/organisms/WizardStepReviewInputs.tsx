'use client';

import React, { useState } from 'react';
import { Card, Checkbox, Table, InputNumber, Button, Select, Input, Modal, Form, Space, Typography } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import type { PayrollAdjustmentDraft } from '../../stores/payrollStore';
import AdjustmentRow from '../molecules/AdjustmentRow';
import { ADJUSTMENT_TYPES } from '../../utils/payrollConstants';
import type { AdjustmentType } from '../../types/api.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/PayrollWizard.module.css';

const { Text } = Typography;

const READINESS_ITEMS = [
  { key: 'compensationDataReady', label: 'Compensation Data Ready' },
  { key: 'leaveLedgerReady', label: 'Leave Ledger Finalized' },
  { key: 'timesheetReady', label: 'Timesheet Closed' },
  { key: 'holidayCalendarReady', label: 'Holiday Calendar Set' },
] as const;

interface LopRow {
  key: string;
  employeeId: string;
  employeeName: string;
  lopDays: number;
  overtimeHours: number;
}

const WizardStepReviewInputs: React.FC = () => {
  const store = useHrmPayrollStore();
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjForm] = Form.useForm();

  const runSummary = store.wizardRunSummary;

  const lopData: LopRow[] = store.includedEmployeeIds.map((id) => ({
    key: id,
    employeeId: id,
    employeeName: id,
    lopDays: store.lopInputs[id] ?? 0,
    overtimeHours: 0,
  }));

  const lopColumns = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    {
      title: 'LOP Days',
      key: 'lopDays',
      render: (_: unknown, record: LopRow) => (
        <InputNumber
          min={0}
          max={31}
          value={store.lopInputs[record.employeeId] ?? 0}
          onChange={(v) => store.updateLopInput(record.employeeId, v ?? 0)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Overtime Hrs',
      key: 'overtimeHours',
      render: () => (
        <InputNumber min={0} defaultValue={0} style={{ width: 80 }} />
      ),
    },
  ];

  const handleAddAdjustment = () => {
    adjForm.validateFields().then((vals) => {
      const adj: PayrollAdjustmentDraft = {
        employeeId: vals.employeeId,
        employeeName: vals.employeeId,
        adjustmentType: vals.adjustmentType,
        description: vals.description,
        amount: vals.amount,
      };
      store.addAdjustment(adj);
      adjForm.resetFields();
      setAdjModalOpen(false);
    });
  };

  return (
    <div className={styles.stepContent}>
      {/* Readiness Checklist */}
      <Card title="Input Readiness Checklist" className={styles.stepCard} style={{ marginBottom: 12 }}>
        <div className={styles.checklistGrid}>
          {READINESS_ITEMS.map((item) => (
            <Checkbox
              key={item.key}
              checked={runSummary ? runSummary[item.key] : false}
              disabled
            >
              {item.label}
            </Checkbox>
          ))}
        </div>
      </Card>

      {/* LOP Table */}
      <Card title="LOP & Adjustments" className={styles.stepCard} style={{ marginBottom: 12 }}>
        <Table<LopRow>
          dataSource={lopData}
          columns={lopColumns}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ y: 240 }}
          locale={{ emptyText: 'No employees included.' }}
        />
      </Card>

      {/* Manual Adjustments */}
      <Card
        title="Manual Adjustments"
        className={styles.stepCard}
        extra={
          <Can I="add">
            <Button
              size="small"
              icon={<AddIcon fontSize="small" />}
              onClick={() => setAdjModalOpen(true)}
            >
              Add Adjustment
            </Button>
          </Can>
        }
      >
        {store.adjustments.length === 0 ? (
          <Text type="secondary">No adjustments added.</Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {store.adjustments.map((adj, idx) => (
              <AdjustmentRow
                key={idx}
                adjustment={adj}
                index={idx}
                onDelete={store.removeAdjustment}
              />
            ))}
          </Space>
        )}
      </Card>

      {/* Add Adjustment Modal */}
      <Modal
        title="Add Manual Adjustment"
        open={adjModalOpen}
        onOk={handleAddAdjustment}
        onCancel={() => setAdjModalOpen(false)}
        okText="Add"
      >
        <Form form={adjForm} layout="vertical">
          <Form.Item label="Employee ID" name="employeeId" rules={[{ required: true }]}>
            <Input placeholder="e.g. EMP001" />
          </Form.Item>
          <Form.Item label="Type" name="adjustmentType" rules={[{ required: true }]}>
            <Select
              options={ADJUSTMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Q4 Performance Bonus" />
          </Form.Item>
          <Form.Item label="Amount (INR)" name="amount" rules={[{ required: true }]}>
            <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WizardStepReviewInputs;
