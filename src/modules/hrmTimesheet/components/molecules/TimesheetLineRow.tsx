'use client';
import { InputNumber, Select, Input, Button, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { LINE_TYPE_LABELS, HOURS_STEP } from '../../utils/timesheetConstants';
import type { TimesheetLine, UnplannedCategory } from '../../types/domain.types';
import type { AllocationForDay } from '../../types/domain.types';
import styles from '../../styles/HrmTimesheet.module.css';

interface Props {
  line: TimesheetLine;
  allocations: AllocationForDay[];
  categories: UnplannedCategory[];
  readOnly?: boolean;
  onUpdate?: (lineId: string, partial: Partial<TimesheetLine>) => void;
  onRemove?: (lineId: string) => void;
}

export default function TimesheetLineRow({ line, allocations, categories, readOnly, onUpdate, onRemove }: Props) {
  const typeLabel = LINE_TYPE_LABELS[line.lineType] ?? line.lineType;

  return (
    <div className={styles.lineRow}>
      <span className={styles.lineType}>{typeLabel}</span>

      {line.lineType === 'PROJECT' && (
        <span className={styles.lineProject}>
          {line.projectCode ? `${line.projectCode} — ${line.projectName}` : '—'}
        </span>
      )}

      {line.lineType === 'UNPLANNED' && !readOnly && (
        <Select
          size="small"
          value={line.categoryId}
          onChange={(v) => onUpdate?.(line.lineId, { categoryId: v })}
          options={categories.map((c) => ({ label: c.label, value: c.handle }))}
          placeholder="Category"
          style={{ width: 160 }}
        />
      )}

      {line.lineType === 'UNPLANNED' && readOnly && (
        <span className={styles.lineCategory}>{line.categoryLabel ?? '—'}</span>
      )}

      {readOnly ? (
        <span className={styles.lineHours}>{line.hours.toFixed(1)} h</span>
      ) : (
        <InputNumber
          size="small"
          min={HOURS_STEP}
          max={24}
          step={HOURS_STEP}
          value={line.hours}
          onChange={(v) => onUpdate?.(line.lineId, { hours: v ?? HOURS_STEP })}
          style={{ width: 80 }}
        />
      )}

      {line.overrun && (
        <Tooltip title="Hours exceed allocation"><span className={styles.overrunBadge}>OVR</span></Tooltip>
      )}

      {(line.lineType === 'UNPLANNED' || line.reason) && !readOnly && (
        <Input
          size="small"
          placeholder="Reason"
          value={line.reason}
          onChange={(e) => onUpdate?.(line.lineId, { reason: e.target.value })}
          style={{ flex: 1 }}
        />
      )}

      {readOnly && line.reason && (
        <span className={styles.lineReason}>{line.reason}</span>
      )}

      {!readOnly && onRemove && (
        <Button size="small" icon={<DeleteOutlined />} danger onClick={() => onRemove(line.lineId)} />
      )}
    </div>
  );
}
