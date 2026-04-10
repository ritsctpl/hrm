'use client';

import React, { useState } from 'react';
import { Card, Form, Select, DatePicker, Alert, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import { PAYROLL_MONTHS } from '../../utils/payrollConstants';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/PayrollWizard.module.css';

const WizardStepSelectMonth: React.FC = () => {
  const store = useHrmPayrollStore();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [payDate, setPayDate] = useState<string>('');

  const existingRun = store.allRuns.find(
    (r) => r.payrollYear === year && r.payrollMonth === month
  );

  const handleCreate = async () => {
    if (!payDate) return;
    try {
      await store.createPayrollRun(year, month, payDate);
      store.setWizardStep(1);
    } catch {
      // notification handled inside store
    }
  };

  const handleResume = () => {
    if (existingRun) {
      store.setWizardRunId(existingRun.runId);
      store.setWizardStep(1);
    }
  };

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({
    value: y,
    label: String(y),
  }));

  return (
    <div className={styles.stepContent}>
      <Card title="Payroll Period" className={styles.stepCard}>
        <Form layout="vertical">
          <Form.Item label="Payroll Year" required>
            <Select
              value={year}
              onChange={setYear}
              options={yearOptions}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="Payroll Month" required>
            <Select
              value={month}
              onChange={setMonth}
              options={PAYROLL_MONTHS.map((m) => ({ value: m.value, label: m.label }))}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="Pay Date" required>
            <DatePicker
              value={payDate ? dayjs(payDate) : null}
              onChange={(d) => setPayDate(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: 200 }}
            />
          </Form.Item>
        </Form>

        {existingRun && (
          <Alert
            type="warning"
            message={`A run for ${PAYROLL_MONTHS.find((m) => m.value === month)?.label} ${year} already exists: ${existingRun.runId}`}
            action={
              <Can I="edit">
                <Button size="small" onClick={handleResume}>
                  Resume Run
                </Button>
              </Can>
            }
            style={{ marginBottom: 12 }}
          />
        )}

        <Space>
          <Can I="add">
            <Button
              type="primary"
              onClick={handleCreate}
              disabled={!payDate || !!existingRun}
            >
              Create New Run
            </Button>
          </Can>
        </Space>
      </Card>
    </div>
  );
};

export default WizardStepSelectMonth;
