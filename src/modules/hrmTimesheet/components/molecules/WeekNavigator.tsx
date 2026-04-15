'use client';
import { Button, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';

const { Text } = Typography;

function getMondayOf(d: dayjs.Dayjs): dayjs.Dayjs {
  const day = d.day();
  const diff = day === 0 ? -6 : 1 - day;
  return d.add(diff, 'day').startOf('day');
}

export default function WeekNavigator() {
  const { selectedWeekStart, setSelectedWeekStart } = useHrmTimesheetStore();

  const prevWeek = () => setSelectedWeekStart(dayjs(selectedWeekStart).subtract(7, 'day').format('YYYY-MM-DD'));
  const nextWeek = () => setSelectedWeekStart(dayjs(selectedWeekStart).add(7, 'day').format('YYYY-MM-DD'));

  const weekEnd = dayjs(selectedWeekStart).add(6, 'day');
  const currentWeekStart = getMondayOf(dayjs());
  const isCurrentWeek = dayjs(selectedWeekStart).isSame(currentWeekStart, 'day');

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
