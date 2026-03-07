'use client';

import React from 'react';
import { Divider } from 'antd';
import type { CompensationPreviewProps } from '../../types/ui.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import previewStyles from '../../styles/CompensationPreview.module.css';

const CompensationPreview: React.FC<CompensationPreviewProps> = ({ data }) => {
  const earnings = (data.components ?? []).filter((c) => c.componentType === 'EARNING');
  const deductions = (data.components ?? []).filter((c) => c.componentType === 'DEDUCTION');

  return (
    <div className={previewStyles.previewCard}>
      <div className={previewStyles.previewTitle}>Salary Preview</div>

      {earnings.length > 0 && (
        <>
          <div className={previewStyles.sectionHeader}>Earnings</div>
          {earnings.map((c) => (
            <div key={c.componentCode} className={previewStyles.previewRow}>
              <span className={previewStyles.previewRowName}>
                {c.componentName}
                {c.calculationMethod === 'PERCENTAGE' && c.percentage != null && (
                  <span style={{ color: '#8c8c8c', fontSize: 11, marginLeft: 4 }}>
                    ({c.percentage}%)
                  </span>
                )}
              </span>
              <span className={previewStyles.previewRowAmount}>
                {formatINRPlain(c.derivedAmount)}
              </span>
            </div>
          ))}
          <div className={previewStyles.previewDivider} />
          <div className={`${previewStyles.previewTotalRow} ${previewStyles.previewGross}`}>
            <span>Gross Earnings</span>
            <span>{formatINRPlain(data.grossEarnings)}</span>
          </div>
        </>
      )}

      {deductions.length > 0 && (
        <>
          <div className={previewStyles.sectionHeader}>Deductions</div>
          {deductions.map((c) => (
            <div key={c.componentCode} className={previewStyles.previewRow}>
              <span className={previewStyles.previewRowName}>{c.componentName}</span>
              <span className={`${previewStyles.previewRowAmount} ${previewStyles.previewDeduction}`}>
                {formatINRPlain(c.derivedAmount)}
              </span>
            </div>
          ))}
          <div className={previewStyles.previewDivider} />
          <div className={`${previewStyles.previewTotalRow} ${previewStyles.previewDeduction}`}>
            <span>Total Deductions</span>
            <span>{formatINRPlain(data.totalDeductions)}</span>
          </div>
        </>
      )}

      <Divider style={{ margin: '8px 0' }} />
      <div className={`${previewStyles.previewTotalRow} ${previewStyles.previewNet}`}>
        <span>NET PAY</span>
        <span>{formatINRPlain(data.netPay)}</span>
      </div>
    </div>
  );
};

export default CompensationPreview;
