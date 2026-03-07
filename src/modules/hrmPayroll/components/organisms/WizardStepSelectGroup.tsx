'use client';

import React from 'react';
import { Card, Transfer, Statistic } from 'antd';
import type { TransferDirection } from 'antd/es/transfer';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import styles from '../../styles/PayrollWizard.module.css';

// Placeholder employee list — in production this would come from the employee service
const PLACEHOLDER_EMPLOYEES = Array.from({ length: 45 }, (_, i) => ({
  key: `EMP${String(i + 1).padStart(3, '0')}`,
  title: `Employee ${String(i + 1).padStart(3, '0')}`,
}));

const WizardStepSelectGroup: React.FC = () => {
  const store = useHrmPayrollStore();

  const handleChange = (nextTargetKeys: string[], _direction: TransferDirection) => {
    store.setIncludedEmployeeIds(nextTargetKeys);
  };

  const targetKeys =
    store.includedEmployeeIds.length > 0
      ? store.includedEmployeeIds
      : PLACEHOLDER_EMPLOYEES.map((e) => e.key);

  return (
    <div className={styles.stepContent}>
      <Card title="Employee Selection" className={styles.stepCard}>
        <Statistic
          title="Active employees found"
          value={PLACEHOLDER_EMPLOYEES.length}
          style={{ marginBottom: 16 }}
        />
        <Transfer
          dataSource={PLACEHOLDER_EMPLOYEES}
          titles={['Available', 'Included']}
          targetKeys={targetKeys}
          onChange={handleChange}
          render={(item) => item.title}
          listStyle={{ width: 280, height: 300 }}
          showSearch
        />
      </Card>
    </div>
  );
};

export default WizardStepSelectGroup;
