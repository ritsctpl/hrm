'use client';
import { Button, Input, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { CopyOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import TimesheetLinesTable from './TimesheetLinesTable';
import type { TimesheetLine } from '../../types/domain.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Title, Text } = Typography;

interface Props {
  onSave: (notes?: string) => Promise<void>;
  onSubmit: () => Promise<void>;
  onCopyFromPrev: () => Promise<void>;
}

export default function DailyTimesheetEditor({ onSave, onSubmit, onCopyFromPrev }: Props) {
  const {
    selectedDate,
    currentDayTimesheet,
    allocationsForDay,
    unplannedCategories,
    loadingDay,
    savingTimesheet,
    submittingTimesheet,
    addLineToCurrentDay,
    removeLineFromCurrentDay,
    updateLineInCurrentDay,
  } = useHrmTimesheetStore();

  const isReadOnly =
    currentDayTimesheet?.status === 'SUBMITTED' ||
    currentDayTimesheet?.status === 'APPROVED';

  const isHolidayOrLeave =
    currentDayTimesheet?.isHoliday || currentDayTimesheet?.isLeaveDay;

  const lines = currentDayTimesheet?.lines ?? [];

  if (loadingDay) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className={styles.dayEditor}>
      <div className={styles.dayEditorHeader}>
        <Space align="center">
          <Title level={5} style={{ margin: 0 }}>
            {dayjs(selectedDate).format('dddd, DD MMM YYYY')}
          </Title>
          {currentDayTimesheet?.status && (
            <TimesheetStatusBadge status={currentDayTimesheet.status} />
          )}
          {currentDayTimesheet?.isHoliday && <Tag color="blue">Holiday</Tag>}
          {currentDayTimesheet?.isLeaveDay && <Tag color="orange">Leave{currentDayTimesheet.leaveType ? `: ${currentDayTimesheet.leaveType}` : ''}</Tag>}
        </Space>

        {!isReadOnly && !isHolidayOrLeave && (
          <div className={styles.dayEditorActions}>
            <Tooltip title="Copy lines from previous working day">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={onCopyFromPrev}
                loading={savingTimesheet}
                disabled={lines.length > 0}
              >
                Copy prev day
              </Button>
            </Tooltip>
            <Button
              size="small"
              icon={<SaveOutlined />}
              onClick={() => onSave()}
              loading={savingTimesheet}
            >
              Save
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<SendOutlined />}
              onClick={onSubmit}
              loading={submittingTimesheet}
              disabled={lines.length === 0}
            >
              Submit
            </Button>
          </div>
        )}
      </div>

      {isHolidayOrLeave ? (
        <div className={styles.emptyState}>
          <Text type="secondary">
            {currentDayTimesheet?.isHoliday ? 'Holiday — no timesheet required' : 'Leave day — no timesheet required'}
          </Text>
        </div>
      ) : (
        <TimesheetLinesTable
          lines={lines}
          allocations={allocationsForDay}
          categories={unplannedCategories}
          readOnly={isReadOnly}
          onUpdate={(lineId, partial) => updateLineInCurrentDay(lineId, partial)}
          onRemove={(lineId) => removeLineFromCurrentDay(lineId)}
          onAddLine={(line: TimesheetLine) => addLineToCurrentDay(line)}
        />
      )}

      {!isReadOnly && !isHolidayOrLeave && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Notes (optional)</Text>
          <Input.TextArea
            rows={2}
            placeholder="Notes for this day..."
            defaultValue={currentDayTimesheet?.notes ?? ''}
            style={{ marginTop: 4 }}
          />
        </div>
      )}
    </div>
  );
}
