'use client';

import React from 'react';
import { Timeline, Typography } from 'antd';
import type { EmployeeCompensationResponse } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CompensationStatusTag from '../atoms/CompensationStatusTag';

interface RevisionHistoryTimelineProps {
  history: EmployeeCompensationResponse[];
}

const RevisionHistoryTimeline: React.FC<RevisionHistoryTimelineProps> = ({ history }) => {
  if (!history.length) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        No revision history available
      </Typography.Text>
    );
  }

  const items = history.map((entry) => ({
    key: entry.handle,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            #{entry.revisionNumber}
          </Typography.Text>
          <CompensationStatusTag status={entry.status} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {entry.effectiveFrom}
          </Typography.Text>
        </div>
        <Typography.Text style={{ fontSize: 13 }}>
          Gross: {formatINRPlain(entry.grossEarnings)} &nbsp;|&nbsp;
          Net: {formatINRPlain(entry.netPay)}
        </Typography.Text>
        {entry.remarks && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {entry.remarks}
          </Typography.Text>
        )}
      </div>
    ),
  }));

  return <Timeline items={items} style={{ paddingTop: 8 }} />;
};

export default RevisionHistoryTimeline;
