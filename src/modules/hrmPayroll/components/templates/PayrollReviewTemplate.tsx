'use client';

import React from 'react';
import { Typography } from 'antd';

interface PayrollReviewTemplateProps {
  runSelectorPanel: React.ReactNode;
  reviewTablePanel: React.ReactNode;
  detailPanel?: React.ReactNode;
}

const PayrollReviewTemplate: React.FC<PayrollReviewTemplateProps> = ({
  runSelectorPanel,
  reviewTablePanel,
  detailPanel,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: detailPanel ? '1fr 420px' : '1fr',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', padding: 16 }}>
        <div>{runSelectorPanel}</div>
        <div>{reviewTablePanel}</div>
      </div>
      {detailPanel ? (
        <div
          style={{
            borderLeft: '1px solid #f0f0f0',
            overflowY: 'auto',
            padding: 16,
            background: '#fafafa',
          }}
        >
          {detailPanel}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            color: '#8c8c8c',
          }}
        >
          <Typography.Text type="secondary">Select an employee to view payslip details</Typography.Text>
        </div>
      )}
    </div>
  );
};

export default PayrollReviewTemplate;
