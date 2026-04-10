'use client';
import { Button, Space, Statistic, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text } = Typography;

interface Props {
  onSubmitWeek: () => Promise<void>;
}

export default function WeeklySubmitPanel({ onSubmitWeek }: Props) {
  const { weekSummary, submittingWeek } = useHrmTimesheetStore();

  const pendingDays = weekSummary?.pendingDays ?? 0;

  return (
    <div className={styles.weeklyPanel}>
      <div className={styles.weekSummaryRow}>
        <div className={styles.weekStatItem}>
          <span className={styles.weekStatValue} style={{ color: '#1677ff' }}>
            {weekSummary?.weeklyTotalHours?.toFixed(1) ?? '—'}
          </span>
          <span className={styles.weekStatLabel}>Total Hours</span>
        </div>
        <div className={styles.weekStatItem}>
          <span className={styles.weekStatValue} style={{ color: '#52c41a' }}>
            {weekSummary?.greenDays ?? 0}
          </span>
          <span className={styles.weekStatLabel}>Full Days</span>
        </div>
        <div className={styles.weekStatItem}>
          <span className={styles.weekStatValue} style={{ color: '#faad14' }}>
            {weekSummary?.yellowDays ?? 0}
          </span>
          <span className={styles.weekStatLabel}>Partial Days</span>
        </div>
        <div className={styles.weekStatItem}>
          <span className={styles.weekStatValue} style={{ color: '#ff4d4f' }}>
            {weekSummary?.redDays ?? 0}
          </span>
          <span className={styles.weekStatLabel}>Low Days</span>
        </div>
        <div className={styles.weekStatItem}>
          <span className={styles.weekStatValue} style={{ color: '#722ed1' }}>
            {weekSummary?.submittedDays ?? 0}
          </span>
          <span className={styles.weekStatLabel}>Submitted</span>
        </div>
        <div className={styles.weekStatItem}>
          <span className={styles.weekStatValue} style={{ color: '#8c8c8c' }}>
            {pendingDays}
          </span>
          <span className={styles.weekStatLabel}>Pending</span>
        </div>
      </div>

      {pendingDays > 0 && (
        <Space>
          <Text type="secondary">
            {pendingDays} day{pendingDays > 1 ? 's' : ''} not yet submitted
          </Text>
          <Can I="edit">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={onSubmitWeek}
              loading={submittingWeek}
            >
              Submit Entire Week
            </Button>
          </Can>
        </Space>
      )}

      {pendingDays === 0 && weekSummary && (
        <Text type="success">
          <CheckCircleOutlined /> All days submitted for this week
        </Text>
      )}
    </div>
  );
}
