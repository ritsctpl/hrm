'use client';

import React from 'react';
import { Statistic } from 'antd';
import type { EmployeeCompensationResponse } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import styles from '../../styles/Compensation.module.css';

interface CompensationSummaryBarProps {
  data: EmployeeCompensationResponse;
}

const CompensationSummaryBar: React.FC<CompensationSummaryBarProps> = ({ data }) => {
  return (
    <div className={styles.summaryBar}>
      <Statistic
        title="Gross Earnings"
        value={formatINRPlain(data.grossEarnings)}
        valueStyle={{ color: '#52c41a', fontSize: 16 }}
      />
      <Statistic
        title="Total Deductions"
        value={formatINRPlain(data.totalDeductions)}
        valueStyle={{ color: '#ff4d4f', fontSize: 16 }}
      />
      <Statistic
        title="NET PAY"
        value={formatINRPlain(data.netPay)}
        valueStyle={{ color: '#1890ff', fontSize: 20, fontWeight: 700 }}
      />
      <Statistic
        title="Monthly CTC"
        value={formatINRPlain(data.monthlyCTC)}
        valueStyle={{ fontSize: 16 }}
      />
      <Statistic
        title="Annual CTC"
        value={formatINRPlain(data.annualCTC)}
        valueStyle={{ fontSize: 16 }}
      />
    </div>
  );
};

export default CompensationSummaryBar;
