'use client';

import { Typography, Tag } from 'antd';
import type { ImportError } from '../../types/domain.types';

interface ImportPreviewRowProps {
  rowNumber: number;
  name: string;
  date: string;
  error?: ImportError;
}

export default function ImportPreviewRow({ rowNumber, name, date, error }: ImportPreviewRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
      <Typography.Text type="secondary" style={{ width: 32 }}>
        {rowNumber}
      </Typography.Text>
      <Typography.Text style={{ flex: 1 }}>{name}</Typography.Text>
      <Typography.Text style={{ width: 100 }}>{date}</Typography.Text>
      {error ? (
        <Tag color="error" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {error.errorMessage}
        </Tag>
      ) : (
        <Tag color="success">OK</Tag>
      )}
    </div>
  );
}
