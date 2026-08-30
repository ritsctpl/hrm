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
      <div className={styles.sumGross}>
        <Statistic title="Gross Earnings" value={formatINRPlain(data.grossEarnings)} />
      </div>
      <div className={styles.sumDeduct}>
        <Statistic title="Total Deductions" value={formatINRPlain(data.totalDeductions)} />
      </div>
      <div className={styles.sumNet}>
        <Statistic title="NET PAY" value={formatINRPlain(data.netPay)} />
      </div>
      <div className={styles.sumMonthly}>
        <Statistic title="Monthly CTC" value={formatINRPlain(data.monthlyCTC)} />
      </div>
      <div className={styles.sumCtc}>
        <Statistic title="Annual CTC" value={formatINRPlain(data.annualCTC)} />
      </div>
    </div>
  );
};

export default CompensationSummaryBar;
