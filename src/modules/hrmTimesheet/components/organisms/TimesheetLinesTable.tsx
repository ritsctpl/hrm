'use client';
import { Empty, Select, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { HOURS_STEP } from '../../utils/timesheetConstants';
import TimesheetLineRow from '../molecules/TimesheetLineRow';
import Can from '../../../hrmAccess/components/Can';
import type { TimesheetLine, UnplannedCategory, AllocationForDay } from '../../types/domain.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text } = Typography;

interface Props {
  lines: TimesheetLine[];
  allocations: AllocationForDay[];
  categories: UnplannedCategory[];
  readOnly?: boolean;
  onUpdate?: (lineId: string, partial: Partial<TimesheetLine>) => void;
  onRemove?: (lineId: string) => void;
  onAddLine?: (line: TimesheetLine) => void;
}

const ADD_TYPE_OPTIONS = [
  { value: 'PROJECT', label: 'Project Work' },
  { value: 'UNPLANNED', label: 'Unplanned Work' },
  { value: 'HOLIDAY_WORKING', label: 'Holiday Working' },
];

export default function TimesheetLinesTable({
  lines,
  allocations,
  categories,
  readOnly,
  onUpdate,
  onRemove,
  onAddLine,
}: Props) {
  const totalHours = lines.reduce((s, l) => s + l.hours, 0);

  function handleAddLine(lineType: TimesheetLine['lineType']) {
    const newLine: TimesheetLine = {
      lineId: uuidv4(),
      lineType,
      hours: HOURS_STEP,
      overrun: false,
    };
    if (lineType === 'PROJECT' && allocations.length > 0) {
      const first = allocations[0];
      newLine.projectHandle = first.projectHandle;
      newLine.projectCode = first.projectCode;
      newLine.projectName = first.projectName;
      newLine.allocationHandle = first.allocationHandle;
      newLine.allocatedHoursForDay = first.allocatedHoursForDay;
    }
    onAddLine?.(newLine);
  }

  return (
    <div className={styles.linesSection}>
      <div className={styles.linesSectionHeader}>
        <Text strong>Lines</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Total: <strong>{totalHours.toFixed(1)} h</strong>
          </Text>
          {!readOnly && (
            <Can I="add">
              <Select
                size="small"
                placeholder="+ Add line"
                style={{ width: 160 }}
                options={ADD_TYPE_OPTIONS}
                value={null}
                onSelect={(v) => handleAddLine(v as TimesheetLine['lineType'])}
                suffixIcon={<PlusOutlined />}
              />
            </Can>
          )}
        </div>
      </div>
      {lines.length === 0 ? (
        <div className={styles.emptyState}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No lines — add one above" />
        </div>
      ) : (
        lines.map((line) => (
          <TimesheetLineRow
            key={line.lineId}
            line={line}
            allocations={allocations}
            categories={categories}
            readOnly={readOnly}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
}
