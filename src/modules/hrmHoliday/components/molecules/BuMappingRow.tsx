'use client';

import { Button, Typography, Tag } from 'antd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { HolidayBuMapping } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';

interface BuMappingRowProps {
  mapping: HolidayBuMapping;
  onRemove: (handle: string) => void;
  canRemove: boolean;
}

export default function BuMappingRow({ mapping, onRemove, canRemove }: BuMappingRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
      <Typography.Text style={{ minWidth: 120 }}>{mapping.buName}</Typography.Text>
      <Typography.Text type="secondary" style={{ minWidth: 100 }}>
        {mapping.deptName ?? '—'}
      </Typography.Text>
      {mapping.primaryFlag && <Tag color="blue">Primary</Tag>}
      {canRemove && (
        <Can I="delete">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlineIcon style={{ fontSize: 16 }} />}
            onClick={() => onRemove(mapping.handle)}
          />
        </Can>
      )}
    </div>
  );
}
