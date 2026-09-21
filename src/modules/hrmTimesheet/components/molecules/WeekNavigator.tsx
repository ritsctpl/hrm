'use client';
import { Button, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { mondayOf, shiftWeekStart } from '../../utils/timesheetHelpers';

const { Text } = Typography;

export default function WeekNavigator() {
  const { selectedWeekStart, setSelectedWeekStart } = useHrmTimesheetStore();

  // Weeks run Mon→Sun; shiftWeekStart always lands on a Monday.
  const prevWeek = () => setSelectedWeekStart(shiftWeekStart(selectedWeekStart, -1));
  const nextWeek = () => setSelectedWeekStart(shiftWeekStart(selectedWeekStart, 1));

  const weekEnd = dayjs(selectedWeekStart).add(6, 'day');
  const currentWeekStart = mondayOf(dayjs().format('YYYY-MM-DD'));
  const isCurrentWeek = mondayOf(selectedWeekStart) === currentWeekStart;

  return (
    <Space>
      <Button size="small" icon={<LeftOutlined />} onClick={prevWeek} />
      <Text strong style={{ minWidth: 180, textAlign: 'center', display: 'inline-block' }}>
        {dayjs(selectedWeekStart).format('DD MMM')} — {weekEnd.format('DD MMM YYYY')}
      </Text>
      <Button
        size="small"
        icon={<RightOutlined />}
        onClick={nextWeek}
        disabled={isCurrentWeek}
      />
    </Space>
  );
}
